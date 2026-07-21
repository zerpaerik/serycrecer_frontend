/**
 * Tipos del dominio del consultorio psicológico "Ser y Crecer".
 * Todo el modelo es simulado en frontend (mock).
 */

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
  notas?: string;
  creadoEn: string;
}

export type EstadoPago = "Pagado" | "Pendiente";

export interface Atencion {
  id: string;
  citaId?: string;
  pacienteId: string;
  psicologoId: string;
  servicioId: string;
  fecha: string; // ISO "YYYY-MM-DD"
  hora: string; // "HH:mm"
  notas?: string;
  monto: number;
  estadoPago: EstadoPago;
  creadoEn: string;
}
