/**
 * Datos semilla (mock) del consultorio. Las citas y atenciones se generan
 * relativas a "hoy" para que la agenda siempre muestre datos vigentes en la demo.
 */
import type {
  Atencion,
  Cita,
  Paciente,
  Psicologo,
  Servicio,
} from "./types";

const TEAL = "#0d9488";
const SKY = "#0ea5e9";
const VIOLET = "#8b5cf6";
const AMBER = "#f59e0b";
const ROSE = "#f43f5e";

/** Fecha ISO (YYYY-MM-DD) desplazada `offset` días respecto a hoy. */
function isoDate(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const PSICOLOGOS: Psicologo[] = [
  { id: "psi-1", nombre: "Lic. Camila Torres", especialidad: "Psicología clínica", color: VIOLET },
  { id: "psi-2", nombre: "Lic. Mateo Ríos", especialidad: "Terapia de pareja y familia", color: SKY },
  { id: "psi-3", nombre: "Lic. Ana Beltrán", especialidad: "Psicología infantil", color: TEAL },
];

export const SERVICIOS: Servicio[] = [
  { id: "srv-1", nombre: "Terapia individual", duracionMin: 50, precio: 80, color: TEAL },
  { id: "srv-2", nombre: "Evaluación inicial", duracionMin: 60, precio: 120, color: SKY },
  { id: "srv-3", nombre: "Terapia de pareja", duracionMin: 60, precio: 150, color: VIOLET },
  { id: "srv-4", nombre: "Terapia infantil", duracionMin: 45, precio: 90, color: AMBER },
  { id: "srv-5", nombre: "Terapia familiar", duracionMin: 60, precio: 160, color: ROSE },
];

export const PACIENTES: Paciente[] = [
  { id: "pac-1", tipoDoc: "DNI", numDoc: "45872103", nombres: "Lucía", apellidos: "Vega Ramírez", sexo: "Femenino", fechaNacimiento: "1995-03-12", telefono: "987654321", email: "lucia.vega@gmail.com", direccion: "Av. Arequipa 1234, Lince", contactoNombre: "Rosa Ramírez", contactoTelefono: "987111222", motivoConsulta: "Ansiedad y estrés laboral", estado: "Activo", creadoEn: "2026-01-15T10:00:00Z" },
  { id: "pac-2", tipoDoc: "DNI", numDoc: "40125896", nombres: "Diego", apellidos: "Ramos Flores", sexo: "Masculino", fechaNacimiento: "1988-07-25", telefono: "912345678", email: "diego.ramos@outlook.com", direccion: "Calle Los Pinos 456, Surco", contactoNombre: "María Flores", contactoTelefono: "912000333", motivoConsulta: "Manejo de duelo", estado: "Activo", creadoEn: "2026-02-03T14:30:00Z" },
  { id: "pac-3", tipoDoc: "DNI", numDoc: "72564891", nombres: "María", apellidos: "Flores Quispe", sexo: "Femenino", fechaNacimiento: "1992-11-08", telefono: "998877665", email: "maria.flores@gmail.com", direccion: "Jr. Puno 890, Cercado", contactoNombre: "Juan Flores", contactoTelefono: "998000111", motivoConsulta: "Terapia de pareja", estado: "Activo", creadoEn: "2026-02-20T09:15:00Z" },
  { id: "pac-4", tipoDoc: "CE", numDoc: "001234567", nombres: "Jorge", apellidos: "Salas Medina", sexo: "Masculino", fechaNacimiento: "1979-05-30", telefono: "945612378", email: "jorge.salas@gmail.com", direccion: "Av. La Marina 2100, San Miguel", contactoNombre: "Elena Medina", contactoTelefono: "945000222", motivoConsulta: "Depresión", estado: "Activo", creadoEn: "2026-03-01T16:45:00Z" },
  { id: "pac-5", tipoDoc: "DNI", numDoc: "48219075", nombres: "Camila", apellidos: "Rojas Díaz", sexo: "Femenino", fechaNacimiento: "2001-09-17", telefono: "976543210", email: "camila.rojas@gmail.com", direccion: "Calle Bolívar 55, Pueblo Libre", contactoNombre: "Sandra Díaz", contactoTelefono: "976000444", motivoConsulta: "Ataques de pánico", estado: "Activo", creadoEn: "2026-03-18T11:20:00Z" },
  { id: "pac-6", tipoDoc: "DNI", numDoc: "70154238", nombres: "Sebastián", apellidos: "Núñez Paredes", sexo: "Masculino", fechaNacimiento: "2015-04-02", telefono: "933221100", email: "", direccion: "Av. Brasil 780, Magdalena", contactoNombre: "Patricia Paredes (madre)", contactoTelefono: "933000555", motivoConsulta: "Terapia infantil — conducta", estado: "Activo", creadoEn: "2026-04-05T08:30:00Z" },
  { id: "pac-7", tipoDoc: "DNI", numDoc: "41963258", nombres: "Valeria", apellidos: "Chávez Soto", sexo: "Femenino", fechaNacimiento: "1990-12-24", telefono: "965874123", email: "valeria.chavez@gmail.com", direccion: "Jr. Ica 340, Breña", contactoNombre: "Luis Chávez", contactoTelefono: "965000666", motivoConsulta: "Estrés y autoestima", estado: "Activo", creadoEn: "2026-04-22T13:00:00Z" },
  { id: "pac-8", tipoDoc: "Pasaporte", numDoc: "PA1234567", nombres: "Andrés", apellidos: "Gómez León", sexo: "Masculino", fechaNacimiento: "1985-02-14", telefono: "958741236", email: "andres.gomez@gmail.com", direccion: "Av. Javier Prado 3300, San Isidro", contactoNombre: "Carmen León", contactoTelefono: "958000777", motivoConsulta: "Terapia familiar", estado: "Inactivo", creadoEn: "2026-05-10T15:10:00Z" },
  { id: "pac-9", tipoDoc: "DNI", numDoc: "73852149", nombres: "Fernanda", apellidos: "Cárdenas Ruiz", sexo: "Femenino", fechaNacimiento: "1998-08-19", telefono: "941258963", email: "fernanda.cardenas@gmail.com", direccion: "Calle Tacna 120, Jesús María", contactoNombre: "Marta Ruiz", contactoTelefono: "941000888", motivoConsulta: "Ansiedad social", estado: "Activo", creadoEn: "2026-05-28T10:40:00Z" },
  { id: "pac-10", tipoDoc: "DNI", numDoc: "44758963", nombres: "Ricardo", apellidos: "Ponce Vargas", sexo: "Masculino", fechaNacimiento: "1983-06-11", telefono: "929384756", email: "ricardo.ponce@gmail.com", direccion: "Av. Colonial 1450, Callao", contactoNombre: "Ana Vargas", contactoTelefono: "929000999", motivoConsulta: "Estrés postraumático", estado: "Activo", creadoEn: "2026-06-14T09:00:00Z" },
];

/** Genera las citas de la demo alrededor de hoy. */
export function seedCitas(): Cita[] {
  const now = new Date().toISOString();
  const mk = (
    id: string,
    pacienteId: string,
    psicologoId: string,
    servicioId: string,
    fecha: string,
    hora: string,
    estado: Cita["estado"],
  ): Cita => ({ id, pacienteId, psicologoId, servicioId, fecha, hora, estado, creadoEn: now });

  return [
    // Hoy
    mk("cit-1", "pac-1", "psi-1", "srv-1", isoDate(0), "09:00", "Confirmada"),
    mk("cit-2", "pac-2", "psi-1", "srv-2", isoDate(0), "10:30", "Confirmada"),
    mk("cit-3", "pac-3", "psi-2", "srv-3", isoDate(0), "12:00", "Agendada"),
    mk("cit-4", "pac-5", "psi-1", "srv-1", isoDate(0), "16:00", "Agendada"),
    mk("cit-5", "pac-6", "psi-3", "srv-4", isoDate(0), "17:00", "Confirmada"),
    // Mañana
    mk("cit-6", "pac-7", "psi-1", "srv-1", isoDate(1), "09:30", "Agendada"),
    mk("cit-7", "pac-9", "psi-2", "srv-1", isoDate(1), "11:00", "Agendada"),
    mk("cit-8", "pac-4", "psi-1", "srv-1", isoDate(1), "15:00", "Confirmada"),
    // Pasado (para historial)
    mk("cit-9", "pac-1", "psi-1", "srv-1", isoDate(-7), "09:00", "Atendida"),
    mk("cit-10", "pac-2", "psi-1", "srv-1", isoDate(-5), "10:30", "Atendida"),
    mk("cit-11", "pac-4", "psi-1", "srv-1", isoDate(-3), "15:00", "No asistió"),
    mk("cit-12", "pac-10", "psi-2", "srv-5", isoDate(-2), "12:00", "Atendida"),
  ];
}

/** Atenciones ya registradas (a partir de citas pasadas atendidas). */
export function seedAtenciones(): Atencion[] {
  const now = new Date().toISOString();
  return [
    { id: "atn-1", citaId: "cit-9", pacienteId: "pac-1", psicologoId: "psi-1", servicioId: "srv-1", fecha: isoDate(-7), hora: "09:00", notas: "Sesión de seguimiento. Buena evolución.", monto: 80, estadoPago: "Pagado", creadoEn: now },
    { id: "atn-2", citaId: "cit-10", pacienteId: "pac-2", psicologoId: "psi-1", servicioId: "srv-1", fecha: isoDate(-5), hora: "10:30", notas: "Trabajo en manejo de duelo.", monto: 80, estadoPago: "Pagado", creadoEn: now },
    { id: "atn-3", citaId: "cit-12", pacienteId: "pac-10", psicologoId: "psi-2", servicioId: "srv-5", fecha: isoDate(-2), hora: "12:00", notas: "Primera sesión familiar.", monto: 160, estadoPago: "Pendiente", creadoEn: now },
  ];
}
