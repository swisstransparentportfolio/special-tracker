import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { FileText, BarChart3 } from "lucide-react";
import { useSortableTable } from "@/hooks/use-sortable-table";
import SortableHeader from "@/components/SortableHeader";
import { useIsMobile } from "@/hooks/use-mobile";

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

function renderCustomLabel(isMobile: boolean) {
  return ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const minSlice = isMobile ? 5 : 3.5;
    const fontSize = isMobile ? 9 : 11;
    if (value < minSlice) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={fontSize} fontWeight={700}>
        <tspan x={x} dy={isMobile ? "-5" : "-6"}>{name}</tspan>
        <tspan x={x} dy={isMobile ? "12" : "14"}>{value.toFixed(1)}%</tspan>
      </text>
    );
  };
}

function findCol(headers: string[], ...names: string[]): number {
  for (const n of names) {
    const idx = getColIdx(headers, n);
    if (idx !== -1) return idx;
  }
  return -1;
}

export default function PortfolioTab({ portfolioData, loading }: Props) {
  if (loading) return <LoadingSkeleton />;
  if (!portfolioData || portfolioData.rows.length === 0) return <EmptyState />;

  const { headers, rows } = portfolioData;
  const { sortedRows, sort, toggleSort } = useSortableTable(rows);

  const nameIdx = findCol(headers, "company", "empresa") !== -1 ? findCol(headers, "company", "empresa") : 0;
  const tickerIdx = findCol(headers, "ticker");
  const weightIdx = findCol(headers, "weight", "peso");
  const priceIdx = findCol(headers, "price", "precio");
  const targetIdx = findCol(headers, "p.o");
  const cagrIdx = findCol(headers, "cagr");
  const currencyIdx = findCol(headers, "currency", "moneda");
  const geoIdx = findCol(headers, "geography", "geograf");
  const riskIdx = findCol(headers, "risk", "riesgo");
  const detailIdx = findCol(headers, "detail", "detalle");
  const thesisIdx = findCol(headers, "research", "tesis");
  const modelIdx = findCol(headers, "model", "modelo");
  const ageIdx = findCol(headers, "age", "antigüedad", "antiguedad");

  const parseNum = (s: string | undefined) => {
    if (!s) return NaN;
    return parseFloat(s.replace(",", ".").replace("%", "").replace(/[$€£]/g, "").replace(/,/g, ""));
  };

  const activeRows = rows.filter(r => {
    const name = r[nameIdx]?.toLowerCase() || "";
    const w = weightIdx !== -1 ? parseNum(r[weightIdx]) : 0;
    return !name.includes("liquid") && !isNaN(w) && w > 0;
  });

  const totalPositions = activeRows.length;
  const liquidityRow = rows.find(r => r[nameIdx]?.toLowerCase().includes("liquid"));
  const liquidityPct = liquidityRow && weightIdx !== -1 ? (liquidityRow[weightIdx]?.trim() || "—") : "—";

  let weightedCagr = 0;
  let totalWeightWithCagr = 0;
  activeRows.forEach(row => {
    const w = weightIdx !== -1 ? parseNum(row[weightIdx]) : 0;
    const c = cagrIdx !== -1 ? parseNum(row[cagrIdx]) : NaN;
    if (!isNaN(w) && !isNaN(c)) { weightedCagr += w * c; totalWeightWithCagr += w; }
  });
  const avgCagr = totalWeightWithCagr > 0 ? weightedCagr / totalWeightWithCagr : 0;
  const pctWithTarget = totalWeightWithCagr > 0
    ? `${((totalWeightWithCagr / activeRows.reduce((s, r) => s + (parseNum(r[weightIdx]) || 0), 0)) * 100).toFixed(1)}% of portfolio with P.O.`
    : "";

  let weightedRisk = 0;
  let totalWeightWithRisk = 0;
  activeRows.forEach(row => {
    const w = weightIdx !== -1 ? parseNum(row[weightIdx]) : 0;
    const risk = riskIdx !== -1 ? parseInt(row[riskIdx]) : NaN;
    if (!isNaN(w) && !isNaN(risk)) { weightedRisk += w * risk; totalWeightWithRisk += w; }
  });
  const avgRisk = totalWeightWithRisk > 0 ? weightedRisk / totalWeightWithRisk : 0;

  const pieData = activeRows
    .map(r => ({
      name: (tickerIdx !== -1 ? r[tickerIdx] : r[nameIdx]?.split(" ")[0]) || "—",
      fullName: r[nameIdx] || "—",
      value: parseNum(r[weightIdx]) || 0,
    }))
    .sort((a, b) => b.value - a.value);

  const hasLinks = thesisIdx !== -1 || modelIdx !== -1;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weighted Expected CAGR</p>
          <p className={`mt-1 font-display text-2xl font-bold ${avgCagr >= 0 ? "text-success" : "text-destructive"}`}>
            {avgCagr >= 0 ? "+" : ""}{avgCagr.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">{pctWithTarget}</p>
        </Card>
        <Card className="border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Liquidity</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{liquidityPct}</p>
          <p className="text-xs text-muted-foreground">{totalPositions} active positions</p>
        </Card>
        <Card className="border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weighted Average Risk</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{avgRisk.toFixed(1)}<span className="text-base font-normal text-muted-foreground">/10</span></p>
          <p className="text-xs text-muted-foreground">weighted by position size</p>
        </Card>
      </div>

      {pieData.length > 0 && <PieChartCard pieData={pieData} />}

      <Card className="overflow-x-auto border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Positions — Portfolio</h3>
          <span className="text-xs text-muted-foreground">{totalPositions} securities · Liquidity {liquidityPct}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <SortableHeader label="Company" colIdx={nameIdx} sort={sort} onToggle={toggleSort} className="text-left" />
              {geoIdx !== -1 && <SortableHeader label="Geography" colIdx={geoIdx} sort={sort} onToggle={toggleSort} className="hidden text-left md:table-cell" />}
              {currencyIdx !== -1 && <SortableHeader label="Ccy" colIdx={currencyIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
              {priceIdx !== -1 && <SortableHeader label="Price" colIdx={priceIdx} sort={sort} onToggle={toggleSort} className="text-right" />}
              {targetIdx !== -1 && <SortableHeader label="P.O. 3Y" colIdx={targetIdx} sort={sort} onToggle={toggleSort} className="text-right" />}
              {cagrIdx !== -1 && <SortableHeader label="CAGR 3Y" colIdx={cagrIdx} sort={sort} onToggle={toggleSort} className="text-right" />}
              {weightIdx !== -1 && <SortableHeader label="Weight" colIdx={weightIdx} sort={sort} onToggle={toggleSort} className="text-right" />}
              {detailIdx !== -1 && <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detail</th>}
              {ageIdx !== -1 && <SortableHeader label="Age" colIdx={ageIdx} sort={sort} onToggle={toggleSort} className="hidden text-center md:table-cell" />}
              {riskIdx !== -1 && <SortableHeader label="Risk" colIdx={riskIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
              {hasLinks && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links</th>}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => {
              const cagr = cagrIdx !== -1 ? row[cagrIdx] : "";
              const cagrNum = parseNum(cagr);
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
                    <td className={`px-3 py-3 text-right font-medium ${isPositive ? "text-success" : cagr ? "text-destructive" : "text-muted-foreground"}`}>
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
                  {riskIdx !== -1 && <td className="px-3 py-3 text-center"><RiskBadge value={row[riskIdx]} /></td>}
                  {hasLinks && (
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {thesisUrl && (
                          <a href={thesisUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/20 transition-colors">
                            <FileText className="h-3 w-3" /> Research
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
  return <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${color}`}>{num}</span>;
}
function PieChartCard({ pieData }: { pieData: { name: string; fullName: string; value: number }[] }) {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 300 : 420;
  const innerR = isMobile ? 55 : 80;
  const outerR = isMobile ? 130 : 180;

  return (
    <Card className="border-border bg-card p-4 sm:p-5">
      <h3 className="mb-1 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Portfolio Composition</h3>
      <p className="mb-3 text-xs text-muted-foreground">Click a segment to see details</p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR} dataKey="value" paddingAngle={1} stroke="none" label={renderCustomLabel(isMobile)} labelLine={false}>
            {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} className="cursor-pointer transition-opacity hover:opacity-80" />))}
          </Pie>
          <Tooltip formatter={(v: number, _name: string, props: any) => [`${v.toFixed(1)}%`, props.payload.fullName]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />)}</div>
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
