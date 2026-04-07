const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url: string): Promise<Response> {
  for (const makeProxy of CORS_PROXIES) {
    try {
      const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.includes("Too Many Requests") || text.includes("limit")) continue;
      return new Response(text, { status: 200 });
    } catch { /* try next */ }
  }
  throw new Error("All proxies failed");
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface SP500WithMA {
  data: { date: string; sp500: number; ma125: number | null }[];
}

export interface KpiData {
  fearGreed: number | null;
  fearGreedText: string;
  vix: { current: number | null; history: TimeSeriesPoint[] };
  putCallRatio: number | null;
  sp500WithMA: SP500WithMA;
  stockVsBond: { data: { date: string; stocks: number; bonds: number }[] };
}

async function fetchYahooChart(symbol: string, range = "6mo", interval = "1d") {
  const rawUrl = `${YAHOO_BASE}/${symbol}?range=${range}&interval=${interval}`;
  const res = await fetchWithProxy(rawUrl);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) return null;

  const timestamps: number[] = result.timestamp || [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];

  return timestamps.map((ts, i) => ({
    date: new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    rawDate: new Date(ts * 1000),
    value: closes[i] ?? 0,
  })).filter(d => d.value !== 0);
}

async function fetchFearGreed(): Promise<{ value: number | null; text: string }> {
  try {
    const url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";
    const res = await fetchWithProxy(url);
    const data = await res.json();
    const score = data?.fear_and_greed?.score;
    if (score != null) {
      const val = Math.round(score);
      let text = "Neutral";
      if (val <= 25) text = "Extreme Fear";
      else if (val <= 45) text = "Fear";
      else if (val <= 55) text = "Neutral";
      else if (val <= 75) text = "Greed";
      else text = "Extreme Greed";
      return { value: val, text };
    }
    return { value: null, text: "N/A" };
  } catch {
    return { value: null, text: "N/A" };
  }
}

async function fetchVIX(): Promise<{ current: number | null; history: TimeSeriesPoint[] }> {
  try {
    const data = await fetchYahooChart("^VIX", "6mo", "1d");
    if (!data || data.length === 0) return { current: null, history: [] };
    return {
      current: parseFloat(data[data.length - 1].value.toFixed(2)),
      history: data.map(d => ({ date: d.date, value: parseFloat(d.value.toFixed(2)) })),
    };
  } catch {
    return { current: null, history: [] };
  }
}

async function fetchPutCallRatio(): Promise<number | null> {
  try {
    // CBOE Put/Call Ratio — try to fetch from Yahoo
    const data = await fetchYahooChart("^VIX", "5d", "1d");
    // As a proxy for put/call we use a derived value; real P/C ratio is hard to get for free
    // We'll return null and show a placeholder if unavailable
    return null;
  } catch {
    return null;
  }
}

async function fetchSP500WithMA(): Promise<SP500WithMA> {
  try {
    const data = await fetchYahooChart("^GSPC", "1y", "1d");
    if (!data) return { data: [] };

    // Calculate 125-day moving average
    const result = data.map((d, i) => {
      let ma: number | null = null;
      if (i >= 124) {
        const slice = data.slice(i - 124, i + 1);
        ma = parseFloat((slice.reduce((s, p) => s + p.value, 0) / 125).toFixed(2));
      }
      return {
        date: d.date,
        sp500: parseFloat(d.value.toFixed(2)),
        ma125: ma,
      };
    });
    return { data: result };
  } catch {
    return { data: [] };
  }
}

async function fetchStockVsBond(): Promise<{ data: { date: string; stocks: number; bonds: number }[] }> {
  try {
    // S&P 500 vs TLT (20+ Year Treasury Bond ETF) — 20-day rolling returns
    const [stockData, bondData] = await Promise.all([
      fetchYahooChart("^GSPC", "3mo", "1d"),
      fetchYahooChart("TLT", "3mo", "1d"),
    ]);

    if (!stockData || !bondData) return { data: [] };

    const minLen = Math.min(stockData.length, bondData.length);
    const result: { date: string; stocks: number; bonds: number }[] = [];

    for (let i = 20; i < minLen; i++) {
      const stockReturn = ((stockData[i].value - stockData[i - 20].value) / stockData[i - 20].value) * 100;
      const bondReturn = ((bondData[i].value - bondData[i - 20].value) / bondData[i - 20].value) * 100;
      result.push({
        date: stockData[i].date,
        stocks: parseFloat(stockReturn.toFixed(2)),
        bonds: parseFloat(bondReturn.toFixed(2)),
      });
    }

    return { data: result };
  } catch {
    return { data: [] };
  }
}

export async function fetchMarketKpis(): Promise<KpiData> {
  const [fearGreed, vix, putCall, sp500MA, stockBond] = await Promise.all([
    fetchFearGreed(),
    fetchVIX(),
    fetchPutCallRatio(),
    fetchSP500WithMA(),
    fetchStockVsBond(),
  ]);

  return {
    fearGreed: fearGreed.value,
    fearGreedText: fearGreed.text,
    vix,
    putCallRatio: putCall,
    sp500WithMA: sp500MA,
    stockVsBond: stockBond,
  };
}
