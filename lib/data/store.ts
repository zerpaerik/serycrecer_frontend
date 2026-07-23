"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CONFIG_DEFAULT,
  PACIENTES,
  PAQUETES,
  PSICOLOGOS,
  SERVICIOS,
  USUARIOS,
  seedAtenciones,
  seedCitas,
  seedEvoluciones,
  seedHistorias,
  seedPaquetesPaciente,
} from "./seed";
import type {
  Atencion,
  Cita,
  ConsultorioConfig,
  EstadoCita,
  EvaluacionNeuro,
  EvolucionSesion,
  HistoriaClinica,
  ObjetivoTrabajo,
  Paciente,
  Pago,
  Paquete,
  PaquetePaciente,
  Psicologo,
  RespuestaValor,
  Servicio,
  Usuario,
} from "./types";

/** ID corto único para nuevos registros. */
function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

/** Crea o actualiza la evaluación de un paciente aplicando `fn`. */
function upsertEval(
  lista: EvaluacionNeuro[],
  pacienteId: string,
  fn: (ev: EvaluacionNeuro) => EvaluacionNeuro,
): EvaluacionNeuro[] {
  const now = new Date().toISOString();
  const existe = lista.find((e) => e.pacienteId === pacienteId);
  const base: EvaluacionNeuro =
    existe ?? { pacienteId, respuestas: {}, objetivos: [], actualizadoEn: now };
  const actualizado = { ...fn(base), actualizadoEn: now };
  return existe
    ? lista.map((e) => (e.pacienteId === pacienteId ? actualizado : e))
    : [...lista, actualizado];
}

interface DbState {
  hydrated: boolean;
  pacientes: Paciente[];
  psicologos: Psicologo[];
  servicios: Servicio[];
  citas: Cita[];
  atenciones: Atencion[];
  paquetes: Paquete[];
  paquetesPaciente: PaquetePaciente[];
  historias: HistoriaClinica[];
  evoluciones: EvolucionSesion[];
  evaluaciones: EvaluacionNeuro[];
  usuarios: Usuario[];
  config: ConsultorioConfig;

  // Pacientes
  addPaciente: (data: Omit<Paciente, "id" | "creadoEn">) => Paciente;
  updatePaciente: (id: string, data: Partial<Paciente>) => void;
  deletePaciente: (id: string) => void;

  // Citas
  addCita: (data: Omit<Cita, "id" | "creadoEn">) => Cita;
  updateCita: (id: string, data: Partial<Cita>) => void;
  setEstadoCita: (id: string, estado: EstadoCita) => void;
  deleteCita: (id: string) => void;

  // Atenciones
  addAtencion: (data: Omit<Atencion, "id" | "creadoEn">) => Atencion;
  updateAtencion: (id: string, data: Partial<Atencion>) => void;
  /** Agrega un pago (abono) a una atención. */
  agregarPago: (atencionId: string, pago: Omit<Pago, "id">) => void;
  /** Anula una atención (soft-delete con motivo). */
  anularAtencion: (id: string, motivo: string) => void;

  // Paquetes
  addPaquete: (data: Omit<Paquete, "id">) => Paquete;
  updatePaquete: (id: string, data: Partial<Paquete>) => void;
  deletePaquete: (id: string) => void;
  addPaquetePaciente: (data: Omit<PaquetePaciente, "id" | "creadoEn">) => PaquetePaciente;

  // Historia clínica
  upsertHistoria: (
    pacienteId: string,
    data: Partial<Omit<HistoriaClinica, "pacienteId">>,
  ) => void;
  addEvolucion: (data: Omit<EvolucionSesion, "id" | "creadoEn">) => EvolucionSesion;
  updateEvolucion: (id: string, data: Partial<EvolucionSesion>) => void;
  deleteEvolucion: (id: string) => void;

  // Evaluación neuropsicológica (historia estructurada)
  setRespuesta: (pacienteId: string, fieldId: string, valor: RespuestaValor) => void;
  setEvalCampo: (
    pacienteId: string,
    campo: "obsConducta" | "obsFamilia" | "obsEscolar" | "informe",
    valor: string,
  ) => void;
  addObjetivo: (pacienteId: string, texto: string) => void;
  updateObjetivo: (pacienteId: string, objetivoId: string, data: Partial<ObjetivoTrabajo>) => void;
  deleteObjetivo: (pacienteId: string, objetivoId: string) => void;

  // Administración
  addUsuario: (data: Omit<Usuario, "id" | "creadoEn">) => Usuario;
  updateUsuario: (id: string, data: Partial<Usuario>) => void;
  deleteUsuario: (id: string) => void;

