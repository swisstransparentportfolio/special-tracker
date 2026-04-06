import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { FileText, BarChart3 } from "lucide-react";
import { useSortableTable } from "@/hooks/use-sortable-table";
import SortableHeader from "@/components/SortableHeader";

interface Props {
  data: SheetData | null;
  loading: boolean;
}

const VERDICT_COLORS: Record<string, string> = {
  "attractively priced": "bg-success/15 text-success border-success/30",
  "reasonably priced": "bg-primary/15 text-primary border-primary/30",
  "premium priced": "bg-destructive/15 text-destructive border-destructive/30",
};

const STATUS_COLORS: Record<string, string> = {
  "in portfolio": "bg-success/15 text-success",
  "under review": "bg-primary/15 text-primary",
  "monitoring": "bg-muted text-muted-foreground",
};

export default function EstudiadosTab({ data, loading }: Props) {
  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-card" />;
  if (!data || data.rows.length === 0) {
    return (
      <Card className="flex h-64 items-center justify-center border-border bg-card">
        <p className="text-muted-foreground">No "Watchlist" sheet found</p>
      </Card>
    );
  }

  const { headers, rows } = data;
  const { sortedRows, sort, toggleSort } = useSortableTable(rows);

  const nameIdx = getColIdx(headers, "company") !== -1 ? getColIdx(headers, "company") : getColIdx(headers, "empresa") !== -1 ? getColIdx(headers, "empresa") : 0;
  const tickerIdx = getColIdx(headers, "ticker");
  const ccyIdx = getColIdx(headers, "ccy");
  const priceIdx = getColIdx(headers, "price");
  const sectorIdx = getColIdx(headers, "sector");
  const mcapIdx = getColIdx(headers, "market cap");
  const peIdx = getColIdx(headers, "p/e");
  const ntmPeIdx = getColIdx(headers, "ntm p/e");
  const fcfIdx = getColIdx(headers, "fcf yield");
  const verdictIdx = getColIdx(headers, "valuation verdict");
  const statusIdx = getColIdx(headers, "status");
  const thesisIdx = getColIdx(headers, "research");
  const modelIdx = getColIdx(headers, "model");

  const hasLinks = thesisIdx !== -1 || modelIdx !== -1;

  const verdictCounts: Record<string, number> = {};
  rows.forEach(r => {
    const v = verdictIdx !== -1 ? r[verdictIdx]?.trim().toLowerCase() : "";
    if (v) verdictCounts[v] = (verdictCounts[v] || 0) + 1;
  });
  const reasonablyCount = verdictCounts["reasonably priced"] || 0;
  const attractivelyCount = verdictCounts["attractively priced"] || 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tracked Securities</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{rows.length}</p>
        </Card>
        <Card className="border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reasonably Priced</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{reasonablyCount}</p>
        </Card>
        <Card className="border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attractively Priced</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{attractivelyCount}</p>
        </Card>
      </div>

      <Card className="overflow-x-auto border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Watchlist — Researched Securities</h3>
          <span className="text-xs text-muted-foreground">{rows.length} companies</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <SortableHeader label="Company" colIdx={nameIdx} sort={sort} onToggle={toggleSort} className="text-left" />
              {ccyIdx !== -1 && <SortableHeader label="CCY" colIdx={ccyIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
              {priceIdx !== -1 && <SortableHeader label="Price" colIdx={priceIdx} sort={sort} onToggle={toggleSort} className="text-right" />}
              {sectorIdx !== -1 && <SortableHeader label="Sector" colIdx={sectorIdx} sort={sort} onToggle={toggleSort} className="hidden text-left md:table-cell" />}
              {mcapIdx !== -1 && <SortableHeader label="Mkt Cap" colIdx={mcapIdx} sort={sort} onToggle={toggleSort} className="hidden text-right lg:table-cell" />}
              {peIdx !== -1 && <SortableHeader label="P/E" colIdx={peIdx} sort={sort} onToggle={toggleSort} className="text-right" />}
              {ntmPeIdx !== -1 && <SortableHeader label="NTM P/E" colIdx={ntmPeIdx} sort={sort} onToggle={toggleSort} className="hidden text-right sm:table-cell" />}
              {fcfIdx !== -1 && <SortableHeader label="FCF Yield" colIdx={fcfIdx} sort={sort} onToggle={toggleSort} className="hidden text-right sm:table-cell" />}
              {verdictIdx !== -1 && <SortableHeader label="Verdict" colIdx={verdictIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
              {statusIdx !== -1 && <SortableHeader label="Status" colIdx={statusIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
              {hasLinks && <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links</th>}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => {
              const ticker = tickerIdx !== -1 ? row[tickerIdx] : "";
              const verdict = verdictIdx !== -1 ? row[verdictIdx]?.trim() : "";
              const status = statusIdx !== -1 ? row[statusIdx]?.trim() : "";
              const thesisUrl = thesisIdx !== -1 ? row[thesisIdx]?.trim() : "";
              const modelUrl = modelIdx !== -1 ? row[modelIdx]?.trim() : "";
              const verdictClass = VERDICT_COLORS[verdict.toLowerCase()] || "bg-muted text-muted-foreground border-border";
              const statusClass = STATUS_COLORS[status.toLowerCase()] || "bg-muted text-muted-foreground";

              return (
                <tr key={i} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                  <td className="px-3 py-3">
                    <div className="font-medium text-foreground">{row[nameIdx]}</div>
                    {ticker && <div className="text-xs text-muted-foreground">{ticker}</div>}
                  </td>
                  {ccyIdx !== -1 && <td className="px-3 py-3 text-center text-muted-foreground">{row[ccyIdx] || "—"}</td>}
                  {priceIdx !== -1 && <td className="px-3 py-3 text-right text-foreground">{row[priceIdx] || "—"}</td>}
                  {sectorIdx !== -1 && <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">{row[sectorIdx]}</td>}
                  {mcapIdx !== -1 && <td className="hidden px-3 py-3 text-right text-foreground lg:table-cell">{row[mcapIdx]}</td>}
                  {peIdx !== -1 && <td className="px-3 py-3 text-right text-foreground">{row[peIdx] || "—"}</td>}
                  {ntmPeIdx !== -1 && <td className="hidden px-3 py-3 text-right text-foreground sm:table-cell">{row[ntmPeIdx] || "—"}</td>}
                  {fcfIdx !== -1 && <td className="hidden px-3 py-3 text-right text-foreground sm:table-cell">{row[fcfIdx] || "—"}</td>}
                  {verdictIdx !== -1 && (
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${verdictClass}`}>{verdict || "—"}</span>
                    </td>
                  )}
                  {statusIdx !== -1 && (
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>{status || "—"}</span>
                    </td>
                  )}
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
