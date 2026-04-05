import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ExternalLink, FileText, BarChart3 } from "lucide-react";

interface Props {
  portfolioData: SheetData | null;
  loading: boolean;
}

const COLORS = [
  "hsl(210, 65%, 55%)", "hsl(152, 55%, 42%)", "hsl(30, 65%, 50%)",
  "hsl(340, 55%, 50%)", "hsl(170, 50%, 42%)", "hsl(260, 45%, 55%)",
  "hsl(45, 60%, 48%)", "hsl(0, 55%, 50%)", "hsl(195, 55%, 45%)",
  "hsl(120, 40%, 42%)", "hsl(280, 40%, 50%)", "hsl(15, 60%, 48%)",
  "hsl(190, 45%, 50%)", "hsl(320, 45%, 48%)", "hsl(80, 45%, 42%)",
  "hsl(230, 50%, 55%)", "hsl(60, 50%, 45%)", "hsl(350, 50%, 52%)",
];

const RADIAN = Math.PI / 180;

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (value < 3.5) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      <tspan x={x} dy="-6">{name}</tspan>
      <tspan x={x} dy="14">{value.toFixed(1)}%</tspan>
    </text>
  );
}

export default function PortfolioTab({ portfolioData, loading }: Props) {
  if (loading) return <LoadingSkeleton />;
  if (!portfolioData || portfolioData.rows.length === 0) {
    return <EmptyState />;
  }

  const { headers, rows } = portfolioData;
  const nameIdx = getColIdx(headers, "empresa") !== -1 ? getColIdx(headers, "empresa") : 0;
  const tickerIdx = getColIdx(headers, "ticker");
  const weightIdx = getColIdx(headers, "peso");
  const priceIdx = getColIdx(headers, "precio");
  const targetIdx = getColIdx(headers, "p.o");
  const cagrIdx = getColIdx(headers, "cagr");
  const currencyIdx = getColIdx(headers, "moneda");
  const geoIdx = getColIdx(headers, "geograf");
  const riskIdx = getColIdx(headers, "riesgo");
  const detailIdx = getColIdx(headers, "detalle");
  const thesisIdx = getColIdx(headers, "tesis");
  const modelIdx = getColIdx(headers, "modelo");
  const ageIdx = getColIdx(headers, "antigüedad") !== -1 ? getColIdx(headers, "antigüedad") : getColIdx(headers, "antiguedad");

  const pieData = rows
    .filter(r => {
      const w = parseFloat(r[weightIdx]?.replace(",", ".").replace("%", ""));
      return weightIdx !== -1 && !isNaN(w) && w > 0;
    })
    .map(r => ({
      name: (tickerIdx !== -1 ? r[tickerIdx] : r[nameIdx]?.split(" ")[0]) || "—",
      fullName: r[nameIdx] || "—",
      value: parseFloat(r[weightIdx]?.replace(",", ".").replace("%", "")) || 0,
    }))
    .sort((a, b) => b.value - a.value);

  const totalPositions = rows.filter(r => {
    const w = weightIdx !== -1 ? parseFloat(r[weightIdx]?.replace(",", ".").replace("%", "")) : 0;
    return !isNaN(w) && w > 0;
  }).length;

  const liquidityRow = rows.find(r => r[nameIdx]?.toLowerCase().includes("liquid"));
  const liquidityPct = liquidityRow && weightIdx !== -1 ? liquidityRow[weightIdx] : "—";

  const hasLinks = thesisIdx !== -1 || modelIdx !== -1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Positions</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{totalPositions}</p>
          <p className="text-xs text-muted-foreground">{rows.length} total securities</p>
        </Card>
        <Card className="border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Liquidity</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{liquidityPct}</p>
        </Card>
        <Card className="border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Securities</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{rows.length}</p>
        </Card>
      </div>

      {/* Donut chart */}
      {pieData.length > 0 && (
        <Card className="border-border bg-card p-5">
          <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Portfolio Composition
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">Click a segment to see details</p>
          <ResponsiveContainer width="100%" height={420}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={180}
                dataKey="value"
                paddingAngle={1}
                stroke="none"
                label={renderCustomLabel}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} className="cursor-pointer transition-opacity hover:opacity-80" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, _name: string, props: any) => [`${v.toFixed(1)}%`, props.payload.fullName]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Positions table */}
      <Card className="overflow-x-auto border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Positions — Portfolio
          </h3>
          <span className="text-xs text-muted-foreground">
            {totalPositions} securities · Liquidity {liquidityPct}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</th>
              {geoIdx !== -1 && <th className="hidden px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Geography</th>}
              {currencyIdx !== -1 && <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ccy</th>}
              {priceIdx !== -1 && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>}
              {targetIdx !== -1 && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">P.O. 3Y</th>}
              {cagrIdx !== -1 && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">CAGR 3Y</th>}
              {weightIdx !== -1 && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weight</th>}
              {detailIdx !== -1 && <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detail</th>}
              {ageIdx !== -1 && <th className="hidden px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Age</th>}
              {riskIdx !== -1 && <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk</th>}
              {hasLinks && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const cagr = cagrIdx !== -1 ? row[cagrIdx] : "";
              const cagrNum = parseFloat(cagr.replace(",", ".").replace("%", ""));
              const isPositive = !isNaN(cagrNum) && cagrNum > 0;
              const ticker = tickerIdx !== -1 ? row[tickerIdx] : "";
              const thesisUrl = thesisIdx !== -1 ? row[thesisIdx]?.trim() : "";
              const modelUrl = modelIdx !== -1 ? row[modelIdx]?.trim() : "";

              return (
                <tr key={i} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                  <td className="px-3 py-3">
                    <div className="font-medium text-foreground">{row[nameIdx]}</div>
                    {ticker && <div className="text-xs text-muted-foreground">{ticker}</div>}
                  </td>
                  {geoIdx !== -1 && <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">{row[geoIdx]}</td>}
                  {currencyIdx !== -1 && <td className="px-3 py-3 text-center font-medium text-muted-foreground">{row[currencyIdx]}</td>}
                  {priceIdx !== -1 && <td className="px-3 py-3 text-right text-foreground">{row[priceIdx]}</td>}
                  {targetIdx !== -1 && <td className="px-3 py-3 text-right font-medium text-foreground">{row[targetIdx] || "—"}</td>}
                  {cagrIdx !== -1 && (
                    <td className={`px-3 py-3 text-right font-medium ${
                      isPositive ? "text-success" : cagr ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {cagr || "—"}
                    </td>
                  )}
                  {weightIdx !== -1 && <td className="px-3 py-3 text-right text-foreground">{row[weightIdx]}</td>}
                  {detailIdx !== -1 && (
                    <td className="px-3 py-3 text-center">
                      {row[detailIdx]?.trim() ? (
                        <a href={row[detailIdx]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-foreground hover:bg-primary/10 transition-colors">
                          <BarChart3 className="h-3 w-3" /> Detail
                        </a>
                      ) : "—"}
                    </td>
                  )}
                  {ageIdx !== -1 && <td className="hidden px-3 py-3 text-center text-muted-foreground md:table-cell">{row[ageIdx] || "—"}</td>}
                  {riskIdx !== -1 && (
                    <td className="px-3 py-3 text-center">
                      <RiskBadge value={row[riskIdx]} />
                    </td>
                  )}
                  {hasLinks && (
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {thesisUrl && (
                          <a href={thesisUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/20 transition-colors">
                            <FileText className="h-3 w-3" /> Thesis
                          </a>
                        )}
                        {modelUrl && (
                          <a href={modelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                            <BarChart3 className="h-3 w-3" /> Model
                          </a>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function RiskBadge({ value }: { value: string }) {
  const num = parseInt(value);
  if (isNaN(num)) return <span className="text-muted-foreground">—</span>;
  const color = num <= 4 ? "bg-success/20 text-success" : num <= 7 ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive";
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${color}`}>
      {num}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />)}
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-card" />
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="flex h-64 items-center justify-center border-border bg-card">
      <p className="text-muted-foreground">No portfolio sheet found</p>
    </Card>
  );
}
