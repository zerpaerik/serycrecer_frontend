"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CONFIG_DEFAULT,
  PACIENTES,
  PSICOLOGOS,
  SERVICIOS,
  USUARIOS,
  seedAtenciones,
  seedCitas,
  seedEvoluciones,
  seedHistorias,
} from "./seed";
import type {
  Atencion,
  Cita,
  ConsultorioConfig,
  EstadoCita,
  EvolucionSesion,
  HistoriaClinica,
  MetodoPago,
  Paciente,
  Psicologo,
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

interface DbState {
  hydrated: boolean;
  pacientes: Paciente[];
  psicologos: Psicologo[];
  servicios: Servicio[];
  citas: Cita[];
  atenciones: Atencion[];
  historias: HistoriaClinica[];
  evoluciones: EvolucionSesion[];
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
  /** Registra el cobro de una atención (método local) y la marca pagada. */
  registrarCobro: (id: string, metodo: MetodoPago) => void;

  // Historia clínica
  upsertHistoria: (
    pacienteId: string,
    data: Partial<Omit<HistoriaClinica, "pacienteId">>,
  ) => void;
  addEvolucion: (data: Omit<EvolucionSesion, "id" | "creadoEn">) => EvolucionSesion;
  updateEvolucion: (id: string, data: Partial<EvolucionSesion>) => void;
  deleteEvolucion: (id: string) => void;

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
      historias: seedHistorias(),
      evoluciones: seedEvoluciones(),
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
      registrarCobro: (id, metodo) =>
        set((s) => ({
          atenciones: s.atenciones.map((a) =>
            a.id === id ? { ...a, estadoPago: "Pagado", metodoPago: metodo } : a,
          ),
        })),

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
      partialize: (s) => ({
        pacientes: s.pacientes,
        citas: s.citas,
        atenciones: s.atenciones,
        historias: s.historias,
        evoluciones: s.evoluciones,
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
