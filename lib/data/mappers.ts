/**
 * Normalización entre la API (NestJS/Prisma) y los tipos del frontend.
 * - Los `id` numéricos de la API se convierten a `string` (el front usa strings).
 * - Los montos `Decimal` llegan como string → se convierten a `number`.
 */
import type {
  Atencion,
  AtnItem,
  Cita,
  ConsultorioConfig,
  EvaluacionNeuro,
  EvolucionSesion,
  Pago,
  Paciente,
  Paquete,
  PaquetePaciente,
  Psicologo,
  Servicio,
  Usuario,
} from "./types";
import type { RoleId } from "@/lib/auth/roles";

/* eslint-disable @typescript-eslint/no-explicit-any */

const s = (v: unknown): string => (v == null ? "" : String(v));
const sOpt = (v: unknown): string | undefined => (v == null ? undefined : String(v));
const n = (v: unknown): number => Number(v ?? 0);

export function mapPaciente(r: any): Paciente {
  return {
    id: s(r.id),
    tipoDoc: r.tipoDoc ?? "DNI",
    numDoc: r.numDoc ?? "",
    nombres: r.nombres ?? "",
    apellidos: r.apellidos ?? "",
    sexo: r.sexo ?? "Femenino",
    fechaNacimiento: r.fechaNacimiento ?? "",
    telefono: r.telefono ?? "",
    email: r.email ?? undefined,
    direccion: r.direccion ?? undefined,
    contactoNombre: r.contactoNombre ?? undefined,
    contactoTelefono: r.contactoTelefono ?? undefined,
    motivoConsulta: r.motivoConsulta ?? undefined,
    estado: r.estado ?? "Activo",
    creadoEn: r.createdAt ?? r.creadoEn ?? "",
  };
}

export function mapPsicologo(r: any): Psicologo {
  return {
    id: s(r.id),
    nombre: r.nombre,
    especialidad: r.especialidad,
    color: r.color,
    email: r.email ?? undefined,
    telefono: r.telefono ?? undefined,
    horario: r.horario ?? undefined,
  };
}

export function mapServicio(r: any): Servicio {
  return {
    id: s(r.id),
    nombre: r.nombre,
    duracionMin: n(r.duracionMin),
    precio: n(r.precio),
    color: r.color,
  };
}

export function mapPaquete(r: any): Paquete {
  return {
    id: s(r.id),
    nombre: r.nombre,
    sesiones: n(r.sesiones),
    precio: n(r.precio),
    servicioId: sOpt(r.servicioId),
    color: r.color,
  };
}

export function mapPaquetePaciente(r: any): PaquetePaciente {
  return {
    id: s(r.id),
    pacienteId: s(r.pacienteId),
    paqueteId: s(r.paqueteId),
    nombre: r.nombre,
    totalSesiones: n(r.totalSesiones),
    precio: n(r.precio),
    fecha: r.fecha,
    atencionId: sOpt(r.atencionId),
    creadoEn: r.createdAt ?? "",
  };
}

export function mapCita(r: any): Cita {
  return {
    id: s(r.id),
    pacienteId: s(r.pacienteId),
    psicologoId: s(r.psicologoId),
    servicioId: s(r.servicioId),
    fecha: r.fecha,
    hora: r.hora,
    estado: r.estado,
    tardanza: !!r.tardanza,
    paquetePacienteId: sOpt(r.paquetePacienteId),
    notas: r.notas ?? undefined,
    creadoEn: r.createdAt ?? "",
  };
}

function mapItem(r: any): AtnItem {
  return {
    id: s(r.id),
    tipo: r.tipo,
    nombre: r.nombre,
    monto: n(r.monto),
    servicioId: sOpt(r.servicioId),
    paqueteId: sOpt(r.paqueteId),
  };
}

function mapPago(r: any): Pago {
  return {
    id: s(r.id),
    monto: n(r.monto),
    metodo: r.metodo,
    tipo: r.tipo,
    fecha: r.fecha,
  };
}

export function mapAtencion(r: any): Atencion {
  return {
    id: s(r.id),
    citaId: sOpt(r.citaId),
    pacienteId: s(r.pacienteId),
    psicologoId: s(r.psicologoId),
    fecha: r.fecha,
    hora: r.hora ?? undefined,
    items: (r.items ?? []).map(mapItem),
    pagos: (r.pagos ?? []).map(mapPago),
    observaciones: r.observaciones ?? undefined,
    anulada: !!r.anulada,
    motivoAnulacion: r.motivoAnulacion ?? undefined,
    creadoEn: r.createdAt ?? "",
  };
}

export function mapUsuario(r: any): Usuario {
  return {
    id: s(r.id),
    nombre: r.nombre,
    email: r.email,
    roleId: (r.roleId as RoleId) ?? 3,
    estado: r.estado ?? "Activo",
    creadoEn: r.createdAt ?? "",
  };
}

export function mapConfig(r: any): ConsultorioConfig {
  return {
    nombre: r.nombre ?? "Ser y Crecer",
    ruc: r.ruc ?? undefined,
    direccion: r.direccion ?? undefined,
    telefono: r.telefono ?? undefined,
    email: r.email ?? undefined,
    horario: r.horario ?? undefined,
    moneda: r.moneda ?? "PEN",
  };
}

export function mapEvaluacion(r: any): EvaluacionNeuro {
  return {
    pacienteId: s(r.pacienteId),
    respuestas: r.respuestas ?? {},
    objetivos: r.objetivos ?? [],
    obsConducta: r.obsConducta ?? undefined,
    obsFamilia: r.obsFamilia ?? undefined,
    obsEscolar: r.obsEscolar ?? undefined,
    informe: r.informe ?? undefined,
    actualizadoEn: r.updatedAt ?? r.actualizadoEn ?? "",
  };
}

export function mapEvolucion(r: any): EvolucionSesion {
  return {
    id: s(r.id),
    pacienteId: s(r.pacienteId),
    psicologoId: s(r.psicologoId),
    atencionId: sOpt(r.atencionId),
    fecha: r.fecha,
    hora: r.hora,
    motivo: r.motivo ?? undefined,
    observaciones: r.observaciones ?? "",
    acuerdos: r.acuerdos ?? undefined,
    creadoEn: r.createdAt ?? "",
  };
}

/** Convierte un id string del front a number para la API (o undefined). */
export const toId = (v?: string): number | undefined =>
  v == null || v === "" ? undefined : Number(v);
