import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle, Search } from "lucide-react";
import { useSortableTable } from "@/hooks/use-sortable-table";
import SortableHeader from "@/components/SortableHeader";

interface Props {
  data: SheetData | null;
  loading: boolean;
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; className: string }> = {
  "in progress": { icon: Clock, className: "text-primary" },
  "completed": { icon: CheckCircle, className: "text-success" },
  "pending": { icon: AlertCircle, className: "text-muted-foreground" },
};

const PRIORITY_COLORS: Record<string, string> = {
  "high": "bg-destructive/15 text-destructive",
  "medium": "bg-primary/15 text-primary",
  "low": "bg-muted text-muted-foreground",
};

export default function EnDesarrolloTab({ data, loading }: Props) {
  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-card" />;
  if (!data || data.rows.length === 0) {
    return (
      <Card className="flex h-64 items-center justify-center border-border bg-card">
        <p className="text-muted-foreground">No "Pipeline" sheet found</p>
      </Card>
    );
  }

  const { headers, rows } = data;
  const { sortedRows, sort, toggleSort } = useSortableTable(rows);

  const nameIdx = getColIdx(headers, "company") !== -1 ? getColIdx(headers, "company") : 0;
  const tickerIdx = getColIdx(headers, "ticker");
  const sectorIdx = getColIdx(headers, "sector");
  const typeIdx = getColIdx(headers, "type");
  const statusIdx = getColIdx(headers, "status");
  const priorityIdx = getColIdx(headers, "priority");
  const notesIdx = getColIdx(headers, "notes");

  const statusCounts: Record<string, number> = {};
  rows.forEach(r => {
    const s = statusIdx !== -1 ? r[statusIdx]?.trim() : "";
    if (s) statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Research Pipeline</h3>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{rows.length} <span className="text-base font-normal text-muted-foreground">companies tracked</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status.toLowerCase()];
              const Icon = cfg?.icon || Search;
              return (
                <span key={status} className={`flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium ${cfg?.className || "text-muted-foreground"}`}>
                  <Icon className="h-3 w-3" /> {status}: {count}
                </span>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto border-border bg-card p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <SortableHeader label="Company" colIdx={nameIdx} sort={sort} onToggle={toggleSort} className="text-left" />
              {sectorIdx !== -1 && <SortableHeader label="Sector" colIdx={sectorIdx} sort={sort} onToggle={toggleSort} className="hidden text-left md:table-cell" />}
              {typeIdx !== -1 && <SortableHeader label="Type" colIdx={typeIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
              {statusIdx !== -1 && <SortableHeader label="Status" colIdx={statusIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
              {priorityIdx !== -1 && <SortableHeader label="Priority" colIdx={priorityIdx} sort={sort} onToggle={toggleSort} className="text-center" />}
              {notesIdx !== -1 && <SortableHeader label="Notes" colIdx={notesIdx} sort={sort} onToggle={toggleSort} className="hidden text-left md:table-cell" />}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => {
              const ticker = tickerIdx !== -1 ? row[tickerIdx] : "";
              const status = statusIdx !== -1 ? row[statusIdx]?.trim() : "";
              const priority = priorityIdx !== -1 ? row[priorityIdx]?.trim() : "";
              const statusCfg = STATUS_CONFIG[status.toLowerCase()];
              const StatusIcon = statusCfg?.icon || Clock;
              const priorityClass = PRIORITY_COLORS[priority.toLowerCase()] || "bg-muted text-muted-foreground";

              return (
                <tr key={i} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                  <td className="px-3 py-3.5">
                    <div className="font-medium text-foreground">{row[nameIdx]}</div>
                    {ticker && <div className="text-xs text-muted-foreground">{ticker}</div>}
                  </td>
                  {sectorIdx !== -1 && <td className="hidden px-3 py-3.5 text-muted-foreground md:table-cell">{row[sectorIdx]}</td>}
                  {typeIdx !== -1 && (
                    <td className="px-3 py-3.5 text-center">
                      <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{row[typeIdx] || "—"}</span>
                    </td>
                  )}
                  {statusIdx !== -1 && (
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusCfg?.className || "text-muted-foreground"}`}>
                        <StatusIcon className="h-3.5 w-3.5" /> {status || "—"}
                      </span>
                    </td>
                  )}
                  {priorityIdx !== -1 && (
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityClass}`}>{priority || "—"}</span>
                    </td>
                  )}
                  {notesIdx !== -1 && <td className="hidden px-3 py-3.5 text-muted-foreground md:table-cell max-w-xs truncate">{row[notesIdx] || "—"}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
