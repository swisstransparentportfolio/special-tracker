import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { SortState } from "@/hooks/use-sortable-table";

interface Props {
  label: string;
  colIdx: number;
  sort: SortState;
  onToggle: (idx: number) => void;
  className?: string;
}

export default function SortableHeader({ label, colIdx, sort, onToggle, className = "" }: Props) {
  const active = sort.colIdx === colIdx;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
      onClick={() => onToggle(colIdx)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className={`h-3 w-3 ${active ? "text-foreground" : "text-muted-foreground/50"}`} />
      </span>
    </th>
  );
}
