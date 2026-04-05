import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid, LineChart, Line, AreaChart, Area,
} from "recharts";
import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";

interface Props {
  rentabilidadData: SheetData | null;
  loading: boolean;
}

const PERIOD_FILTERS = ["YTD", "1Y", "2Y", "3Y", "Since Inception", "Annualized CAGR"];
type ChartType = "bar" | "line" | "area";

export default function RentabilidadTab({ rentabilidadData, loading }: Props) {
  const [activePeriod, setActivePeriod] = useState("YTD");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  if (loading) return <LoadingSkeleton />;
  if (!rentabilidadData || rentabilidadData.rows.length === 0) {
    return <EmptyState />;
  }

  const { headers, rows } = rentabilidadData;
  const summaryCards = extractSummaryCards(headers, rows);
  const chartData = extractChartData(headers, rows);

  const chartColors = {
    portfolio: "hsl(0, 60%, 45%)",
    sp500: "hsl(220, 14%, 55%)",
    nasdaq: "hsl(220, 14%, 40%)",
  };

  const tooltipStyle = {
    background: "hsl(0, 0%, 100%)",
    border: "1px solid hsl(220, 14%, 88%)",
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

        {/* Chart type toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
          {([
            { type: "bar" as ChartType, icon: BarChart3 },
            { type: "line" as ChartType, icon: Activity },
            { type: "area" as ChartType, icon: TrendingUp },
          ]).map(({ type, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`rounded-md p-1.5 transition-all ${
                chartType === type
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={type.charAt(0).toUpperCase() + type.slice(1) + " chart"}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryCards.map((card, i) => {
            const isNegative = card.value.startsWith("-");
            return (
              <Card key={i} className="border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </p>
                  {isNegative ? (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-success" />
                  )}
                </div>
                <p className={`mt-1 font-display text-2xl font-bold ${
                  isNegative ? "text-destructive" : "text-success"
                }`}>
                  {card.value}
                </p>
                {card.sub && (
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="border-border bg-card p-5 transition-all hover:shadow-md">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Comparison — {activePeriod}
          </h3>
          <ResponsiveContainer width="100%" height={340}>
            {chartType === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="portfolio" name="Portfolio" fill={chartColors.portfolio} radius={[4, 4, 0, 0]} />
                <Bar dataKey="sp500" name="S&P 500" fill={chartColors.sp500} radius={[4, 4, 0, 0]} />
                <Bar dataKey="nasdaq" name="Nasdaq-100" fill={chartColors.nasdaq} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(2)}%`} />
                <Legend />
                <Line type="monotone" dataKey="portfolio" name="Portfolio" stroke={chartColors.portfolio} strokeWidth={2.5} dot={{ r: 4, fill: chartColors.portfolio }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="sp500" name="S&P 500" stroke={chartColors.sp500} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="nasdaq" name="Nasdaq-100" stroke={chartColors.nasdaq} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(2)}%`} />
                <Legend />
                <Area type="monotone" dataKey="portfolio" name="Portfolio" stroke={chartColors.portfolio} fill={chartColors.portfolio} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="sp500" name="S&P 500" stroke={chartColors.sp500} fill={chartColors.sp500} fillOpacity={0.08} strokeWidth={1.5} />
                <Area type="monotone" dataKey="nasdaq" name="Nasdaq-100" stroke={chartColors.nasdaq} fill={chartColors.nasdaq} fillOpacity={0.08} strokeWidth={1.5} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </Card>
      )}

      {/* Interactive data table */}
      <Card className="overflow-x-auto border-border bg-card p-4 transition-all hover:shadow-md">
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Detailed Performance Data
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-border/50 transition-all cursor-pointer ${
                  hoveredRow === i ? "bg-primary/5 scale-[1.001]" : "hover:bg-secondary/50"
                }`}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {row.map((cell, j) => {
                  const num = parseFloat(cell.replace(",", ".").replace("%", ""));
                  const isNumeric = !isNaN(num) && j > 0;
                  return (
                    <td key={j} className={`px-3 py-2.5 ${
                      isNumeric
                        ? num > 0 ? "text-success font-medium" : num < 0 ? "text-destructive font-medium" : "text-foreground"
                        : "text-foreground"
                    }`}>
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function extractSummaryCards(headers: string[], rows: string[][]) {
  const cards: { label: string; value: string; sub?: string }[] = [];
  if (rows.length === 0) return cards;
  const max = Math.min(headers.length, 3);
  for (let i = 0; i < max; i++) {
    if (rows[0][i]) {
      cards.push({ label: headers[i], value: rows[0][i] });
    }
  }
  return cards;
}

function extractChartData(headers: string[], rows: string[][]) {
  if (rows.length < 2) return [];
  
  const yearIdx = getColIdx(headers, "año");
  if (yearIdx === -1 && rows.length > 1) {
    return rows.slice(0, 10).map((r, i) => ({
      name: r[0] || `${i + 1}`,
      portfolio: parseFloat(r[1]?.replace(",", ".").replace("%", "")) || 0,
      sp500: parseFloat(r[2]?.replace(",", ".").replace("%", "")) || 0,
      nasdaq: parseFloat(r[3]?.replace(",", ".").replace("%", "")) || 0,
    }));
  }

  return rows.map(r => ({
    name: r[yearIdx] || "",
    portfolio: parseFloat(r[yearIdx + 1]?.replace(",", ".").replace("%", "")) || 0,
    sp500: parseFloat(r[yearIdx + 2]?.replace(",", ".").replace("%", "")) || 0,
    nasdaq: parseFloat(r[yearIdx + 3]?.replace(",", ".").replace("%", "")) || 0,
  }));
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
