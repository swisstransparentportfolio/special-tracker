export default function RiskBadge({ value }: { value: string }) {
  const num = parseInt(value);
  if (isNaN(num)) return <span className="text-muted-foreground">—</span>;
  const hue = Math.round(120 * (1 - (Math.min(Math.max(num, 1), 10) - 1) / 9));
  const bg = `hsla(${hue}, 60%, 50%, 0.18)`;
  const fg = `hsl(${hue}, 65%, 42%)`;
  return <span style={{ background: bg, color: fg }} className="inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold">{num}</span>;
}
