import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { FileText, Search, BarChart3, Lightbulb, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  data: SheetData | null;
  loading: boolean;
}

const TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  tesis: { icon: Search, color: "text-muted-foreground", bg: "bg-secondary border-border" },
  thesis: { icon: Search, color: "text-muted-foreground", bg: "bg-secondary border-border" },
  artículo: { icon: FileText, color: "text-primary", bg: "bg-primary/10 border-primary/30" },
  articulo: { icon: FileText, color: "text-primary", bg: "bg-primary/10 border-primary/30" },
  article: { icon: FileText, color: "text-primary", bg: "bg-primary/10 border-primary/30" },
  investigación: { icon: Lightbulb, color: "text-success", bg: "bg-success/10 border-success/30" },
  research: { icon: Lightbulb, color: "text-success", bg: "bg-success/10 border-success/30" },
  "modelo financiero": { icon: BarChart3, color: "text-muted-foreground", bg: "bg-secondary border-border" },
  "financial model": { icon: BarChart3, color: "text-muted-foreground", bg: "bg-secondary border-border" },
};

const STATUS_CONFIG: Record<string, { icon: typeof Clock; className: string }> = {
  "en progreso": { icon: Clock, className: "text-primary" },
  "in progress": { icon: Clock, className: "text-primary" },
  completado: { icon: CheckCircle, className: "text-success" },
  completed: { icon: CheckCircle, className: "text-success" },
  done: { icon: CheckCircle, className: "text-success" },
  pendiente: { icon: AlertCircle, className: "text-muted-foreground" },
  pending: { icon: AlertCircle, className: "text-muted-foreground" },
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
  const titleIdx = getColIdx(headers, "título") !== -1 ? getColIdx(headers, "título") : getColIdx(headers, "titulo") !== -1 ? getColIdx(headers, "titulo") : getColIdx(headers, "title") !== -1 ? getColIdx(headers, "title") : 0;
  const typeIdx = getColIdx(headers, "tipo") !== -1 ? getColIdx(headers, "tipo") : getColIdx(headers, "type");
  const dateIdx = getColIdx(headers, "fecha") !== -1 ? getColIdx(headers, "fecha") : getColIdx(headers, "date");
  const statusIdx = getColIdx(headers, "estado") !== -1 ? getColIdx(headers, "estado") : getColIdx(headers, "status");
  const descIdx = getColIdx(headers, "descripci") !== -1 ? getColIdx(headers, "descripci") : getColIdx(headers, "description");

  const typeCounts: Record<string, number> = {};
  rows.forEach(r => {
    const t = typeIdx !== -1 ? r[typeIdx]?.toLowerCase().trim() : "";
    if (t) typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary bar */}
      <Card className="border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Research Pipeline</h3>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{rows.length} <span className="text-base font-normal text-muted-foreground">items in progress</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeCounts).map(([type, count]) => {
              const cfg = TYPE_CONFIG[type] || TYPE_CONFIG["article"]!;
              const Icon = cfg.icon;
              return (
                <span key={type} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                  <Icon className="h-3 w-3" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
                </span>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Pipeline table */}
      <Card className="overflow-x-auto border-border bg-card p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
              {typeIdx !== -1 && <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>}
              {statusIdx !== -1 && <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>}
              {dateIdx !== -1 && <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>}
              {descIdx !== -1 && <th className="hidden px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Description</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const type = typeIdx !== -1 ? row[typeIdx]?.toLowerCase().trim() : "";
              const cfg = TYPE_CONFIG[type] || TYPE_CONFIG["article"]!;
              const Icon = cfg.icon;
              const status = statusIdx !== -1 ? row[statusIdx]?.toLowerCase().trim() : "";
              const statusCfg = STATUS_CONFIG[status];
              const StatusIcon = statusCfg?.icon || Clock;

              return (
                <tr key={i} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                  <td className="px-3 py-3.5">
                    <span className="font-medium text-foreground">{row[titleIdx]}</span>
                  </td>
                  {typeIdx !== -1 && (
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {row[typeIdx]}
                      </span>
                    </td>
                  )}
                  {statusIdx !== -1 && (
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusCfg?.className || "text-muted-foreground"}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {row[statusIdx] || "—"}
                      </span>
                    </td>
                  )}
                  {dateIdx !== -1 && (
                    <td className="px-3 py-3.5 text-right text-muted-foreground">
                      {row[dateIdx] || "—"}
                    </td>
                  )}
                  {descIdx !== -1 && (
                    <td className="hidden px-3 py-3.5 text-muted-foreground md:table-cell max-w-xs truncate">
                      {row[descIdx] || "—"}
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
