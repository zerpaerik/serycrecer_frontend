"use client";

import * as React from "react";
import {
  CalendarCheck2,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Percent,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { formatPercent } from "@/lib/format";
import type { Cita } from "@/lib/data/types";

const WEEKDAY = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}
function shiftIso(iso: string, days: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function tituloFecha(iso: string) {
  const s = WEEKDAY.format(new Date(iso + "T12:00:00"));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Estado de asistencia derivado de la cita. */
function asistenciaDe(c: Cita): "Asistió" | "Tardanza" | "Falta" | "Pendiente" | "Cancelada" {
  if (c.estado === "Cancelada") return "Cancelada";
  if (c.estado === "Atendida") return c.tardanza ? "Tardanza" : "Asistió";
  if (c.estado === "No asistió") return "Falta";
  return "Pendiente";
}

const BADGE: Record<string, string> = {
  Asistió: "bg-success/12 text-success",
  Tardanza: "bg-warning/15 text-warning",
  Falta: "bg-destructive/12 text-destructive",
  Pendiente: "bg-muted text-muted-foreground",
  Cancelada: "bg-muted text-muted-foreground line-through",
};

export default function AsistenciaPage() {
  const ready = useDbReady();
  const citas = useDb((s) => s.citas);
  const pacientes = useDb((s) => s.pacientes);
  const updateCita = useDb((s) => s.updateCita);

  const [fecha, setFecha] = React.useState(hoyIso());

  const delDia = React.useMemo(
    () => citas.filter((c) => c.fecha === fecha).sort((a, b) => a.hora.localeCompare(b.hora)),
    [citas, fecha],
  );

  // KPIs globales sobre citas ya transcurridas (hasta hoy).
  const stats = React.useMemo(() => {
    const hoy = hoyIso();
    const pasadas = citas.filter((c) => c.fecha <= hoy && c.estado !== "Cancelada");
    const atendidas = pasadas.filter((c) => c.estado === "Atendida").length;
    const faltas = pasadas.filter((c) => c.estado === "No asistió").length;
    const tardanzas = pasadas.filter((c) => c.estado === "Atendida" && c.tardanza).length;
    const base = atendidas + faltas;
    return { atendidas, faltas, tardanzas, tasa: base ? (atendidas / base) * 100 : 0 };
  }, [citas]);

  // Inasistencias por paciente.
  const inasistencias = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const c of citas) {
      if (c.estado === "No asistió") map.set(c.pacienteId, (map.get(c.pacienteId) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([pacienteId, n]) => ({
        pacienteId,
        n,
        nombre: pacienteNombre(pacientes.find((p) => p.id === pacienteId)),
      }))
      .sort((a, b) => b.n - a.n);
  }, [citas, pacientes]);

  function marcar(c: Cita, tipo: "Asistió" | "Tardanza" | "Falta") {
    if (tipo === "Asistió") updateCita(c.id, { estado: "Atendida", tardanza: false });
    else if (tipo === "Tardanza") updateCita(c.id, { estado: "Atendida", tardanza: true });
    else updateCita(c.id, { estado: "No asistió", tardanza: false });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Asistencia" description="Control de asistencia a las sesiones" />

      {!ready ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard kpi={{ label: "Tasa de asistencia", value: formatPercent(stats.tasa, 0), icon: Percent, color: "#0d9488" }} />
            <KpiCard kpi={{ label: "Sesiones atendidas", value: String(stats.atendidas), icon: CalendarCheck2, color: "#0ea5e9" }} />
            <KpiCard kpi={{ label: "Tardanzas", value: String(stats.tardanzas), icon: Clock, color: "#f59e0b" }} />
            <KpiCard kpi={{ label: "Inasistencias", value: String(stats.faltas), icon: CalendarX2, color: "#f43f5e" }} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Control del día */}
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between rounded-xl border bg-card p-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setFecha((f) => shiftIso(f, -1))} aria-label="Día anterior">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setFecha((f) => shiftIso(f, 1))} aria-label="Día siguiente">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="pl-1 font-heading text-sm font-semibold">{tituloFecha(fecha)}</span>
                </div>
                {fecha !== hoyIso() && (
                  <Button variant="ghost" size="sm" onClick={() => setFecha(hoyIso())}>
                    Hoy
                  </Button>
                )}
              </div>

              {delDia.length === 0 ? (
                <Card>
                  <EmptyState icon={CalendarCheck2} title="Sin citas este día" description="No hay sesiones para controlar en la fecha seleccionada." />
                </Card>
              ) : (
                <div className="space-y-2">
                  {delDia.map((c) => {
                    const estado = asistenciaDe(c);
                    const paciente = pacientes.find((p) => p.id === c.pacienteId);
                    const cancelada = c.estado === "Cancelada";
                    return (
                      <Card key={c.id} className="flex flex-row items-center gap-3 p-3">
                        <div className="w-12 shrink-0 text-center text-sm font-bold tabular-nums">
                          {c.hora}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{pacienteNombre(paciente)}</p>
                          <span className={cn("mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium", BADGE[estado])}>
                            {estado}
                          </span>
                        </div>
                        {!cancelada && (
                          <div className="flex shrink-0 gap-1">
                            <Button
                              size="sm"
                              variant={estado === "Asistió" ? "default" : "outline"}
                              className={cn("h-8", estado === "Asistió" && "bg-success text-white hover:bg-success/90")}
                              onClick={() => marcar(c, "Asistió")}
                            >
                              Asistió
                            </Button>
                            <Button
                              size="sm"
                              variant={estado === "Tardanza" ? "default" : "outline"}
                              className={cn("h-8", estado === "Tardanza" && "bg-warning text-white hover:bg-warning/90")}
                              onClick={() => marcar(c, "Tardanza")}
                            >
                              Tardanza
                            </Button>
                            <Button
                              size="sm"
                              variant={estado === "Falta" ? "default" : "outline"}
                              className={cn("h-8", estado === "Falta" && "bg-destructive text-white hover:bg-destructive/90")}
                              onClick={() => marcar(c, "Falta")}
                            >
                              Falta
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inasistencias por paciente */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Inasistencias por paciente</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {inasistencias.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Sin inasistencias registradas.
                  </p>
                ) : (
                  <div className="divide-y">
                    {inasistencias.map((i) => (
                      <div key={i.pacienteId} className="flex items-center justify-between px-6 py-2.5">
                        <span className="truncate text-sm">{i.nombre}</span>
                        <span className="ml-2 shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          {i.n} falta{i.n === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
