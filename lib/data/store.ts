"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  PACIENTES,
  PSICOLOGOS,
  SERVICIOS,
  seedAtenciones,
  seedCitas,
  seedEvoluciones,
  seedHistorias,
} from "./seed";
import type {
  Atencion,
  Cita,
  EstadoCita,
  EvolucionSesion,
  HistoriaClinica,
  MetodoPago,
  Paciente,
  Psicologo,
  Servicio,
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
