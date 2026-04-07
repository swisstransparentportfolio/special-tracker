const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const REQUEST_TIMEOUT_MS = 4500;
const CACHE_TTL = 5 * 60 * 1000;

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

type YahooPoint = {
  date: string;
  rawDate: Date;
  value: number;
};

type CachedKpis = {
  data: KpiData;
  timestamp: number;
};

let cachedKpis: CachedKpis | null = null;
let inFlightRequest: Promise<KpiData> | null = null;

function isRateLimitedResponse(text: string) {
  const normalized = text.toLowerCase();
  return normalized.includes("too many requests") || normalized.includes("rate limit") || normalized.includes("limit exceeded");
}

async function fetchFromProxy(proxyUrl: string): Promise<Response> {
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Proxy request failed with status ${res.status}`);

  const text = await res.text();
  if (isRateLimitedResponse(text)) throw new Error("Proxy rate limited");

  return new Response(text, {
    status: 200,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

async function fetchWithProxy(url: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    let failedRequests = 0;
    let resolved = false;

    CORS_PROXIES.forEach((makeProxy) => {
      fetchFromProxy(makeProxy(url))
        .then((response) => {
          if (resolved) return;
          resolved = true;
          resolve(response);
        })
        .catch(() => {
          failedRequests += 1;
          if (failedRequests === CORS_PROXIES.length && !resolved) {
            reject(new Error("All proxies failed"));
          }
        });
    });
  });
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

async function fetchYahooChart(symbol: string, range = "6mo", interval = "1d"): Promise<YahooPoint[] | null> {
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

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildSP500WithMA(data: YahooPoint[] | null): SP500WithMA {
  if (!data) return { data: [] };

  const result = data.map((d, i) => {
    let ma: number | null = null;
    if (i >= 124) {
      const slice = data.slice(i - 124, i + 1);
      ma = parseFloat((slice.reduce((sum, point) => sum + point.value, 0) / 125).toFixed(2));
    }

    return {
      date: d.date,
      sp500: parseFloat(d.value.toFixed(2)),
      ma125: ma,
    };
  });

  return { data: result };
}

function buildStockVsBond(stockData: YahooPoint[] | null, bondData: YahooPoint[] | null) {
  if (!stockData || !bondData) return { data: [] };

  const stockByDay = new Map(stockData.map((point) => [toDayKey(point.rawDate), point]));
  const alignedData = bondData
    .map((bondPoint) => {
      const stockPoint = stockByDay.get(toDayKey(bondPoint.rawDate));
      if (!stockPoint) return null;

      return {
        date: bondPoint.date,
        stockValue: stockPoint.value,
        bondValue: bondPoint.value,
      };
    })
    .filter(
      (point): point is { date: string; stockValue: number; bondValue: number } => point !== null,
    );

  if (alignedData.length <= 20) return { data: [] };

  const result = alignedData.slice(20).map((point, index) => {
    const basePoint = alignedData[index];
    const stockReturn = ((point.stockValue - basePoint.stockValue) / basePoint.stockValue) * 100;
    const bondReturn = ((point.bondValue - basePoint.bondValue) / basePoint.bondValue) * 100;

    return {
      date: point.date,
      stocks: parseFloat(stockReturn.toFixed(2)),
      bonds: parseFloat(bondReturn.toFixed(2)),
    };
  });

  return { data: result };
}

async function fetchMarketKpisLive(): Promise<KpiData> {
  const [fearGreed, vix, sp500Data, bondData] = await Promise.all([
    fetchFearGreed(),
    fetchVIX(),
    fetchYahooChart("^GSPC", "1y", "1d").catch(() => null),
    fetchYahooChart("TLT", "3mo", "1d").catch(() => null),
  ]);

  return {
    fearGreed: fearGreed.value,
    fearGreedText: fearGreed.text,
    vix,
    putCallRatio: null,
    sp500WithMA: buildSP500WithMA(sp500Data),
    stockVsBond: buildStockVsBond(sp500Data, bondData),
  };
}

export function getCachedMarketKpis(): KpiData | null {
  return cachedKpis?.data ?? null;
}

export function hasFreshMarketKpis(ttl = CACHE_TTL): boolean {
  return cachedKpis !== null && Date.now() - cachedKpis.timestamp < ttl;
}

export function preloadMarketKpis() {
  if (hasFreshMarketKpis() || inFlightRequest) return;
  void fetchMarketKpis().catch(() => {});
}

export async function fetchMarketKpis({ force = false }: { force?: boolean } = {}): Promise<KpiData> {
  if (!force && hasFreshMarketKpis()) return cachedKpis!.data;
  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = fetchMarketKpisLive()
    .then((data) => {
      cachedKpis = {
        data,
        timestamp: Date.now(),
      };

      return data;
    })
    .catch((error) => {
      if (cachedKpis) return cachedKpis.data;
      throw error;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}
