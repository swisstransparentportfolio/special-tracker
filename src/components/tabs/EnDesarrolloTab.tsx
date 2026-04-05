import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { FileText, Search, BarChart3, Lightbulb } from "lucide-react";

interface Props {
  data: SheetData | null;
  loading: boolean;
}

const TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  "tesis": { icon: Search, color: "text-purple-400", bg: "bg-purple-400/15 border-purple-400/30" },
  "artículo": { icon: FileText, color: "text-primary", bg: "bg-primary/15 border-primary/30" },
  "articulo": { icon: FileText, color: "text-primary", bg: "bg-primary/15 border-primary/30" },
  "investigación": { icon: Lightbulb, color: "text-emerald-400", bg: "bg-emerald-400/15 border-emerald-400/30" },
  "investigacion": { icon: Lightbulb, color: "text-emerald-400", bg: "bg-emerald-400/15 border-emerald-400/30" },
  "modelo financiero": { icon: BarChart3, color: "text-blue-400", bg: "bg-blue-400/15 border-blue-400/30" },
  "modelo": { icon: BarChart3, color: "text-blue-400", bg: "bg-blue-400/15 border-blue-400/30" },
};

export default function EnDesarrolloTab({ data, loading }: Props) {
  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-card" />;
  if (!data || data.rows.length === 0) {
    return (
      <Card className="flex h-64 items-center justify-center border-border bg-card">
        <p className="text-muted-foreground">No se encontró la hoja "En desarrollo"</p>
      </Card>
    );
  }

  const { headers, rows } = data;
  const titleIdx = getColIdx(headers, "título") !== -1 ? getColIdx(headers, "título") : getColIdx(headers, "titulo") !== -1 ? getColIdx(headers, "titulo") : 0;
  const typeIdx = getColIdx(headers, "tipo");
  const dateIdx = getColIdx(headers, "fecha");
  const statusIdx = getColIdx(headers, "estado");

  // Count by type
  const typeCounts: Record<string, number> = {};
  rows.forEach(r => {
    const t = typeIdx !== -1 ? r[typeIdx]?.toLowerCase().trim() : "";
    if (t) typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-foreground">{rows.length} publicaciones en preparación</span>
        {Object.entries(typeCounts).map(([type, count]) => {
          const cfg = TYPE_CONFIG[type] || TYPE_CONFIG["artículo"]!;
          const Icon = cfg.icon;
          return (
            <span key={type} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
              <Icon className="h-3 w-3" />
              {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
            </span>
          );
        })}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rows.map((row, i) => {
          const type = typeIdx !== -1 ? row[typeIdx]?.toLowerCase().trim() : "";
          const cfg = TYPE_CONFIG[type] || TYPE_CONFIG["artículo"]!;
          const Icon = cfg.icon;
          return (
            <Card key={i} className="border-border bg-card p-5 transition-all hover:border-primary/30">
              <div className="flex items-start justify-between">
                <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                  <Icon className="h-3 w-3" />
                  {typeIdx !== -1 ? row[typeIdx] : "—"}
                </span>
                {dateIdx !== -1 && row[dateIdx] && (
                  <span className="text-xs text-muted-foreground">📅 {row[dateIdx]}</span>
                )}
              </div>
              <h4 className="mt-3 font-display font-semibold text-foreground">{row[titleIdx]}</h4>
              {statusIdx !== -1 && row[statusIdx] && (
                <p className="mt-1 text-xs text-muted-foreground">{row[statusIdx]}</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
