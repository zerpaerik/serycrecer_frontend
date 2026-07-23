/**
 * Cálculos derivados de atenciones y paquetes (sin estado).
 */
import type { Atencion, Cita, EstadoPago, PaquetePaciente } from "./types";

export function atnTotal(a: Atencion): number {
  return a.items.reduce((s, i) => s + (Number(i.monto) || 0), 0);
}

export function atnPagado(a: Atencion): number {
  return a.pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
}

export function atnSaldo(a: Atencion): number {
  return Math.max(0, atnTotal(a) - atnPagado(a));
}

export function atnEstado(a: Atencion): EstadoPago {
  const pagado = atnPagado(a);
  if (pagado >= atnTotal(a)) return "Pagado";
  return pagado > 0 ? "Parcial" : "Pendiente";
}

/** Métodos de pago usados en una atención (para chips en la lista). */
export function atnMetodos(a: Atencion): string[] {
  return [...new Set(a.pagos.map((p) => p.metodo))];
}

/** Sesiones ya consumidas de un paquete (citas no canceladas ligadas a él). */
export function sesionesUsadas(citas: Cita[], paquetePacienteId: string): number {
  return citas.filter(
    (c) => c.paquetePacienteId === paquetePacienteId && c.estado !== "Cancelada",
  ).length;
}

/** Sesiones restantes de un paquete del paciente. */
export function sesionesRestantes(pp: PaquetePaciente, citas: Cita[]): number {
  return Math.max(0, pp.totalSesiones - sesionesUsadas(citas, pp.id));
}
