import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

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

  // Summary stats — active = expiration in the future
  const activeRows = rows.filter(r => getDaysUntil(r[expirationIdx] || "") >= 0);
  const activeCount = activeRows.length;
  const avgProfit = rows.reduce((sum, r) => sum + parseNum(r[profitIdx]), 0) / (rows.length || 1);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Situations</p>
              <p className="font-display text-2xl font-bold text-foreground">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2.5">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Max Profit</p>
              <p className="font-display text-2xl font-bold text-foreground">{formatCurrency(avgProfit)}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/30 p-2.5">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nearest Expiry</p>
              <p className="font-display text-2xl font-bold text-foreground">
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

      {/* Table */}
      <Card className="overflow-x-auto border-border bg-card p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="hidden px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Filing Date</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>
              <th className="hidden px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">Lower</th>
              <th className="hidden px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">Upper</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Profit</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiration</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filing</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
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
                  <td className="px-3 py-3.5 text-center">
                    <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {typeIdx !== -1 ? row[typeIdx] || "—" : "—"}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3.5 text-center text-muted-foreground md:table-cell">
                    {filingDateIdx !== -1 ? row[filingDateIdx] || "—" : "—"}
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono text-foreground">
                    {priceIdx !== -1 ? row[priceIdx] || "—" : "—"}
                  </td>
                  <td className="hidden px-3 py-3.5 text-right font-mono text-muted-foreground lg:table-cell">
                    {lowerIdx !== -1 ? row[lowerIdx] || "—" : "—"}
                  </td>
                  <td className="hidden px-3 py-3.5 text-right font-mono text-muted-foreground lg:table-cell">
                    {upperIdx !== -1 ? row[upperIdx] || "—" : "—"}
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span className={`font-mono font-medium ${profit > 0 ? "text-success" : "text-foreground"}`}>
                      {profitIdx !== -1 ? row[profitIdx] || "—" : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${urgency}`}>
                      <Calendar className="h-3.5 w-3.5" />
                      {expirationIdx !== -1 ? row[expirationIdx] || "—" : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {link ? (
                      <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-medium text-primary border-primary/30 hover:bg-primary/10">
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Filing
                        </a>
                      </Button>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {(() => {
                      const resultVal = resultIdx !== -1 ? (row[resultIdx] || "").trim().toUpperCase() : "";
                      if (!resultVal) return "—";
                      const isPositive = resultVal === "POSITIVE" || resultVal === "YES" || resultVal === "WIN" || resultVal === "1";
                      const isPending = resultVal === "IN PROCESS" || resultVal === "IN PROGRESS" || resultVal === "PENDING";
                      if (isPending) return (
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/15 text-primary">
                          IN PROCESS
                        </span>
                      );
                      return (
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isPositive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        }`}>
                          {isPositive ? "POSITIVE" : "NEGATIVE"}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
