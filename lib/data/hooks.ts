"use client";

import * as React from "react";
import { useDb } from "./store";
import type {
  EvaluacionNeuro,
  EvolucionSesion,
  Paciente,
  Psicologo,
  Servicio,
} from "./types";

/** ¿El store ya cargó los datos desde la API? */
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

export function useEvaluacion(pacienteId?: string): EvaluacionNeuro | undefined {
  return useDb((s) => s.evaluaciones.find((e) => e.pacienteId === pacienteId));
}

export function useEvoluciones(pacienteId?: string): EvolucionSesion[] {
  // Seleccionamos el array estable y derivamos con useMemo: crear un array
  // nuevo dentro del selector rompería la caché de useSyncExternalStore.
  const evoluciones = useDb((s) => s.evoluciones);
  return React.useMemo(
    () =>
      evoluciones
        .filter((e) => e.pacienteId === pacienteId)
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [evoluciones, pacienteId],
  );
}

/** Nombre del psicólogo por id (o "—"). */
export function nombrePsicologo(psicologos: Psicologo[], id: string): string {
  return psicologos.find((p) => p.id === id)?.nombre ?? "—";
}

/** Nombre del servicio por id (o "—"). */
export function nombreServicio(servicios: Servicio[], id: string): string {
  return servicios.find((s) => s.id === id)?.nombre ?? "—";
}
