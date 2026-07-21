/**
 * Datos simulados del dashboard, según el rol.
 * Todo es mock para la demo (sin backend).
 */
import {
  CalendarCheck2,
  CalendarClock,
  ClipboardList,
  HandCoins,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { RoleId } from "@/lib/auth/roles";
import type { Segmento, SeriePunto } from "@/components/dashboard/charts";

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
  estado: "Confirmada" | "Pendiente" | "En espera";
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

const TEAL = "#0d9488";
const SKY = "#0ea5e9";
const VIOLET = "#8b5cf6";
const AMBER = "#f59e0b";
const ROSE = "#f43f5e";

const semana: SeriePunto[] = [
  { label: "Lun", value: 8 },
  { label: "Mar", value: 11 },
  { label: "Mié", value: 9 },
  { label: "Jue", value: 13 },
  { label: "Vie", value: 15 },
  { label: "Sáb", value: 7 },
];

const ingresosSemana: SeriePunto[] = [
  { label: "Lun", value: 640 },
  { label: "Mar", value: 880 },
  { label: "Mié", value: 720 },
  { label: "Jue", value: 1040 },
  { label: "Vie", value: 1200 },
  { label: "Sáb", value: 560 },
];

const estadosCitas: Segmento[] = [
  { label: "Atendidas", value: 24, color: TEAL },
  { label: "Confirmadas", value: 12, color: SKY },
  { label: "Pendientes", value: 6, color: AMBER },
  { label: "No asistió", value: 3, color: ROSE },
];

const citasHoy: CitaProxima[] = [
  { hora: "09:00", paciente: "Lucía Vega", servicio: "Terapia individual", psicologo: "Lic. Camila Torres", estado: "Confirmada" },
  { hora: "10:30", paciente: "Diego Ramos", servicio: "Evaluación inicial", psicologo: "Lic. Camila Torres", estado: "Confirmada" },
  { hora: "12:00", paciente: "María Flores", servicio: "Terapia de pareja", psicologo: "Lic. Camila Torres", estado: "Pendiente" },
  { hora: "16:00", paciente: "Jorge Salas", servicio: "Terapia individual", psicologo: "Lic. Camila Torres", estado: "En espera" },
];

export function dashboardForRole(roleId: RoleId): DashboardData {
  if (roleId === 1) {
    // Administrador — visión de gestión y finanzas
    return {
      saludo: "Resumen general del consultorio",
      kpis: [
        { label: "Citas hoy", value: "18", icon: CalendarClock, delta: 12, hint: "vs. ayer", color: TEAL },
        { label: "Ingresos del mes", value: "S/ 14,820", icon: TrendingUp, delta: 8, hint: "vs. mes anterior", color: SKY },
        { label: "Pacientes activos", value: "132", icon: Users, delta: 5, hint: "últimos 90 días", color: VIOLET },
        { label: "Por cobrar", value: "S/ 1,240", icon: HandCoins, delta: -3, hint: "8 sesiones", color: AMBER },
      ],
      tendenciaTitulo: "Ingresos de la semana (S/)",
      tendencia: ingresosSemana,
      distribucionTitulo: "Estado de citas · esta semana",
      distribucion: estadosCitas,
      citas: citasHoy,
    };
  }

  if (roleId === 2) {
    // Psicólogo — visión clínica
    return {
      saludo: "Tu jornada de hoy",
      kpis: [
        { label: "Mis citas hoy", value: "6", icon: CalendarClock, delta: 0, hint: "2 confirmadas", color: TEAL },
        { label: "Sesiones esta semana", value: "23", icon: ClipboardList, delta: 15, hint: "vs. semana previa", color: SKY },
        { label: "Mis pacientes", value: "41", icon: Users, delta: 4, hint: "en tratamiento", color: VIOLET },
        { label: "Asistencia", value: "88%", icon: CalendarCheck2, delta: 2, hint: "este mes", color: TEAL },
      ],
      tendenciaTitulo: "Mis sesiones de la semana",
      tendencia: semana,
      distribucionTitulo: "Estado de mis citas",
      distribucion: estadosCitas,
      citas: citasHoy,
    };
  }

  // Recepción — visión operativa
  return {
    saludo: "Agenda y caja de hoy",
    kpis: [
      { label: "Citas hoy", value: "18", icon: CalendarClock, delta: 12, hint: "4 por confirmar", color: TEAL },
      { label: "Pacientes nuevos", value: "3", icon: UserPlus, delta: 50, hint: "hoy", color: VIOLET },
      { label: "Cobrado hoy", value: "S/ 1,120", icon: Wallet, delta: 6, hint: "14 pagos", color: SKY },
      { label: "Por cobrar", value: "S/ 1,240", icon: HandCoins, delta: -3, hint: "8 sesiones", color: AMBER },
    ],
    tendenciaTitulo: "Citas de la semana",
    tendencia: semana,
    distribucionTitulo: "Estado de citas · hoy",
    distribucion: estadosCitas,
    citas: citasHoy,
  };
}
