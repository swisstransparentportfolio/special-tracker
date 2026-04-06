import { SheetData } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid,
} from "recharts";
import { useState, useMemo } from "react";

interface Props {
  rentabilidadData: SheetData | null;
  loading: boolean;
  benchmarks?: any;
}

const PERIOD_FILTERS = ["YTD", "1Y", "2Y", "3Y", "Since Inception", "Annualized CAGR"];

function parseVal(s: string | undefined): number {
  if (!s) return 0;
  return parseFloat(s.replace(",", ".").replace("%", "").replace("+", "")) || 0;
}

function formatPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function compoundReturns(returns: number[]): number {
  if (returns.length === 0) return 0;
  return (returns.reduce((acc, r) => acc * (1 + r / 100), 1) - 1) * 100;
}

function annualizedCagr(returns: number[]): number {
  if (returns.length === 0) return 0;
  const product = returns.reduce((acc, r) => acc * (1 + r / 100), 1);
  return (Math.pow(product, 1 / returns.length) - 1) * 100;
}

interface ParsedRow {
  name: string;
  portfolio: number;
  sp500: number;
  nasdaq: number;
  isYtd: boolean;
  year: number | null;
}

export default function RentabilidadTab({ rentabilidadData, loading }: Props) {
  const [activePeriod, setActivePeriod] = useState("Since Inception");

  const allData = useMemo<ParsedRow[]>(() => {
    if (!rentabilidadData) return [];
    const result: ParsedRow[] = [];
    const { headers, rows } = rentabilidadData;

    // The CSV parser puts the first line into headers.
    // Due to merged cells, headers[0] may contain all periods concatenated:
    // "Period YTD 2026 2025 2024 2023"
    // and headers[1..3] contain all values:
    // "Swiss Portfolio % +8.42% +32.60% +28.14% +41.20%"
    const h0 = headers[0]?.trim() || "";
    if (h0.toLowerCase().startsWith("period") && h0.includes(" ")) {
      const periodParts = h0.split(/\s+/);
      // Only match tokens that have digits AND %, e.g. "+8.42%" but not standalone "%"
      const extractPcts = (s: string) =>
        (s || "").split(/\s+/).filter(p => p.includes("%") && /\d/.test(p)).map(p => parseVal(p));

      const pcts1 = extractPcts(headers[1] || "");
      const pcts2 = extractPcts(headers[2] || "");
      const pcts3 = extractPcts(headers[3] || "");

      const periods: string[] = [];
      let i = 1;
      while (i < periodParts.length) {
        if (periodParts[i].toLowerCase() === "ytd" && i + 1 < periodParts.length) {
          periods.push(`YTD ${periodParts[i + 1]}`);
          i += 2;
        } else if (/^\d{4}$/.test(periodParts[i])) {
          periods.push(periodParts[i]);
          i++;
        } else {
          i++;
        }
      }

      for (let j = 0; j < periods.length; j++) {
        const name = periods[j];
        const isYtd = name.toLowerCase().startsWith("ytd");
        const yearMatch = name.match(/\d{4}/);
        result.push({
          name,
          portfolio: pcts1[j] ?? 0,
          sp500: pcts2[j] ?? 0,
          nasdaq: pcts3[j] ?? 0,
          isYtd,
          year: yearMatch ? parseInt(yearMatch[0]) : null,
        });
      }
    }

    // Also parse normal rows (e.g. "2022", "+33.78%", ...)
    for (const r of rows) {
      if (!r[0] || r[0].startsWith("NOTE")) continue;
      const col0 = r[0].trim();
      const isYtd = col0.toLowerCase().startsWith("ytd");
      const yearMatch = col0.match(/\d{4}/);
      result.push({
        name: col0,
        portfolio: parseVal(r[1]),
        sp500: parseVal(r[2]),
        nasdaq: parseVal(r[3]),
        isYtd,
        year: yearMatch ? parseInt(yearMatch[0]) : null,
      });
    }

    return result;
  }, [rentabilidadData]);

  const ytdRow = allData.find(d => d.isYtd);
  const yearRows = useMemo(
    () => allData.filter(d => !d.isYtd && d.year !== null).sort((a, b) => a.year! - b.year!),
    [allData]
  );

  // All years + YTD for the bottom chart (always shown)
  const allYearsChartData = useMemo(
    () => [...yearRows, ...(ytdRow ? [ytdRow] : [])],
    [yearRows, ytdRow]
  );

  // Computed values for the selected period
  const { portfolioVal, sp500Val, nasdaqVal, periodLabel } = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let rows: ParsedRow[] = [];
    let label = activePeriod;
    let useCompound = true;
    let useCagr = false;

    switch (activePeriod) {
      case "YTD":
        rows = ytdRow ? [ytdRow] : [];
        label = ytdRow?.name || "YTD";
        break;
      case "1Y":
        rows = yearRows.length > 0 ? [yearRows[yearRows.length - 1]] : [];
        label = rows[0]?.name || "1Y";
        break;
      case "2Y":
        rows = yearRows.filter(d => d.year! >= currentYear - 2);
        label = "2 Years";
        break;
      case "3Y":
        rows = yearRows.filter(d => d.year! >= currentYear - 3);
        label = "3 Years";
        break;
      case "Since Inception":
        rows = [...yearRows, ...(ytdRow ? [ytdRow] : [])];
        label = "Since Inception";
        break;
      case "Annualized CAGR":
        rows = [...yearRows, ...(ytdRow ? [ytdRow] : [])];
        label = "Annualized CAGR";
        useCagr = true;
        break;
    }

    const calc = useCagr ? annualizedCagr : compoundReturns;
    return {
      portfolioVal: calc(rows.map(r => r.portfolio)),
      sp500Val: calc(rows.map(r => r.sp500)),
      nasdaqVal: calc(rows.map(r => r.nasdaq)),
      periodLabel: label,
    };
  }, [allData, activePeriod, ytdRow, yearRows]);

  // Data for comparison chart (single grouped bar)
  const comparisonChartData = useMemo(() => [
    { name: "Swiss Portfolio", value: portfolioVal },
    { name: "S&P 500", value: sp500Val },
    { name: "Nasdaq-100", value: nasdaqVal },
  ], [portfolioVal, sp500Val, nasdaqVal]);

  if (loading) return <LoadingSkeleton />;
  if (!rentabilidadData || rentabilidadData.rows.length === 0) return <EmptyState />;

  const cardData = [
    { label: "SWISS PORTFOLIO", value: portfolioVal },
    { label: "S&P 500", value: sp500Val },
    { label: "NASDAQ-100", value: nasdaqVal },
  ];

  const chartColors = {
    portfolio: "hsl(var(--primary))",
    sp500: "hsl(var(--muted-foreground))",
    nasdaq: "hsl(220, 14%, 40%)",
  };

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    fontSize: 12,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Period filters */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_FILTERS.map(p => (
          <button
            key={p}
            onClick={() => setActivePeriod(p)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              activePeriod === p
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 3 Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cardData.map((card, i) => {
          const isNeg = card.value < 0;
          return (
            <Card key={i} className="border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              <p className={`mt-1 font-display text-2xl font-bold ${
                isNeg ? "text-destructive" : "text-success"
              }`}>
                {formatPct(card.value)}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Comparison chart — one bar per index for the selected period */}
      <Card className="border-border bg-card p-5 transition-all hover:shadow-md">
        <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Comparison — {periodLabel}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonChartData} barSize={120}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(2)}%`} />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              fill={chartColors.portfolio}
              label={{ position: "top", fill: "hsl(var(--muted-foreground))", fontSize: 11, formatter: (v: number) => `${v.toFixed(1)}%` }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Year-by-year chart — always shows all years */}
      {allYearsChartData.length > 0 && (
        <Card className="border-border bg-card p-5 transition-all hover:shadow-md">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Annual Performance Year by Year
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={allYearsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(2)}%`} />
              <Legend />
              <Bar dataKey="portfolio" name="Swiss Portfolio" fill={chartColors.portfolio} radius={[4, 4, 0, 0]} />
              <Bar dataKey="sp500" name="S&P 500" fill={chartColors.sp500} radius={[4, 4, 0, 0]} />
              <Bar dataKey="nasdaq" name="Nasdaq-100" fill={chartColors.nasdaq} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Data table */}
      <Card className="overflow-x-auto border-border bg-card p-4 transition-all hover:shadow-md">
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Detailed Performance Data
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Swiss Portfolio %</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">S&P 500 %</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nasdaq-100 %</th>
            </tr>
          </thead>
          <tbody>
            {allData.map((row, i) => (
              <tr key={i} className="border-b border-border/50 transition-all hover:bg-secondary/50">
                <td className="px-3 py-2.5 text-foreground">{row.name}</td>
                {[row.portfolio, row.sp500, row.nasdaq].map((v, j) => (
                  <td key={j} className={`px-3 py-2.5 font-medium ${
                    v > 0 ? "text-success" : v < 0 ? "text-destructive" : "text-foreground"
                  }`}>
                    {formatPct(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-card" />
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="flex h-64 items-center justify-center border-border bg-card">
      <p className="text-muted-foreground">No "Performance" sheet found</p>
    </Card>
  );
}
