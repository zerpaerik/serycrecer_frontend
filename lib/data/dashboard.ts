/**
 * Datos del dashboard calculados con la información real del centro
 * (citas, atenciones, pagos y pacientes que ya están en el store).
 */
import {
  CalendarCheck2,
  CalendarClock,
  ClipboardList,
  HandCoins,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { RoleId } from "@/lib/auth/roles";
import type { Segmento, SeriePunto } from "@/components/dashboard/charts";
import type { Atencion, Cita, Paciente, Psicologo, Servicio } from "./types";
import { atnSaldo } from "./atenciones";
import { formatPEN } from "@/lib/format";

export interface KpiSeed {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  color?: string;
}

export interface CitaProxima {
  hora: string;
  paciente: string;
  servicio: string;
  psicologo: string;
  estado: string;
}

export interface DashboardData {
  saludo: string;
  kpis: KpiSeed[];
  tendenciaTitulo: string;
  tendencia: SeriePunto[];
  distribucionTitulo: string;
  distribucion: Segmento[];
  citas: CitaProxima[];
}

const TEAL = "#14a89c";
const SKY = "#2b83c2";
const GREEN = "#4fa64a";
const AMBER = "#f4b21f";
const ROSE = "#e8774a";

const COLOR_ESTADO: Record<string, string> = {
  Atendida: TEAL,
  Confirmada: SKY,
  Agendada: AMBER,
  "No asistió": ROSE,
  Cancelada: "#9ca3af",
};

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function hoyIso() {
  return new Date().toLocaleDateString("en-CA");
}

/** Fecha ISO desplazada n días respecto de hoy. */
function isoDesplazado(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("en-CA");
}

/** Suma de los pagos válidos (de atenciones no anuladas) en un rango. */
function ingresosEntre(atenciones: Atencion[], desde: string, hasta: string) {
  let total = 0;
  for (const a of atenciones) {
    if (a.anulada) continue;
    for (const p of a.pagos) {
      if (p.fecha >= desde && p.fecha <= hasta) total += p.monto;
    }
  }
  return total;
}

/** Variación porcentual entre dos periodos (0 si no hay base de comparación). */
function delta(actual: number, previo: number) {
  if (!previo) return actual > 0 ? 100 : 0;
  return Math.round(((actual - previo) / previo) * 100);
}

export interface DashboardInput {
  roleId: RoleId;
  /** Ficha de psicólogo del usuario (para el panel del profesional). */
  psicologoId?: string;
  pacientes: Paciente[];
  psicologos: Psicologo[];
  servicios: Servicio[];
  citas: Cita[];
  atenciones: Atencion[];
}

export function buildDashboard(input: DashboardInput): DashboardData {
  const { roleId, psicologoId, pacientes, psicologos, servicios } = input;
  const hoy = hoyIso();
  const esPsicologo = roleId === 2;

  // El psicólogo ve solo lo suyo; admin y recepción ven todo el centro.
  const citas = esPsicologo && psicologoId
    ? input.citas.filter((c) => c.psicologoId === psicologoId)
    : input.citas;
  const atenciones = esPsicologo && psicologoId
    ? input.atenciones.filter((a) => a.psicologoId === psicologoId)
    : input.atenciones;

  const citasHoy = citas.filter((c) => c.fecha === hoy && c.estado !== "Cancelada");
  const confirmadasHoy = citasHoy.filter((c) => c.estado === "Confirmada").length;

  // Tendencia: últimos 7 días (ingresos para gestión, sesiones para el psicólogo).
  const tendencia: SeriePunto[] = [];
  for (let i = 6; i >= 0; i--) {
    const iso = isoDesplazado(-i);
    const label = DIAS[new Date(`${iso}T12:00:00`).getDay()];
    tendencia.push({
      label,
      value: esPsicologo
        ? citas.filter((c) => c.fecha === iso && c.estado !== "Cancelada").length
        : ingresosEntre(atenciones, iso, iso),
    });
  }

  // Distribución: estado de las citas de los últimos 30 días.
  const desde30 = isoDesplazado(-30);
  const conteo = new Map<string, number>();
  for (const c of citas) {
    if (c.fecha < desde30 || c.fecha > hoy) continue;
    conteo.set(c.estado, (conteo.get(c.estado) ?? 0) + 1);
  }
  const distribucion: Segmento[] = [...conteo.entries()].map(([label, value]) => ({
    label,
    value,
    color: COLOR_ESTADO[label] ?? GREEN,
  }));

  // Próximas citas de hoy (ordenadas por hora).
  const proximas: CitaProxima[] = citasHoy
    .slice()
    .sort((a, b) => a.hora.localeCompare(b.hora))
    .slice(0, 6)
    .map((c) => {
      const p = pacientes.find((x) => x.id === c.pacienteId);
      return {
        hora: c.hora,
        paciente: p ? `${p.nombres} ${p.apellidos}` : "—",
        servicio: servicios.find((s) => s.id === c.servicioId)?.nombre ?? "—",
        psicologo: psicologos.find((x) => x.id === c.psicologoId)?.nombre ?? "—",
        estado: c.estado,
      };
    });

  if (esPsicologo) {
    // Sesiones de esta semana vs. la semana previa.
    const semanaIni = isoDesplazado(-6);
    const previaIni = isoDesplazado(-13);
    const sesionesSemana = citas.filter(
      (c) => c.fecha >= semanaIni && c.fecha <= hoy && c.estado !== "Cancelada",
    ).length;
    const sesionesPrevias = citas.filter(
      (c) => c.fecha >= previaIni && c.fecha < semanaIni && c.estado !== "Cancelada",
    ).length;

    const atendidas = citas.filter((c) => c.estado === "Atendida").length;
    const faltas = citas.filter((c) => c.estado === "No asistió").length;
    const asistencia = atendidas + faltas ? Math.round((atendidas / (atendidas + faltas)) * 100) : 0;
    const misPacientes = new Set(citas.map((c) => c.pacienteId)).size;

    return {
      saludo: "Tu jornada de hoy",
      kpis: [
        { label: "Mis citas hoy", value: String(citasHoy.length), icon: CalendarClock, hint: `${confirmadasHoy} confirmadas`, color: TEAL },
        { label: "Sesiones esta semana", value: String(sesionesSemana), icon: ClipboardList, delta: delta(sesionesSemana, sesionesPrevias), hint: "vs. semana previa", color: SKY },
        { label: "Mis pacientes", value: String(misPacientes), icon: Users, hint: "con citas registradas", color: GREEN },
        { label: "Asistencia", value: `${asistencia}%`, icon: CalendarCheck2, hint: "de sus citas cerradas", color: TEAL },
      ],
      tendenciaTitulo: "Mis sesiones de los últimos 7 días",
      tendencia,
      distribucionTitulo: "Estado de mis citas (30 días)",
      distribucion,
      citas: proximas,
    };
  }

  // Panel de gestión (administrador y recepción).
  const mesIni = `${hoy.slice(0, 8)}01`;
  const ingresosMes = ingresosEntre(atenciones, mesIni, hoy);

  const finMesPrevio = `${mesIni.slice(0, 8)}01`;
  const dPrev = new Date(`${finMesPrevio}T12:00:00`);
  dPrev.setDate(0); // último día del mes anterior
  const finPrev = dPrev.toLocaleDateString("en-CA");
  const iniPrev = `${finPrev.slice(0, 8)}01`;
  const ingresosPrevios = ingresosEntre(atenciones, iniPrev, finPrev);

  const activos = pacientes.filter((p) => p.estado === "Activo").length;
  const porCobrar = atenciones.filter((a) => !a.anulada).reduce((s, a) => s + atnSaldo(a), 0);
  const sesionesPendientes = atenciones.filter((a) => !a.anulada && atnSaldo(a) > 0).length;

  return {
    saludo: "Resumen general del consultorio",
    kpis: [
      { label: "Citas hoy", value: String(citasHoy.length), icon: CalendarClock, hint: `${confirmadasHoy} confirmadas`, color: TEAL },
      { label: "Ingresos del mes", value: formatPEN(ingresosMes), icon: Wallet, delta: delta(ingresosMes, ingresosPrevios), hint: "vs. mes anterior", color: SKY },
      { label: "Pacientes activos", value: String(activos), icon: Users, hint: `${pacientes.length} en total`, color: GREEN },
      { label: "Por cobrar", value: formatPEN(porCobrar), icon: HandCoins, hint: `${sesionesPendientes} atenciones`, color: AMBER },
    ],
    tendenciaTitulo: "Ingresos de los últimos 7 días (S/)",
    tendencia,
    distribucionTitulo: "Estado de citas (30 días)",
    distribucion,
    citas: proximas,
  };
}
