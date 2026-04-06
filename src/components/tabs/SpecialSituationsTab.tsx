import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { useSortableTable } from "@/hooks/use-sortable-table";
import SortableHeader from "@/components/SortableHeader";

interface Props {
  data: SheetData | null;
  loading: boolean;
}

function parseNum(s: string | undefined): number {
  if (!s) return 0;
  return parseFloat(s.replace(/[,$]/g, "").replace("%", "")) || 0;
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const parts = dateStr.match(/(\d{1,2})\s*(\w+)\s*(\d{4})/);
  if (!parts) return Infinity;
  const d = new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`);
  if (isNaN(d.getTime())) return Infinity;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getUrgencyClass(days: number): string {
  if (days <= 7) return "text-destructive";
  if (days <= 14) return "text-primary";
  return "text-muted-foreground";
}

export default function SpecialSituationsTab({ data, loading }: Props) {
  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-card" />;
  if (!data || data.rows.length === 0) {
    return (
      <Card className="flex h-64 items-center justify-center border-border bg-card">
        <p className="text-muted-foreground">No "Special Situations" sheet found</p>
      </Card>
    );
  }

  const { headers, rows } = data;
  const { sortedRows, sort, toggleSort } = useSortableTable(rows);

  const nameIdx = getColIdx(headers, "name") !== -1 ? getColIdx(headers, "name") : 0;
  const tickerIdx = getColIdx(headers, "ticker");
  const typeIdx = getColIdx(headers, "type");
  const filingDateIdx = getColIdx(headers, "filing date");
  const priceIdx = getColIdx(headers, "price");
  const lowerIdx = getColIdx(headers, "lower");
  const upperIdx = getColIdx(headers, "upper");
  const profitIdx = getColIdx(headers, "profit");
  const expirationIdx = getColIdx(headers, "expiration");
  const linkIdx = getColIdx(headers, "link") !== -1 ? getColIdx(headers, "link") : getColIdx(headers, "filing link");
  const resultIdx = getColIdx(headers, "result");

  const activeRows = rows.filter(r => getDaysUntil(r[expirationIdx] || "") >= 0);
  const activeCount = activeRows.length;
  const profitValues = rows.map(r => r[profitIdx] || "").filter(v => v.includes("$")).map(v => parseNum(v));
  const avgProfit = profitValues.length > 0 ? profitValues.reduce((a, b) => a + b, 0) / profitValues.length : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border bg-card p-3 sm:p-5">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /></div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">Active</p>
              <p className="font-display text-lg sm:text-2xl font-bold text-foreground">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border bg-card p-3 sm:p-5">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div className="rounded-lg bg-success/10 p-2"><DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-success" /></div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Profit</p>
              <p className="font-display text-lg sm:text-2xl font-bold text-foreground">{formatCurrency(avgProfit)}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border bg-card p-3 sm:p-5">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div className="rounded-lg bg-accent/30 p-2"><TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" /></div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">Nearest</p>
              <p className="font-display text-lg sm:text-2xl font-bold text-foreground">
                {(() => {
                  const days = rows.map(r => getDaysUntil(r[expirationIdx] || "")).filter(d => d !== Infinity && d >= 0);
                  const min = Math.min(...days);
                  return isFinite(min) ? `${min}d` : "—";
                })()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-x-auto border-border bg-card p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <SortableHeader label="Name" colIdx={nameIdx} sort={sort} onToggle={toggleSort} className="text-left" />
              {typeIdx !== -1 && <SortableHeader label="Type" colIdx={typeIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
              {filingDateIdx !== -1 && <SortableHeader label="Filing Date" colIdx={filingDateIdx} sort={sort} onToggle={toggleSort} className="hidden text-center md:table-cell" />}
              {priceIdx !== -1 && <SortableHeader label="Price" colIdx={priceIdx} sort={sort} onToggle={toggleSort} className="text-right" />}
              {lowerIdx !== -1 && <SortableHeader label="Lower" colIdx={lowerIdx} sort={sort} onToggle={toggleSort} className="hidden text-right lg:table-cell" />}
              {upperIdx !== -1 && <SortableHeader label="Upper" colIdx={upperIdx} sort={sort} onToggle={toggleSort} className="hidden text-right lg:table-cell" />}
              {profitIdx !== -1 && <SortableHeader label="Max Profit" colIdx={profitIdx} sort={sort} onToggle={toggleSort} className="text-right" />}
              {expirationIdx !== -1 && <SortableHeader label="Expiration" colIdx={expirationIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filing</th>
              {resultIdx !== -1 && <SortableHeader label="Result" colIdx={resultIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => {
              const ticker = tickerIdx !== -1 ? row[tickerIdx] : "";
              const daysUntil = getDaysUntil(row[expirationIdx] || "");
              const urgency = getUrgencyClass(daysUntil);
              const profit = parseNum(row[profitIdx]);
              const link = linkIdx !== -1 ? row[linkIdx] : "";

              return (
                <tr key={i} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                  <td className="px-3 py-3.5">
                    <div className="font-medium text-foreground">{row[nameIdx]}</div>
                    {ticker && <div className="text-xs text-muted-foreground">{ticker}</div>}
                  </td>
                  {typeIdx !== -1 && (
                    <td className="px-2 sm:px-3 py-3.5 text-center">
                      <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground whitespace-nowrap">{
                        (() => {
                          const t = (row[typeIdx] || "—").trim();
                          if (t.toLowerCase() === "tender offer") return "Tender";
                          if (t.toLowerCase() === "liquidation") return "Liquid.";
                          return t;
                        })()
                      }</span>
                      <span className="hidden sm:inline rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{row[typeIdx] || "—"}</span>
                    </td>
                  )}
                  {filingDateIdx !== -1 && <td className="hidden px-3 py-3.5 text-center text-muted-foreground md:table-cell">{row[filingDateIdx] || "—"}</td>}
                  {priceIdx !== -1 && <td className="px-3 py-3.5 text-right font-mono text-foreground">{row[priceIdx] || "—"}</td>}
                  {lowerIdx !== -1 && <td className="hidden px-3 py-3.5 text-right font-mono text-muted-foreground lg:table-cell">{row[lowerIdx] || "—"}</td>}
                  {upperIdx !== -1 && <td className="hidden px-3 py-3.5 text-right font-mono text-muted-foreground lg:table-cell">{row[upperIdx] || "—"}</td>}
                  {profitIdx !== -1 && (
                    <td className="px-3 py-3.5 text-right">
                      <span className={`font-mono font-medium ${profit > 0 ? "text-success" : "text-foreground"}`}>{row[profitIdx] || "—"}</span>
                    </td>
                  )}
                  {expirationIdx !== -1 && (
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${urgency}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {row[expirationIdx] || "—"}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-3.5 text-center">
                    {link ? (
                      <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-medium text-primary border-primary/30 hover:bg-primary/10">
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> Filing
                        </a>
                      </Button>
                    ) : "—"}
                  </td>
                  {resultIdx !== -1 && (
                    <td className="px-3 py-3.5 text-center">
                      {(() => {
                        const resultVal = (row[resultIdx] || "").trim().toUpperCase();
                        if (!resultVal) return "—";
                        const isPositive = resultVal === "POSITIVE" || resultVal === "YES" || resultVal === "WIN" || resultVal === "1";
                        const isPending = resultVal === "IN PROCESS" || resultVal === "IN PROGRESS" || resultVal === "PENDING";
                        if (isPending) return (
                          <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[hsl(210,80%,55%)]/15 text-[hsl(210,80%,45%)]">IN PROCESS</span>
                        );
                        return (
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPositive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                            {isPositive ? "POSITIVE" : "NEGATIVE"}
                          </span>
                        );
                      })()}
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
