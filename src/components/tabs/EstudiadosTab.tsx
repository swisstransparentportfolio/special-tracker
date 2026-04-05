import { SheetData, getColIdx } from "@/lib/googleSheets";
import { Card } from "@/components/ui/card";

interface Props {
  data: SheetData | null;
  loading: boolean;
}

export default function EstudiadosTab({ data, loading }: Props) {
  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-card" />;
  if (!data || data.rows.length === 0) {
    return (
      <Card className="flex h-64 items-center justify-center border-border bg-card">
        <p className="text-muted-foreground">No se encontró la hoja "Estudiados"</p>
      </Card>
    );
  }

  const { headers, rows } = data;
  const nameIdx = getColIdx(headers, "empresa") !== -1 ? getColIdx(headers, "empresa") : 0;
  const currencyIdx = getColIdx(headers, "moneda");
  const priceIdx = getColIdx(headers, "precio");
  const targetIdx = getColIdx(headers, "p.o");
  const cagrIdx = getColIdx(headers, "cagr");
  const riskIdx = getColIdx(headers, "riesgo");

  const withTarget = rows.filter(r => targetIdx !== -1 && r[targetIdx]?.trim()).length;

  return (
    <div className="animate-fade-in">
      <Card className="overflow-x-auto border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Valores estudiados — fuera de cartera
          </h3>
          <span className="text-xs text-muted-foreground">
            {rows.length} empresas · {withTarget} con P.O.
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa</th>
              {currencyIdx !== -1 && <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Moneda</th>}
              {priceIdx !== -1 && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Precio actual</th>}
              {targetIdx !== -1 && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">P.O. 3A</th>}
              {cagrIdx !== -1 && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">CAGR 3A</th>}
              {riskIdx !== -1 && <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Riesgo</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const cagr = cagrIdx !== -1 ? row[cagrIdx] : "";
              const isPositive = cagr.startsWith("+") || (parseFloat(cagr.replace(",", ".").replace("%", "")) > 0);
              return (
                <tr key={i} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                  <td className="px-3 py-2.5 font-medium text-foreground">{row[nameIdx]}</td>
                  {currencyIdx !== -1 && <td className="px-3 py-2.5 text-center text-muted-foreground">{row[currencyIdx]}</td>}
                  {priceIdx !== -1 && <td className="px-3 py-2.5 text-right text-foreground">{row[priceIdx]}</td>}
                  {targetIdx !== -1 && <td className="px-3 py-2.5 text-right text-foreground">{row[targetIdx] || "—"}</td>}
                  {cagrIdx !== -1 && (
                    <td className={`px-3 py-2.5 text-right font-medium ${
                      isPositive ? "text-success" : cagr ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {cagr || "—"}
                    </td>
                  )}
                  {riskIdx !== -1 && (
                    <td className="px-3 py-2.5 text-center">
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
