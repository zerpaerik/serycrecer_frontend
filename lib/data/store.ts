"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  PACIENTES,
  PSICOLOGOS,
  SERVICIOS,
  seedAtenciones,
  seedCitas,
} from "./seed";
import type {
  Atencion,
  Cita,
  EstadoCita,
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
