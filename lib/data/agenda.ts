import type { Cita, Disponibilidad } from "./types";

export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const toMin = (h: string) => {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
};
const toHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Día de la semana (0=Domingo…6=Sábado) de una fecha YYYY-MM-DD. */
export function diaSemanaDe(fecha: string): number {
  return new Date(fecha + "T12:00:00").getDay();
}

/**
 * Horarios libres de un psicólogo en una fecha: genera los slots de sus
 * franjas de disponibilidad de ese día y descarta los ya ocupados por citas.
 */
export function slotsDisponibles(
  disponibilidad: Disponibilidad[],
  citas: Cita[],
  psicologoId: string,
  fecha: string,
): string[] {
  const dow = diaSemanaDe(fecha);
  const franjas = disponibilidad.filter(
    (d) => d.psicologoId === psicologoId && d.diaSemana === dow,
  );
  const ocupadas = new Set(
    citas
      .filter((c) => c.psicologoId === psicologoId && c.fecha === fecha && c.estado !== "Cancelada")
      .map((c) => c.hora),
  );
  const slots: string[] = [];
  for (const f of franjas) {
    const paso = f.duracionMin > 0 ? f.duracionMin : 60;
    for (let t = toMin(f.horaInicio); t + paso <= toMin(f.horaFin); t += paso) {
      const hora = toHHMM(t);
      if (!ocupadas.has(hora)) slots.push(hora);
    }
  }
  return [...new Set(slots)].sort();
}
