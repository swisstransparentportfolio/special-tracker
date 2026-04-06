import { useState, useEffect, useRef } from "react";
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

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

async function fetchTickerData(symbol: string): Promise<Omit<TickerItem, "label">> {
  try {
    const targetUrl = `${YAHOO_BASE}/${symbol}?interval=1d&range=2d`;
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    if (!res.ok) return { symbol, price: null, change: null, changePercent: null };
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return { symbol, price: null, change: null, changePercent: null };

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    if (!price || !prevClose) return { symbol, price, change: null, changePercent: null };

    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;
    return { symbol, price, change, changePercent };
  } catch {
    return { symbol, price: null, change: null, changePercent: null };
  }
}

function formatPrice(price: number, symbol: string): string {
  if (["EURUSD=X", "EURGBP=X", "EURJPY=X", "EURAUD=X", "CHFEUR=X"].includes(symbol)) {
    return price.toFixed(4);
  }
  if (price > 10000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toFixed(2);
}

export default function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results = await Promise.all(
        SYMBOLS.map(async (s) => {
          const data = await fetchTickerData(s.symbol);
          return { ...data, label: s.label };
        })
      );
      if (!cancelled) setItems(results.filter((r) => r.price !== null));
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;

    let pos = 0;
    const speed = 0.5;

    function tick() {
      pos += speed;
      if (el) {
        const halfWidth = el.scrollWidth / 2;
        if (pos >= halfWidth) pos -= halfWidth;
        el.style.transform = `translateX(-${pos}px)`;
      }
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [items]);

  if (items.length === 0) return null;

  // Duplicate items for seamless loop
  const displayed = [...items, ...items];

  return (
    <div className="w-full overflow-hidden border-b border-border bg-card/80 backdrop-blur-sm">
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
