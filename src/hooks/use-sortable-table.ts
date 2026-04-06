import { useState, useMemo } from "react";

type SortDir = "asc" | "desc" | null;

export interface SortState {
  colIdx: number | null;
  dir: SortDir;
}

function parseForSort(val: string): number | string {
  if (!val || val === "—") return "";
  const cleaned = val.replace(/[$€£,%]/g, "").replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? val.toLowerCase() : num;
}

export function useSortableTable(rows: string[][]) {
  const [sort, setSort] = useState<SortState>({ colIdx: null, dir: null });

  const toggleSort = (colIdx: number) => {
    setSort(prev => {
      if (prev.colIdx !== colIdx) return { colIdx, dir: "asc" };
      if (prev.dir === "asc") return { colIdx, dir: "desc" };
      return { colIdx: null, dir: null };
    });
  };

  const sortedRows = useMemo(() => {
    if (sort.colIdx === null || !sort.dir) return rows;
    const idx = sort.colIdx;
    return [...rows].sort((a, b) => {
      const va = parseForSort(a[idx] || "");
      const vb = parseForSort(b[idx] || "");
      if (va === "" && vb === "") return 0;
      if (va === "") return 1;
      if (vb === "") return -1;
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
      return sort.dir === "desc" ? -cmp : cmp;
    });
  }, [rows, sort]);

  return { sortedRows, sort, toggleSort };
}
