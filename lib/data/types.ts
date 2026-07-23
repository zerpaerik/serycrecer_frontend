/**
 * Tipos del dominio del consultorio psicológico "Ser y Crecer".
 * Todo el modelo es simulado en frontend (mock).
 */
import type { RoleId } from "@/lib/auth/roles";

export type TipoDoc = "DNI" | "CE" | "Pasaporte";
export type Sexo = "Femenino" | "Masculino" | "Otro";
export type EstadoPaciente = "Activo" | "Inactivo";

export interface Paciente {
  id: string;
  tipoDoc: TipoDoc;
  numDoc: string;
  nombres: string;
  apellidos: string;
  sexo: Sexo;
  fechaNacimiento: string; // ISO "YYYY-MM-DD"
  telefono: string;
  email?: string;
  direccion?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  motivoConsulta?: string;
  estado: EstadoPaciente;
  creadoEn: string; // ISO datetime
}

export interface Psicologo {
  id: string;
  nombre: string; // p. ej. "Lic. Camila Torres"
  especialidad: string;
  color: string; // hex para agenda/badges
  email?: string;
  telefono?: string;
  horario?: string;
}

export type EstadoUsuario = "Activo" | "Inactivo";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  roleId: RoleId;
  estado: EstadoUsuario;
  creadoEn: string;
}

// ─── Historia clínica neuropsicológica (instrumento por secciones) ───

/** Respuesta Sí/No con observación (patrón de la anamnesis). */
export interface RespuestaBool {
  v: "si" | "no" | null;
  obs?: string;
}
export type RespuestaValor = string | number | RespuestaBool;

export interface ObjetivoTrabajo {
  id: string;
  texto: string;
  estado: string; // "En proceso inicial" | "Muestra mejora" | "Logrado"
}

/** Historia clínica estructurada del paciente (por id de campo del instrumento). */
export interface EvaluacionNeuro {
  pacienteId: string;
  respuestas: Record<string, RespuestaValor>;
  objetivos: ObjetivoTrabajo[];
  obsConducta?: string;
  obsFamilia?: string;
  obsEscolar?: string;
  informe?: string;
  actualizadoEn: string;
}

/** Configuración general del consultorio. */
export interface ConsultorioConfig {
  nombre: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  horario?: string;
  moneda: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  duracionMin: number;
  precio: number; // Soles
  color: string;
}

export type EstadoCita =
  | "Agendada"
  | "Confirmada"
  | "Atendida"
  | "No asistió"
  | "Cancelada";

export interface Cita {
  id: string;
  pacienteId: string;
  psicologoId: string;
  servicioId: string;
  fecha: string; // ISO "YYYY-MM-DD"
  hora: string; // "HH:mm"
  estado: EstadoCita;
  /** El paciente asistió con retraso. */
  tardanza?: boolean;
  /** Si la sesión se descuenta de un paquete del paciente. */
  paquetePacienteId?: string;
  notas?: string;
  creadoEn: string;
}

export type MetodoPago =
  | "Efectivo"
  | "Yape"
  | "Plin"
  | "Tarjeta"
  | "Transferencia";

export const METODOS_PAGO: MetodoPago[] = [
  "Efectivo",
  "Yape",
  "Plin",
  "Tarjeta",
  "Transferencia",
];

/** Estado de pago derivado de una atención. */
export type EstadoPago = "Pagado" | "Parcial" | "Pendiente";

export type TipoItem = "Servicio" | "Paquete";

/** Línea de la atención (servicio o paquete). */
export interface AtnItem {
  id: string;
  tipo: TipoItem;
  nombre: string;
  monto: number;
  servicioId?: string;
  paqueteId?: string;
}

/** Pago (abono inicial o cobro posterior) sobre una atención. */
export interface Pago {
  id: string;
  monto: number;
  metodo: MetodoPago;
  tipo: "Abono inicial" | "Cobro";
  fecha: string; // ISO "YYYY-MM-DD"
}

export interface Atencion {
  id: string;
  citaId?: string;
  pacienteId: string;
  psicologoId: string;
  fecha: string; // ISO "YYYY-MM-DD"
  hora?: string; // "HH:mm"
  items: AtnItem[];
  pagos: Pago[];
  observaciones?: string;
  anulada?: boolean;
  motivoAnulacion?: string;
  creadoEn: string;
}

// ─── Paquetes de sesiones ───

/** Catálogo de paquetes de sesiones. */
export interface Paquete {
  id: string;
  nombre: string;
  sesiones: number;
  precio: number;
  servicioId?: string;
  color: string;
}

/** Paquete adquirido por un paciente (bolsa de sesiones). */
export interface PaquetePaciente {
  id: string;
  pacienteId: string;
  paqueteId: string;
  nombre: string;
  totalSesiones: number;
  precio: number;
  fecha: string; // ISO "YYYY-MM-DD"
  atencionId?: string;
  creadoEn: string;
}

/** Encabezado clínico del paciente (uno por paciente). */
export interface HistoriaClinica {
  pacienteId: string;
  fechaApertura: string; // ISO "YYYY-MM-DD"
  antecedentes?: string;
  diagnostico?: string;
  planTratamiento?: string;
  objetivos?: string;
  actualizadoEn: string;
}

/** Nota de evolución de una sesión dentro de la historia clínica. */
export interface EvolucionSesion {
  id: string;
  pacienteId: string;
  psicologoId: string;
  atencionId?: string;
  fecha: string; // ISO "YYYY-MM-DD"
  hora: string; // "HH:mm"
  motivo?: string;
  observaciones: string;
  acuerdos?: string;
  creadoEn: string;
}
