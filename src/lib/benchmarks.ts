const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

interface BenchmarkData {
  sp500Ytd: number | null;
  nasdaqYtd: number | null;
  sp500Current: number | null;
  nasdaqCurrent: number | null;
  lastUpdated: string;
}

async function fetchYtdReturn(symbol: string): Promise<{ ytd: number | null; current: number | null }> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const yearStart = Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000);
    const rawUrl = `${YAHOO_BASE}/${symbol}?period1=${yearStart}&period2=${now}&interval=1d`;
    const url = `${CORS_PROXY}${encodeURIComponent(rawUrl)}`;
    
    const res = await fetch(url);
    if (!res.ok) return { ytd: null, current: null };
    
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return { ytd: null, current: null };
    
    const opens = result.indicators?.quote?.[0]?.open;
    const closes = result.indicators?.quote?.[0]?.close;
    const meta = result.meta;
    
    if (!opens || !closes || opens.length === 0) return { ytd: null, current: null };
    
    const firstOpen = opens.find((v: number | null) => v !== null);
    const currentPrice = meta?.regularMarketPrice || closes[closes.length - 1];
    
    if (!firstOpen || !currentPrice) return { ytd: null, current: null };
    
    const ytd = ((currentPrice - firstOpen) / firstOpen) * 100;
    return { ytd: parseFloat(ytd.toFixed(2)), current: parseFloat(currentPrice.toFixed(2)) };
  } catch {
    return { ytd: null, current: null };
  }
}

export async function fetchBenchmarks(): Promise<BenchmarkData> {
  const [sp500, nasdaq] = await Promise.all([
    fetchYtdReturn("^GSPC"),
    fetchYtdReturn("^IXIC"),
  ]);

  return {
    sp500Ytd: sp500.ytd,
    nasdaqYtd: nasdaq.ytd,
    sp500Current: sp500.current,
    nasdaqCurrent: nasdaq.current,
    lastUpdated: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}
