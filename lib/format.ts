/**
 * Utilidades de formato — contexto Perú (Soles S/, es-PE).
 */

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un monto como Soles peruanos: S/ 1,234.50 */
export function formatPEN(value: number): string {
  return PEN.format(value ?? 0);
}

/** Número compacto: 1.2k, 3.4M */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("es-PE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

/** Porcentaje: 12.5% */
export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

const DATE_FULL = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_LONG = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Parsea una fecha. Las cadenas "YYYY-MM-DD" se interpretan a mediodía local
 * para evitar el desfase de un día por zona horaria (UTC medianoche).
 */
function parseFecha(date: string | Date): Date {
  if (typeof date !== "string") return date;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date + "T12:00:00") : new Date(date);
}

/** 06 jun 2026 */
export function formatDate(date: string | Date): string {
  const d = parseFecha(date);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_FULL.format(d);
}

/** 6 de junio de 2026 */
export function formatDateLong(date: string | Date): string {
  const d = parseFecha(date);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_LONG.format(d);
}

/** Calcula la edad en años a partir de una fecha de nacimiento. */
export function calcAge(birth: string | Date): number {
  const b = typeof birth === "string" ? new Date(birth) : birth;
  if (Number.isNaN(b.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/** Iniciales a partir de un nombre completo: "Ana María Pérez" -> "AP" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
