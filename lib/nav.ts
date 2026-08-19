import {
  BarChartBig,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  ClipboardPlus,
  HandCoins,
  HeartPulse,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  SlidersHorizontal,
  Stethoscope,
  UserCog,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { RoleId } from "./auth/roles";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: RoleId[];
  /** Marca los módulos ya implementados (vs. "en construcción"). */
  built?: boolean;
}

export interface NavGroup {
  id: string;
  label: string | null;
  items: NavItem[];
}

const ALL: RoleId[] = [1, 2, 3];

export const NAV: NavGroup[] = [
  {
    id: "inicio",
    label: null,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL, built: true },
    ],
  },
  {
    id: "agenda",
    label: "Agenda",
    items: [
      { label: "Citas", href: "/citas", icon: CalendarDays, roles: ALL },
      { label: "Disponibilidad", href: "/disponibilidad", icon: CalendarClock, roles: ALL },
    ],
  },
  {
    id: "clinico",
    label: "Clínico",
    items: [
      { label: "Pacientes", href: "/pacientes", icon: UserRound, roles: [1, 3] },
      { label: "Atenciones", href: "/atenciones", icon: ClipboardPlus, roles: [1, 3] },
      // Historia clínica: solo Admin y Psicólogo (confidencialidad).
      { label: "Historia Clínica", href: "/historia-clinica", icon: HeartPulse, roles: [1, 2] },
      { label: "Asistencia", href: "/asistencia", icon: CalendarCheck2, roles: [1, 3] },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    items: [
      { label: "Pagos y Caja", href: "/pagos", icon: Wallet, roles: [1, 3] },
      { label: "Cuentas por Cobrar", href: "/cobrar", icon: HandCoins, roles: [1, 3] },
      { label: "Gastos", href: "/gastos", icon: Receipt, roles: [1, 3] },
    ],
  },
  {
    id: "reportes",
    label: "Reportes",
    items: [
      { label: "Reportes", href: "/reportes", icon: BarChartBig, roles: [1] },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    items: [
      { label: "Usuarios", href: "/administrativo/usuarios", icon: Users, roles: [1] },
      { label: "Psicólogos", href: "/administrativo/psicologos", icon: Stethoscope, roles: [1] },
      { label: "Servicios y Tarifas", href: "/administrativo/servicios", icon: SlidersHorizontal, roles: [1] },
      { label: "Paquetes", href: "/administrativo/paquetes", icon: Package, roles: [1] },
      { label: "Configuración", href: "/administrativo/configuracion", icon: Settings, roles: [1] },
    ],
  },
  {
    id: "cuenta",
    label: "Cuenta",
    items: [
      { label: "Mi cuenta", href: "/mi-cuenta", icon: UserCog, roles: ALL, built: true },
    ],
  },
];

/** Devuelve el menú filtrado para un rol (grupos sin items se omiten). */
export function navForRole(roleId: RoleId): NavGroup[] {
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.roles.includes(roleId)),
  })).filter((g) => g.items.length > 0);
}

const ALL_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);

/** Busca un item por href exacto (para títulos/breadcrumbs). */
export function findNavItem(href: string): NavItem | undefined {
  return ALL_ITEMS.find((i) => i.href === href);
}

/** Etiqueta del grupo al que pertenece un href. */
export function groupLabelForHref(href: string): string | null {
  const g = NAV.find((g) => g.items.some((i) => i.href === href));
  return g?.label ?? null;
}
