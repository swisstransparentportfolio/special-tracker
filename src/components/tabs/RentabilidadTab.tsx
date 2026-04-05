import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid, LineChart, Line, AreaChart, Area,
} from "recharts";
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";

interface BenchmarkLive {
  sp500Ytd: number | null;
  nasdaqYtd: number | null;
  sp500Current: number | null;
  nasdaqCurrent: number | null;
  lastUpdated: string;
}

interface Props {
  rentabilidadData: SheetData | null;
  loading: boolean;
  benchmarks?: BenchmarkLive | null;
}

const PERIOD_FILTERS = ["YTD", "1Y", "2Y", "3Y", "Since Inception", "Annualized CAGR"];
type ChartType = "bar" | "line" | "area";

function parseVal(s: string | undefined): number {
  if (!s) return 0;
  return parseFloat(s.replace(",", ".").replace("%", "").replace("+", "")) || 0;
}

export default function RentabilidadTab({ rentabilidadData, loading, benchmarks }: Props) {
  const [activePeriod, setActivePeriod] = useState("Since Inception");
  const [chartType, setChartType] = useState<ChartType>("bar");

  // Parse all rows into structured data
  const allData = useMemo(() => {
    if (!rentabilidadData || rentabilidadData.rows.length === 0) return [];
    const { rows } = rentabilidadData;
    return rows
      .filter(r => r[0] && !r[0].startsWith("NOTE"))
      .map(r => ({
        name: r[0]?.trim() || "",
        portfolio: parseVal(r[1]),
        sp500: parseVal(r[2]),
        nasdaq: parseVal(r[3]),
        rawPortfolio: r[1]?.trim() || "",
        rawSp500: r[2]?.trim() || "",
        rawNasdaq: r[3]?.trim() || "",
      }));
  }, [rentabilidadData]);

  // Find specific rows
  const findRow = (keyword: string) => allData.find(d => d.name.toLowerCase().includes(keyword.toLowerCase()));

  const ytdRow = findRow("YTD");
  const cagrRow = findRow("CAGR");
  const sinceInceptionRow = findRow("Since Inception") || findRow("Inception");
  const yearRows = allData.filter(d => /^\d{4}$/.test(d.name));

  // Filtered chart data based on period
  const filteredChartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    switch (activePeriod) {
      case "YTD":
        return ytdRow ? [ytdRow] : [];
      case "1Y":
        return yearRows.filter(d => parseInt(d.name) >= currentYear - 1).concat(ytdRow ? [ytdRow] : []);
      case "2Y":
        return yearRows.filter(d => parseInt(d.name) >= currentYear - 2).concat(ytdRow ? [ytdRow] : []);
      case "3Y":
        return yearRows.filter(d => parseInt(d.name) >= currentYear - 3).concat(ytdRow ? [ytdRow] : []);
      case "Annualized CAGR":
        return cagrRow ? [cagrRow] : [];
      case "Since Inception":
      default:
        return [...yearRows, ...(ytdRow ? [ytdRow] : [])];
    }
  }, [allData, activePeriod, ytdRow, cagrRow, yearRows]);

  // Dynamic summary cards based on selected period
  const summaryCards = useMemo(() => {
    let targetRow = ytdRow; // default
    switch (activePeriod) {
      case "YTD": targetRow = ytdRow; break;
      case "1Y": targetRow = yearRows.length > 0 ? yearRows[yearRows.length - 1] : ytdRow; break;
      case "Since Inception": targetRow = sinceInceptionRow || ytdRow; break;
      case "Annualized CAGR": targetRow = cagrRow; break;
      case "2Y":
      case "3Y":
        targetRow = ytdRow;
        break;
    }
    if (!targetRow) return [];
    return [
      { label: "Period", value: targetRow.name },
      { label: "Portfolio %", value: targetRow.rawPortfolio, num: targetRow.portfolio },
      { label: "S&P 500 %", value: targetRow.rawSp500, num: targetRow.sp500 },
      { label: "Nasdaq-100 %", value: targetRow.rawNasdaq, num: targetRow.nasdaq },
    ];
  }, [activePeriod, ytdRow, cagrRow, sinceInceptionRow, yearRows]);

  if (loading) return <LoadingSkeleton />;
  if (!rentabilidadData || rentabilidadData.rows.length === 0) return <EmptyState />;

  const { headers, rows } = rentabilidadData;

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

      {/* Summary cards - dynamic based on period */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {summaryCards.map((card, i) => {
            const isFirst = i === 0;
            const isNegative = !isFirst && card.num !== undefined && card.num < 0;
            const isPositive = !isFirst && card.num !== undefined && card.num > 0;
            return (
              <Card key={i} className="border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </p>
                  {!isFirst && (
                    isNegative
                      ? <TrendingDown className="h-4 w-4 text-destructive" />
                      : <TrendingUp className="h-4 w-4 text-success" />
                  )}
                </div>
                <p className={`mt-1 font-display text-2xl font-bold ${
                  isFirst ? "text-foreground"
                    : isNegative ? "text-destructive"
                    : isPositive ? "text-success"
                    : "text-foreground"
                }`}>
                  {card.value || "—"}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {filteredChartData.length > 0 && (
        <Card className="border-border bg-card p-5 transition-all hover:shadow-md">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Comparison — {activePeriod}
          </h3>
          <ResponsiveContainer width="100%" height={340}>
            {chartType === "bar" ? (
              <BarChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="portfolio" name="Portfolio" fill={chartColors.portfolio} radius={[4, 4, 0, 0]} />
                <Bar dataKey="sp500" name="S&P 500" fill={chartColors.sp500} radius={[4, 4, 0, 0]} />
                <Bar dataKey="nasdaq" name="Nasdaq-100" fill={chartColors.nasdaq} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(2)}%`} />
                <Legend />
                <Line type="monotone" dataKey="portfolio" name="Portfolio" stroke={chartColors.portfolio} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="sp500" name="S&P 500" stroke={chartColors.sp500} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="nasdaq" name="Nasdaq-100" stroke={chartColors.nasdaq} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <AreaChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={v => `${v}%`} />
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

      {filteredChartData.length === 0 && (
        <Card className="flex h-40 items-center justify-center border-border bg-card">
          <p className="text-muted-foreground">No data available for "{activePeriod}"</p>
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
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.filter(r => !r[0]?.startsWith("NOTE")).map((row, i) => (
              <tr key={i} className="border-b border-border/50 transition-all hover:bg-secondary/50">
                {row.map((cell, j) => {
                  const num = parseVal(cell);
                  const isNumeric = j > 0 && cell?.includes("%");
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

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
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
