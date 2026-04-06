import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  label: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

const SYMBOLS: { symbol: string; label: string }[] = [
  { symbol: "^DJI", label: "Dow Jones" },
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "Nasdaq" },
  { symbol: "^RUT", label: "Russell" },
  { symbol: "^VIX", label: "VIX" },
  { symbol: "^GDAXI", label: "DAX" },
  { symbol: "^FTSE", label: "FTSE 100" },
  { symbol: "^FCHI", label: "CAC 40" },
  { symbol: "^IBEX", label: "IBEX 35" },
  { symbol: "^STOXX50E", label: "STOXX 50" },
  { symbol: "^N225", label: "Nikkei 225" },
  { symbol: "000001.SS", label: "SSE" },
  { symbol: "^HSI", label: "HSI" },
  { symbol: "^BSESN", label: "SENSEX" },
  { symbol: "^NSEI", label: "NIFTY 50" },
  { symbol: "EURUSD=X", label: "EUR/USD" },
  { symbol: "EURGBP=X", label: "EUR/GBP" },
  { symbol: "EURJPY=X", label: "EUR/JPY" },
  { symbol: "EURAUD=X", label: "EUR/AUD" },
  { symbol: "CHFEUR=X", label: "CHF/EUR" },
  { symbol: "BTC-USD", label: "Bitcoin" },
  { symbol: "ETH-USD", label: "Ethereum" },
  { symbol: "SOL-USD", label: "Solana" },
  { symbol: "XRP-USD", label: "XRP" },
  { symbol: "DOGE-USD", label: "Dogecoin" },
  { symbol: "YM=F", label: "Dow Futures" },
  { symbol: "ES=F", label: "S&P Futures" },
  { symbol: "NQ=F", label: "Nasdaq Futures" },
  { symbol: "GC=F", label: "Gold" },
  { symbol: "CL=F", label: "Crude Oil" },
];

const LABEL_MAP = Object.fromEntries(SYMBOLS.map((s) => [s.symbol, s.label]));

const FX_SYMBOLS = ["EURUSD=X", "EURGBP=X", "EURJPY=X", "EURAUD=X", "CHFEUR=X"];

function formatPrice(price: number, symbol: string): string {
  if (FX_SYMBOLS.includes(symbol)) return price.toFixed(4);
  if (price > 10000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toFixed(2);
}

// Fetch quotes using v8/chart endpoint (v7 is blocked)
async function fetchAllQuotes(): Promise<TickerItem[]> {
  // Fetch in parallel batches of 6 to avoid overwhelming the proxy
  const BATCH_SIZE = 6;
  const allResults: TickerItem[] = [];

  for (let i = 0; i < SYMBOLS.length; i += BATCH_SIZE) {
    const batch = SYMBOLS.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (s) => {
        try {
          const rawUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s.symbol)}?interval=1d&range=2d`;
          const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(rawUrl)}`);
          if (!res.ok) return null;
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta) return null;
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || meta.previousClose;
          if (!price || !prevClose) return null;
          const change = price - prevClose;
          const changePercent = (change / prevClose) * 100;
          return { symbol: s.symbol, label: s.label, price, change, changePercent } as TickerItem;
        } catch {
          return null;
        }
      })
    );
    allResults.push(...results.filter((r): r is TickerItem => r !== null));
  }

  return allResults;
}

const CACHE_KEY = "marketTickerCache";

function getCachedItems(): TickerItem[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

function setCachedItems(items: TickerItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(items));
  } catch {}
}

export default function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>(getCachedItems);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartPos = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = await fetchAllQuotes();
      if (!cancelled && results.length > 0) {
        setItems(results);
        setCachedItems(results);
      }
    }
    load();
    const interval = setInterval(load, 15 * 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;

    const speed = 0.5;

    function tick() {
      if (!isDragging.current && el) {
        posRef.current += speed;
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 0 && posRef.current >= halfWidth) posRef.current -= halfWidth;
        el.style.transform = `translateX(-${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [items]);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartPos.current = posRef.current;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const diff = dragStartX.current - e.clientX;
    let newPos = dragStartPos.current + diff;
    const halfWidth = el.scrollWidth / 2;
    if (halfWidth > 0) {
      while (newPos < 0) newPos += halfWidth;
      while (newPos >= halfWidth) newPos -= halfWidth;
    }
    posRef.current = newPos;
    el.style.transform = `translateX(-${posRef.current}px)`;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (items.length === 0) return null;

  const displayed = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden border-b border-border bg-card/80 backdrop-blur-sm select-none cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div ref={scrollRef} className="flex whitespace-nowrap py-2" style={{ willChange: "transform" }}>
        {displayed.map((item, i) => {
          const isPositive = (item.changePercent ?? 0) >= 0;
          return (
            <div key={`${item.symbol}-${i}`} className="inline-flex items-center gap-3 px-4 border-r border-border last:border-r-0">
              <div className={`flex h-7 w-7 items-center justify-center rounded-md ${
                isPositive ? "bg-success/15" : "bg-destructive/15"
              }`}>
                {isPositive ? (
                  <ArrowUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 text-destructive" />
                )}
              </div>
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{item.label}</span>
                  <span className={`text-xs font-medium ${isPositive ? "text-success" : "text-destructive"}`}>
                    {isPositive ? "+" : ""}{item.changePercent?.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatPrice(item.price!, item.symbol)}</span>
                  <span className={`text-xs ${isPositive ? "text-success" : "text-destructive"}`}>
                    {isPositive ? "+" : ""}{item.change?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
