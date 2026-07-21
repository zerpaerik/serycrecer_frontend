/**
 * Roles y usuarios demo del consultorio psicológico "Ser y Crecer".
 * Sistema 100% simulado en frontend (sin backend).
 *
 * Roles:
 *  1 · Administrador — acceso total (gestión, finanzas, configuración).
 *  2 · Psicólogo — su agenda, sus pacientes, atenciones e historia clínica.
 *  3 · Recepción — agenda, pacientes, citas, cobros y asistencia
 *      (sin acceso a la historia clínica, por confidencialidad).
 */

export type RoleId = 1 | 2 | 3;

export interface Role {
  id: RoleId;
  name: string;
  short: string;
  description: string;
  /** Color de marca para avatar/badge (hex). */
  color: string;
}

export const ROLES: Role[] = [
  {
    id: 1,
    name: "Administrador",
    short: "Admin",
    description: "Administración total del consultorio",
    color: "#0d9488",
  },
  {
    id: 2,
    name: "Psicólogo",
    short: "Psicólogo",
    description: "Atención clínica y sus pacientes",
    color: "#8b5cf6",
  },
  {
    id: 3,
    name: "Recepción",
    short: "Recepción",
    description: "Agenda, citas, cobros y asistencia",
    color: "#0ea5e9",
  },
];

export function getRole(id: RoleId): Role {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

export interface DemoUser {
  id: number;
  name: string;
  email: string;
  roleId: RoleId;
  /** Cargo mostrado en el menú de usuario. */
  title: string;
}

/** Un usuario de demostración por rol (contraseña demo: "demo123"). */
export const DEMO_USERS: DemoUser[] = [
  {
    id: 1,
    name: "Erik Zerpa",
    email: "admin@serycrecer.pe",
    roleId: 1,
    title: "Administrador General",
  },
  {
    id: 2,
    name: "Lic. Camila Torres",
    email: "psicologo@serycrecer.pe",
    roleId: 2,
    title: "Psicóloga Clínica",
  },
  {
    id: 3,
    name: "Andrea Flores",
    email: "recepcion@serycrecer.pe",
    roleId: 3,
    title: "Recepcionista",
  },
];

export function demoUserForRole(roleId: RoleId): DemoUser {
  return DEMO_USERS.find((u) => u.roleId === roleId) ?? DEMO_USERS[0];
}

export function demoUserByEmail(email: string): DemoUser | undefined {
  return DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  );
}
