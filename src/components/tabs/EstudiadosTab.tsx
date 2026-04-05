import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";
import { FileText, BarChart3 } from "lucide-react";

interface Props {
  data: SheetData | null;
  loading: boolean;
}

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
  const nameIdx = getColIdx(headers, "empresa") !== -1 ? getColIdx(headers, "empresa") : 0;
  const tickerIdx = getColIdx(headers, "ticker");
  const currencyIdx = getColIdx(headers, "moneda");
  const priceIdx = getColIdx(headers, "precio");
  const targetIdx = getColIdx(headers, "p.o");
  const cagrIdx = getColIdx(headers, "cagr");
  const riskIdx = getColIdx(headers, "riesgo");
  const thesisIdx = getColIdx(headers, "tesis");
  const modelIdx = getColIdx(headers, "modelo");

  const withTarget = rows.filter(r => targetIdx !== -1 && r[targetIdx]?.trim()).length;
  const hasLinks = thesisIdx !== -1 || modelIdx !== -1;

  return (
    <div className="animate-fade-in">
      <Card className="overflow-x-auto border-border bg-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Researched Securities — Not in Portfolio
          </h3>
          <span className="text-xs text-muted-foreground">
            {rows.length} companies · {withTarget} with P.O.
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</th>
              {currencyIdx !== -1 && <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Currency</th>}
              {priceIdx !== -1 && <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Price</th>}
              {targetIdx !== -1 && <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">P.O. 3Y</th>}
              {cagrIdx !== -1 && <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">CAGR 3Y</th>}
              {riskIdx !== -1 && <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk</th>}
              {hasLinks && <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links</th>}
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
                  <td className="px-3 py-3.5">
                    <div className="font-medium text-foreground">{row[nameIdx]}</div>
                    {ticker && <div className="text-xs text-muted-foreground">{ticker}</div>}
                  </td>
                  {currencyIdx !== -1 && <td className="px-3 py-3.5 text-center font-medium text-muted-foreground">{row[currencyIdx]}</td>}
                  {priceIdx !== -1 && <td className="px-3 py-3.5 text-right text-foreground">{row[priceIdx]}</td>}
                  {targetIdx !== -1 && <td className="px-3 py-3.5 text-right font-medium text-foreground">{row[targetIdx] || "—"}</td>}
                  {cagrIdx !== -1 && (
                    <td className={`px-3 py-3.5 text-right font-medium ${
                      isPositive ? "text-success" : cagr ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {cagr || "—"}
                    </td>
                  )}
                  {riskIdx !== -1 && (
                    <td className="px-3 py-3.5 text-center">
                      <RiskBadge value={row[riskIdx]} />
                    </td>
                  )}
                  {hasLinks && (
                    <td className="px-3 py-3.5 text-right">
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
