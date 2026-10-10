/**
 * Quote a CSV cell and neutralise spreadsheet formulas (CSV injection).
 * Values starting with = + - @ (or a tab/CR) are prefixed with an apostrophe so
 * Excel and Google Sheets treat them as text instead of executing them.
 */
export function csvCell(value) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header, rows) {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}
