import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  portfolioData: SheetData | null;
  loading: boolean;
}

const COLORS = [
  "hsl(0, 60%, 45%)", "hsl(220, 14%, 55%)", "hsl(152, 55%, 38%)",
  "hsl(210, 45%, 50%)", "hsl(0, 40%, 60%)", "hsl(30, 50%, 50%)",
  "hsl(170, 40%, 42%)", "hsl(240, 30%, 50%)", "hsl(45, 50%, 45%)",
  "hsl(310, 35%, 48%)", "hsl(100, 40%, 40%)", "hsl(20, 50%, 48%)",
  "hsl(190, 40%, 42%)", "hsl(330, 40%, 50%)", "hsl(80, 35%, 42%)",
];

export default function PortfolioTab({ portfolioData, loading }: Props) {
  if (loading) return <LoadingSkeleton />;
  if (!portfolioData || portfolioData.rows.length === 0) {
    return <EmptyState />;
  }

  const { headers, rows } = portfolioData;
  const nameIdx = getColIdx(headers, "empresa") !== -1 ? getColIdx(headers, "empresa") : 0;
  const weightIdx = getColIdx(headers, "peso");
  const priceIdx = getColIdx(headers, "precio");
  const targetIdx = getColIdx(headers, "p.o");
  const cagrIdx = getColIdx(headers, "cagr");
  const currencyIdx = getColIdx(headers, "moneda");
  const geoIdx = getColIdx(headers, "geograf");
  const riskIdx = getColIdx(headers, "riesgo");

  const pieData = rows
    .filter(r => {
      const w = parseFloat(r[weightIdx]?.replace(",", ".").replace("%", ""));
      return weightIdx !== -1 && !isNaN(w) && w > 0;
    })
    .map(r => ({
      name: r[nameIdx] || "—",
      value: parseFloat(r[weightIdx]?.replace(",", ".").replace("%", "")) || 0,
    }))
    .sort((a, b) => b.value - a.value);

  const totalPositions = rows.filter(r => {
    const w = weightIdx !== -1 ? parseFloat(r[weightIdx]?.replace(",", ".").replace("%", "")) : 0;
    return !isNaN(w) && w > 0;
  }).length;

  const liquidityRow = rows.find(r => r[nameIdx]?.toLowerCase().includes("liquid"));
  const liquidityPct = liquidityRow && weightIdx !== -1 ? liquidityRow[weightIdx] : "—";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Positions</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{totalPositions}</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {pieData.length > 0 && (
          <Card className="border-border bg-card p-5 lg:col-span-2">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Composition
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  dataKey="value"
                  paddingAngle={1}
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 14%, 88%)", borderRadius: "8px", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-2">
              {pieData.slice(0, 8).map((d, i) => (
                <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {d.name} {d.value.toFixed(1)}%
                </span>
              ))}
            </div>
          </Card>
        )}

        <Card className="overflow-x-auto border-border bg-card p-4 lg:col-span-3">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Positions
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {totalPositions} securities
            </span>
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</th>
                {geoIdx !== -1 && <th className="hidden px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Geo</th>}
                {currencyIdx !== -1 && <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ccy</th>}
                {priceIdx !== -1 && <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>}
                {targetIdx !== -1 && <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target</th>}
                {cagrIdx !== -1 && <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">3Y CAGR</th>}
                {weightIdx !== -1 && <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weight</th>}
                {riskIdx !== -1 && <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const cagr = cagrIdx !== -1 ? row[cagrIdx] : "";
                const isPositive = cagr.startsWith("+") || (parseFloat(cagr.replace(",", ".").replace("%", "")) > 0);
                return (
                  <tr key={i} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                    <td className="px-2 py-2.5 font-medium text-foreground">{row[nameIdx]}</td>
                    {geoIdx !== -1 && <td className="hidden px-2 py-2.5 text-muted-foreground sm:table-cell">{row[geoIdx]}</td>}
                    {currencyIdx !== -1 && <td className="px-2 py-2.5 text-muted-foreground">{row[currencyIdx]}</td>}
                    {priceIdx !== -1 && <td className="px-2 py-2.5 text-right text-foreground">{row[priceIdx]}</td>}
                    {targetIdx !== -1 && <td className="px-2 py-2.5 text-right text-foreground">{row[targetIdx]}</td>}
                    {cagrIdx !== -1 && (
                      <td className={`px-2 py-2.5 text-right font-medium ${
                        isPositive ? "text-success" : cagr ? "text-destructive" : "text-muted-foreground"
                      }`}>
                        {cagr || "—"}
                      </td>
                    )}
                    {weightIdx !== -1 && <td className="px-2 py-2.5 text-right text-foreground">{row[weightIdx]}</td>}
                    {riskIdx !== -1 && (
                      <td className="px-2 py-2.5 text-right">
                        <RiskBadge value={row[riskIdx]} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
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
