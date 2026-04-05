import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { useState } from "react";

interface Props {
  rentabilidadData: SheetData | null;
  loading: boolean;
}

const PERIOD_FILTERS = ["Año en curso", "Año anterior", "2 años", "3 años", "Desde inicio", "CAGR anualizada"];

export default function RentabilidadTab({ rentabilidadData, loading }: Props) {
  const [activePeriod, setActivePeriod] = useState("Año en curso");

  if (loading) return <LoadingSkeleton />;
  if (!rentabilidadData || rentabilidadData.rows.length === 0) {
    return <EmptyState />;
  }

  const { headers, rows } = rentabilidadData;

  // Try to extract summary cards from first rows
  const summaryCards = extractSummaryCards(headers, rows);
  const chartData = extractChartData(headers, rows);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Period filters */}
      <div className="flex flex-wrap gap-2">
        {PERIOD_FILTERS.map(p => (
          <button
            key={p}
            onClick={() => setActivePeriod(p)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              activePeriod === p
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryCards.map((card, i) => (
            <Card key={i} className="border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              <p className={`mt-1 font-display text-2xl font-bold ${
                card.value.startsWith("-") ? "text-destructive" : "text-success"
              }`}>
                {card.value}
              </p>
              {card.sub && (
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="border-border bg-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Comparativa — {activePeriod}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 22%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 14%)", border: "1px solid hsl(220, 15%, 22%)", borderRadius: "8px" }}
                labelStyle={{ color: "hsl(40, 10%, 90%)" }}
              />
              <Legend />
              <Bar dataKey="portfolio" name="Portfolio" fill="hsl(40, 70%, 55%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sp500" name="S&P 500" fill="hsl(220, 10%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="nasdaq" name="Nasdaq-100" fill="hsl(220, 10%, 35%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Raw data table fallback */}
      {summaryCards.length === 0 && chartData.length === 0 && (
        <DataTable headers={headers} rows={rows} />
      )}
    </div>
  );
}

function extractSummaryCards(headers: string[], rows: string[][]) {
  // Attempt to find portfolio, S&P, Nasdaq returns from first row
  const cards: { label: string; value: string; sub?: string }[] = [];
  if (rows.length === 0) return cards;

  // Generic: show first row values as cards (up to 3)
  const max = Math.min(headers.length, 3);
  for (let i = 0; i < max; i++) {
    if (rows[0][i]) {
      cards.push({ label: headers[i], value: rows[0][i] });
    }
  }
  return cards;
}

function extractChartData(headers: string[], rows: string[][]) {
  // Try to build annual chart data from rows
  if (rows.length < 2) return [];
  
  const yearIdx = getColIdx(headers, "año");
  if (yearIdx === -1 && rows.length > 1) {
    // Fallback: use rows as-is
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

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <Card className="overflow-x-auto border-border bg-card p-4">
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
            <tr key={i} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
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
      <p className="text-muted-foreground">No se encontró la hoja "Rentabilidad"</p>
    </Card>
  );
}
