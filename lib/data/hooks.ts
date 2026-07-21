"use client";

import { useDb } from "./store";
import type { Paciente, Psicologo, Servicio } from "./types";

/** ¿El store ya rehidrató desde localStorage? Evita parpadeos/mismatch. */
export function useDbReady(): boolean {
  return useDb((s) => s.hydrated);
}

export function usePaciente(id?: string): Paciente | undefined {
  return useDb((s) => s.pacientes.find((p) => p.id === id));
}

export function usePsicologo(id?: string): Psicologo | undefined {
  return useDb((s) => s.psicologos.find((p) => p.id === id));
}

export function useServicio(id?: string): Servicio | undefined {
  return useDb((s) => s.servicios.find((x) => x.id === id));
}

/** Nombre del psicólogo por id (o "—"). */
export function nombrePsicologo(psicologos: Psicologo[], id: string): string {
  return psicologos.find((p) => p.id === id)?.nombre ?? "—";
}

/** Nombre del servicio por id (o "—"). */
export function nombreServicio(servicios: Servicio[], id: string): string {
  return servicios.find((s) => s.id === id)?.nombre ?? "—";
}