  addPsicologo: (data: Omit<Psicologo, "id">) => Psicologo;
  updatePsicologo: (id: string, data: Partial<Psicologo>) => void;
  deletePsicologo: (id: string) => void;

  addServicio: (data: Omit<Servicio, "id">) => Servicio;
  updateServicio: (id: string, data: Partial<Servicio>) => void;
  deleteServicio: (id: string) => void;

  updateConfig: (data: Partial<ConsultorioConfig>) => void;

  setHydrated: () => void;
}

export const useDb = create<DbState>()(
  persist(
    (set) => ({
      hydrated: false,
      pacientes: PACIENTES,
      psicologos: PSICOLOGOS,
      servicios: SERVICIOS,
      citas: seedCitas(),
      atenciones: seedAtenciones(),
      paquetes: PAQUETES,
      paquetesPaciente: seedPaquetesPaciente(),
      historias: seedHistorias(),
      evoluciones: seedEvoluciones(),
      evaluaciones: [],
      usuarios: USUARIOS,
      config: CONFIG_DEFAULT,

      addPaciente: (data) => {
        const paciente: Paciente = {
          ...data,
          id: newId("pac"),
          creadoEn: new Date().toISOString(),
        };
        set((s) => ({ pacientes: [paciente, ...s.pacientes] }));
        return paciente;
      },
      updatePaciente: (id, data) =>
        set((s) => ({
          pacientes: s.pacientes.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePaciente: (id) =>
        set((s) => ({ pacientes: s.pacientes.filter((p) => p.id !== id) })),

      addCita: (data) => {
        const cita: Cita = {
          ...data,
          id: newId("cit"),
          creadoEn: new Date().toISOString(),
        };
        set((s) => ({ citas: [...s.citas, cita] }));
        return cita;
      },
      updateCita: (id, data) =>
        set((s) => ({
          citas: s.citas.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      setEstadoCita: (id, estado) =>
        set((s) => ({
          citas: s.citas.map((c) => (c.id === id ? { ...c, estado } : c)),
        })),
      deleteCita: (id) =>
        set((s) => ({ citas: s.citas.filter((c) => c.id !== id) })),

      addAtencion: (data) => {
        const atencion: Atencion = {
          ...data,
          id: newId("atn"),
          creadoEn: new Date().toISOString(),
        };
        set((s) => ({ atenciones: [atencion, ...s.atenciones] }));
        return atencion;
      },
      updateAtencion: (id, data) =>
        set((s) => ({
          atenciones: s.atenciones.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
      agregarPago: (atencionId, pago) =>
        set((s) => ({
          atenciones: s.atenciones.map((a) =>
            a.id === atencionId
              ? { ...a, pagos: [...a.pagos, { ...pago, id: newId("pg") }] }
              : a,
          ),
        })),
      anularAtencion: (id, motivo) =>
        set((s) => ({
          atenciones: s.atenciones.map((a) =>
            a.id === id ? { ...a, anulada: true, motivoAnulacion: motivo } : a,
          ),
        })),

      addPaquete: (data) => {
        const paquete: Paquete = { ...data, id: newId("paq") };
        set((s) => ({ paquetes: [...s.paquetes, paquete] }));
        return paquete;
      },
      updatePaquete: (id, data) =>
        set((s) => ({
          paquetes: s.paquetes.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePaquete: (id) =>
        set((s) => ({ paquetes: s.paquetes.filter((p) => p.id !== id) })),
      addPaquetePaciente: (data) => {
        const pp: PaquetePaciente = {
          ...data,
          id: newId("pp"),
          creadoEn: new Date().toISOString(),
        };
        set((s) => ({ paquetesPaciente: [pp, ...s.paquetesPaciente] }));
        return pp;
      },

      upsertHistoria: (pacienteId, data) =>
        set((s) => {
          const now = new Date().toISOString();
          const existe = s.historias.find((h) => h.pacienteId === pacienteId);
          if (existe) {
            return {
              historias: s.historias.map((h) =>
                h.pacienteId === pacienteId ? { ...h, ...data, actualizadoEn: now } : h,
              ),
            };
          }
          const nueva: HistoriaClinica = {
            pacienteId,
            fechaApertura: now.slice(0, 10),
            actualizadoEn: now,
            ...data,
          };
          return { historias: [...s.historias, nueva] };
        }),
      addEvolucion: (data) => {
        const evolucion: EvolucionSesion = {
          ...data,
          id: newId("evo"),
          creadoEn: new Date().toISOString(),
        };
        set((s) => ({ evoluciones: [evolucion, ...s.evoluciones] }));
        return evolucion;
      },
      updateEvolucion: (id, data) =>
        set((s) => ({
          evoluciones: s.evoluciones.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      deleteEvolucion: (id) =>
        set((s) => ({ evoluciones: s.evoluciones.filter((e) => e.id !== id) })),

      setRespuesta: (pacienteId, fieldId, valor) =>
        set((s) => ({
          evaluaciones: upsertEval(s.evaluaciones, pacienteId, (ev) => ({
            ...ev,
            respuestas: { ...ev.respuestas, [fieldId]: valor },
          })),
        })),
      setEvalCampo: (pacienteId, campo, valor) =>
        set((s) => ({
          evaluaciones: upsertEval(s.evaluaciones, pacienteId, (ev) => ({
            ...ev,
            [campo]: valor,
          })),
        })),
      addObjetivo: (pacienteId, texto) =>
        set((s) => ({
          evaluaciones: upsertEval(s.evaluaciones, pacienteId, (ev) => ({
            ...ev,
            objetivos: [
              ...ev.objetivos,
              { id: newId("obj"), texto, estado: "En proceso inicial" },
            ],
          })),
        })),
      updateObjetivo: (pacienteId, objetivoId, data) =>
        set((s) => ({
          evaluaciones: upsertEval(s.evaluaciones, pacienteId, (ev) => ({
            ...ev,
            objetivos: ev.objetivos.map((o) => (o.id === objetivoId ? { ...o, ...data } : o)),
          })),
        })),
      deleteObjetivo: (pacienteId, objetivoId) =>
        set((s) => ({
          evaluaciones: upsertEval(s.evaluaciones, pacienteId, (ev) => ({
            ...ev,
            objetivos: ev.objetivos.filter((o) => o.id !== objetivoId),
          })),
        })),

      addUsuario: (data) => {
        const usuario: Usuario = {
          ...data,
          id: newId("usr"),
          creadoEn: new Date().toISOString(),
        };
        set((s) => ({ usuarios: [usuario, ...s.usuarios] }));
        return usuario;
      },
      updateUsuario: (id, data) =>
        set((s) => ({
          usuarios: s.usuarios.map((u) => (u.id === id ? { ...u, ...data } : u)),
        })),
      deleteUsuario: (id) =>
        set((s) => ({ usuarios: s.usuarios.filter((u) => u.id !== id) })),

      addPsicologo: (data) => {
        const psicologo: Psicologo = { ...data, id: newId("psi") };
        set((s) => ({ psicologos: [...s.psicologos, psicologo] }));
        return psicologo;
      },
      updatePsicologo: (id, data) =>
        set((s) => ({
          psicologos: s.psicologos.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePsicologo: (id) =>
        set((s) => ({ psicologos: s.psicologos.filter((p) => p.id !== id) })),

      addServicio: (data) => {
        const servicio: Servicio = { ...data, id: newId("srv") };
        set((s) => ({ servicios: [...s.servicios, servicio] }));
        return servicio;
      },
      updateServicio: (id, data) =>
        set((s) => ({
          servicios: s.servicios.map((x) => (x.id === id ? { ...x, ...data } : x)),
        })),
      deleteServicio: (id) =>
        set((s) => ({ servicios: s.servicios.filter((x) => x.id !== id) })),

      updateConfig: (data) => set((s) => ({ config: { ...s.config, ...data } })),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "serycrecer-db",
      // Los catálogos (psicólogos/servicios) se mantienen desde el seed;
      // persistimos solo lo que el usuario puede modificar en la demo.
      version: 2,
      // Datos anteriores usaban el modelo simple de atención (monto/estadoPago).
      // Al detectarlos, se re-siembran las atenciones al nuevo modelo (ítems+pagos)
      // y se agregan los paquetes; el resto de datos se conserva.
      migrate: (persisted) => {
        const st = { ...(persisted as Partial<DbState>) };
        const atns = st.atenciones;
        if (!Array.isArray(atns) || atns.some((a) => !Array.isArray(a?.items))) {
          st.atenciones = seedAtenciones();
        }
        if (!Array.isArray(st.paquetes)) st.paquetes = PAQUETES;
        if (!Array.isArray(st.paquetesPaciente)) st.paquetesPaciente = seedPaquetesPaciente();
        return st as DbState;
      },
      partialize: (s) => ({
        pacientes: s.pacientes,
        citas: s.citas,
        atenciones: s.atenciones,
        paquetes: s.paquetes,
        paquetesPaciente: s.paquetesPaciente,
        historias: s.historias,
        evoluciones: s.evoluciones,
        evaluaciones: s.evaluaciones,
        usuarios: s.usuarios,
        psicologos: s.psicologos,
        servicios: s.servicios,
        config: s.config,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

// ---- Selectores / helpers (fuera de React) ----

export function pacienteNombre(p?: Paciente): string {
  return p ? `${p.nombres} ${p.apellidos}`.trim() : "—";
}
