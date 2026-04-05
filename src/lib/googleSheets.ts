const SHEETS_BASE = "https://docs.google.com/spreadsheets/d";

export interface SheetData {
  headers: string[];
  rows: string[][];
}

export async function fetchSheet(sheetId: string, sheetName: string): Promise<SheetData> {
  const url = `${SHEETS_BASE}/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error cargando hoja "${sheetName}"`);
  const text = await res.text();
  return parseCSV(text);
}

function parseCSV(text: string): SheetData {
  const lines = parseCSVLines(text);
  if (lines.length === 0) return { headers: [], rows: [] };
  return {
    headers: lines[0],
    rows: lines.slice(1),
  };
}

function parseCSVLines(text: string): string[][] {
  const result: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field.trim());
        field = "";
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
        current.push(field.trim());
        if (current.some(c => c !== "")) result.push(current);
        current = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }
  current.push(field.trim());
  if (current.some(c => c !== "")) result.push(current);
  return result;
}

export function getCol(headers: string[], rows: string[][], colName: string): string[] {
  const idx = headers.findIndex(h => h.toLowerCase().includes(colName.toLowerCase()));
  if (idx === -1) return [];
  return rows.map(r => r[idx] || "");
}

export function getColIdx(headers: string[], colName: string): number {
  return headers.findIndex(h => h.toLowerCase().includes(colName.toLowerCase()));
}
