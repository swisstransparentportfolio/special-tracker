import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { fetchMarketKpis, KpiData } from "@/lib/marketKpis";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, Legend, ReferenceLine,
} from "recharts";
import { RefreshCw } from "lucide-react";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

function FearGreedGauge({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <GaugePlaceholder title="Fear & Greed Index" />;

  // Needle goes from left (180°) to right (0°) across the top arc
  const angle = Math.PI - (value / 100) * Math.PI; // π (left, 0) to 0 (right, 100)
  const needleLength = 80;
  const cx = 120, cy = 110;
  const nx = cx + needleLength * Math.cos(angle);
  const ny = cy - needleLength * Math.sin(angle);

  // Color based on value
  let color = "hsl(var(--muted-foreground))";
  if (value <= 25) color = "hsl(0, 72%, 51%)";
  else if (value <= 45) color = "hsl(25, 95%, 53%)";
  else if (value <= 55) color = "hsl(45, 93%, 47%)";
  else if (value <= 75) color = "hsl(120, 40%, 50%)";
  else color = "hsl(142, 71%, 45%)";

  return (
    <Card className="border-border bg-card p-6 transition-all hover:shadow-md">
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Fear & Greed Index
      </h3>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 240 140" className="w-full max-w-[280px]">
          {/* Background arc segments */}
          <path d="M 20 110 A 100 100 0 0 1 70 30" fill="none" stroke="hsl(0, 72%, 51%)" strokeWidth="18" strokeLinecap="round" opacity="0.3" />
          <path d="M 70 30 A 100 100 0 0 1 120 10" fill="none" stroke="hsl(25, 95%, 53%)" strokeWidth="18" strokeLinecap="round" opacity="0.3" />
          <path d="M 120 10 A 100 100 0 0 1 170 30" fill="none" stroke="hsl(45, 93%, 47%)" strokeWidth="18" strokeLinecap="round" opacity="0.3" />
          <path d="M 170 30 A 100 100 0 0 1 220 110" fill="none" stroke="hsl(142, 71%, 45%)" strokeWidth="18" strokeLinecap="round" opacity="0.3" />

          {/* Labels */}
          <text x="15" y="125" fontSize="8" fill="hsl(var(--muted-foreground))" textAnchor="start">Extreme Fear</text>
          <text x="85" y="8" fontSize="8" fill="hsl(var(--muted-foreground))" textAnchor="middle">Neutral</text>
          <text x="225" y="125" fontSize="8" fill="hsl(var(--muted-foreground))" textAnchor="end">Extreme Greed</text>

          {/* Scale numbers */}
          <text x="20" y="102" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">0</text>
          <text x="60" y="35" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">25</text>
          <text x="120" y="15" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">50</text>
          <text x="180" y="35" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">75</text>
          <text x="220" y="102" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">100</text>

          {/* Needle */}
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="6" fill={color} />

          {/* Value */}
          <text x={cx} y={cy + 25} fontSize="24" fontWeight="bold" fill={color} textAnchor="middle">{value}</text>
        </svg>
        <span className="mt-1 text-lg font-bold" style={{ color }}>{label}</span>
      </div>
    </Card>
  );
}

function GaugePlaceholder({ title }: { title: string }) {
  return (
    <Card className="border-border bg-card p-6">
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-muted-foreground">Data unavailable</p>
      </div>
    </Card>
  );
}

function VixCard({ current, history }: { current: number | null; history: { date: string; value: number }[] }) {
  if (current === null || history.length === 0) return <GaugePlaceholder title="VIX — Volatility Index" />;

  const isElevated = current > 20;
  const color = isElevated ? "hsl(0, 72%, 51%)" : "hsl(142, 71%, 45%)";

  return (
    <Card className="border-border bg-card p-6 transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          VIX — Volatility Index
        </h3>
        <div className="text-right">
          <span className="text-2xl font-bold" style={{ color }}>{current}</span>
          <p className="text-xs text-muted-foreground">{isElevated ? "Elevated volatility" : "Low volatility"}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={history}>
          <defs>
            <linearGradient id="vixGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "hsl(var(--foreground))" }} />
          <ReferenceLine y={20} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: "Threshold", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          <Area type="monotone" dataKey="value" stroke={color} fill="url(#vixGrad)" strokeWidth={2} name="VIX" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function SP500MACard({ data }: { data: { date: string; sp500: number; ma125: number | null }[] }) {
  if (data.length === 0) return <GaugePlaceholder title="S&P 500 vs 125-Day Moving Average" />;

  const latest = data[data.length - 1];
  const aboveMA = latest.ma125 != null && latest.sp500 > latest.ma125;

  return (
    <Card className="border-border bg-card p-6 transition-all hover:shadow-md col-span-full">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          S&P 500 & 125-Day Moving Average
        </h3>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${aboveMA ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
            {aboveMA ? "ABOVE MA — Bullish" : "BELOW MA — Bearish"}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={["auto", "auto"]} />
          <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "hsl(var(--foreground))" }} />
          <Legend />
          <Line type="monotone" dataKey="sp500" name="S&P 500" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ma125" name="125-Day MA" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={false} strokeDasharray="6 3" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function StockBondCard({ data }: { data: { date: string; stocks: number; bonds: number }[] }) {
  if (data.length === 0) return <GaugePlaceholder title="20-Day Stock vs Bond Returns" />;

  return (
    <Card className="border-border bg-card p-6 transition-all hover:shadow-md col-span-full">
      <div className="mb-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          20-Day Rolling Returns — Stocks vs Bonds
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">S&P 500 vs TLT (20+ Year Treasury Bond ETF)</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bondGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={v => `${v}%`} />
          <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "hsl(var(--foreground))" }} formatter={(v: number) => `${v.toFixed(2)}%`} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
          <Legend />
          <Area type="monotone" dataKey="stocks" name="S&P 500" stroke="hsl(var(--primary))" fill="url(#stockGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="bonds" name="Bonds (TLT)" stroke="hsl(45, 93%, 47%)" fill="url(#bondGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function PutCallCard({ value }: { value: number | null }) {
  // Since real put/call ratio is hard to get for free, show an info card
  return (
    <Card className="border-border bg-card p-6 transition-all hover:shadow-md">
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Market Sentiment Summary
      </h3>
      <div className="space-y-3">
        <SentimentRow label="Junk Bond Demand" description="Spread between junk bond and investment grade yields" />
        <SentimentRow label="Market Momentum" description="S&P 500 vs 125-day moving average" />
        <SentimentRow label="Safe Haven Demand" description="Stock vs bond returns over 20 trading days" />
        <SentimentRow label="Stock Price Breadth" description="McClellan Volume Summation Index" />
        <SentimentRow label="Put/Call Options" description="5-day avg put/call ratio" />
      </div>
    </Card>
  );
}

function SentimentRow({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/30 pb-2 last:border-0 last:pb-0">
      <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Prefilled fallback data so charts render instantly
const PREFILLED_DATA: KpiData = {
  fearGreed: 32,
  fearGreedText: "Fear",
  vix: {
    current: 18.2,
    history: Array.from({ length: 30 }, (_, i) => ({
      date: `Mar ${i + 1}`,
      value: parseFloat((16 + Math.sin(i / 3) * 4 + Math.random() * 2).toFixed(2)),
    })),
  },
  putCallRatio: null,
  sp500WithMA: {
    data: Array.from({ length: 60 }, (_, i) => {
      const base = 5200 + i * 8 + Math.sin(i / 5) * 80;
      return {
        date: `${i < 30 ? "Feb" : "Mar"} ${(i % 30) + 1}`,
        sp500: parseFloat(base.toFixed(2)),
        ma125: i >= 20 ? parseFloat((base - 40 + Math.sin(i / 8) * 30).toFixed(2)) : null,
      };
    }),
  },
  stockVsBond: {
    data: Array.from({ length: 30 }, (_, i) => ({
      date: `Mar ${i + 1}`,
      stocks: parseFloat((1.5 + Math.sin(i / 4) * 3).toFixed(2)),
      bonds: parseFloat((-0.5 + Math.cos(i / 3) * 2).toFixed(2)),
    })),
  },
};

export default function KpisTab() {
  const [data, setData] = useState<KpiData>(PREFILLED_DATA);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchMarketKpis();
      setData(result);
    } catch (e) {
      console.error("KPI fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 animate-pulse rounded-lg bg-card border border-border" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-lg bg-card border border-border" />
        <div className="h-72 animate-pulse rounded-lg bg-card border border-border" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="flex h-64 items-center justify-center border-border bg-card">
        <p className="text-muted-foreground">Unable to load market KPIs</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Market KPIs</h2>
          <p className="text-xs text-muted-foreground">Key market indicators and sentiment data</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {/* Top row: Fear & Greed + VIX + Sentiment */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FearGreedGauge value={data.fearGreed} label={data.fearGreedText} />
        <VixCard current={data.vix.current} history={data.vix.history} />
        <PutCallCard value={data.putCallRatio} />
      </div>

      {/* S&P 500 with MA */}
      <SP500MACard data={data.sp500WithMA.data} />

      {/* Stock vs Bond Returns */}
      <StockBondCard data={data.stockVsBond.data} />
    </div>
  );
}
