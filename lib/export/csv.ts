/**
 * Exportación a CSV en el navegador (sin dependencias).
 * Genera un archivo con BOM UTF-8 para que Excel respete los acentos.
 */

type Cell = string | number | boolean | null | undefined;

function escape(value: Cell): string {
  const s = value == null ? "" : String(value);
  // Entre comillas si contiene separador, comillas o saltos de línea.
  if (/[",;\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Descarga `rows` como CSV. Las columnas se toman de `headers`
 * (mapa clave → etiqueta) o de las claves de la primera fila.
 */
export function exportCSV(
  filename: string,
  rows: Record<string, Cell>[],
  headers?: Record<string, string>,
): void {
  if (typeof window === "undefined") return;

  const keys = headers ? Object.keys(headers) : Object.keys(rows[0] ?? {});
  const titles = headers ? keys.map((k) => headers[k]) : keys;

  const lines = [
    titles.map(escape).join(";"),
    ...rows.map((row) => keys.map((k) => escape(row[k])).join(";")),
  ];

  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
