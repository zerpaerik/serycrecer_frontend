"use client";

import * as React from "react";
import { toast } from "sonner";
import { CalendarClock, CalendarPlus, Plus, Trash2 } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { CitaFormDialog } from "@/components/citas/cita-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDb } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { DIAS, diaSemanaDe, slotsDisponibles } from "@/lib/data/agenda";

function hoyIso() {
  return new Date().toLocaleDateString("en-CA");
}

function DisponibilidadInner() {
  const ready = useDbReady();
  const psicologos = useDb((s) => s.psicologos);
  const disponibilidad = useDb((s) => s.disponibilidad);
  const citas = useDb((s) => s.citas);
  const addDisponibilidad = useDb((s) => s.addDisponibilidad);
  const deleteDisponibilidad = useDb((s) => s.deleteDisponibilidad);

  const [psicologoSel, setPsicologoSel] = React.useState("");
  const [fecha, setFecha] = React.useState(hoyIso());
  const [franja, setFranja] = React.useState({ diaSemana: "1", horaInicio: "09:00", horaFin: "13:00", duracionMin: "60" });
  const [agendar, setAgendar] = React.useState<{ hora: string } | null>(null);

  // Psicólogo efectivo: el elegido o, por defecto, el primero (sin useEffect).
  const psicologoId = psicologoSel || psicologos[0]?.id || "";

  const franjas = React.useMemo(
    () =>
      disponibilidad
        .filter((d) => d.psicologoId === psicologoId)
        .sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio)),
    [disponibilidad, psicologoId],
  );

  const slots = React.useMemo(
    () => (psicologoId ? slotsDisponibles(disponibilidad, citas, psicologoId, fecha) : []),
    [disponibilidad, citas, psicologoId, fecha],
  );

  async function agregarFranja() {
    if (!psicologoId) return;
    if (franja.horaFin <= franja.horaInicio) return toast.error("La hora fin debe ser mayor a la de inicio");
    try {
      await addDisponibilidad({
        psicologoId,
        diaSemana: Number(franja.diaSemana),
        horaInicio: franja.horaInicio,
        horaFin: franja.horaFin,
        duracionMin: Number(franja.duracionMin) || 60,
      });
      toast.success("Franja agregada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo agregar");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Disponibilidad" description="Horarios de atención de los psicólogos y citas disponibles" />

      {!ready ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <>
          <div className="rounded-xl border bg-card p-3">
            <Label className="mb-1.5 block text-xs">Psicólogo</Label>
            <Select value={psicologoId} onValueChange={setPsicologoSel}>
              <SelectTrigger className="w-full sm:w-80"><SelectValue placeholder="Selecciona un psicólogo" /></SelectTrigger>
              <SelectContent>
                {psicologos.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Horario semanal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-4 w-4 text-brand" />
                  Horario semanal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {franjas.length === 0 ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">Sin franjas configuradas.</p>
                ) : (
                  <div className="space-y-1.5">
                    {franjas.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                        <span className="w-24 shrink-0 font-medium">{DIAS[f.diaSemana]}</span>
                        <span className="flex-1 text-muted-foreground">{f.horaInicio}–{f.horaFin} · {f.duracionMin} min</span>
                        <button
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteDisponibilidad(f.id)}
                          aria-label="Quitar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agregar franja */}
                <div className="rounded-lg border border-dashed p-3">
                  <p className="mb-2 text-xs font-medium">Agregar franja</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="mb-1 block text-xs">Día</Label>
                      <Select value={franja.diaSemana} onValueChange={(v) => setFranja({ ...franja, diaSemana: v })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIAS.map((d, i) => (<SelectItem key={i} value={String(i)}>{d}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Duración (min)</Label>
                      <Input type="number" min={15} step={15} value={franja.duracionMin} onChange={(e) => setFranja({ ...franja, duracionMin: e.target.value })} />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Desde</Label>
                      <Input type="time" step={300} value={franja.horaInicio} onChange={(e) => setFranja({ ...franja, horaInicio: e.target.value })} />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Hasta</Label>
                      <Input type="time" step={300} value={franja.horaFin} onChange={(e) => setFranja({ ...franja, horaFin: e.target.value })} />
                    </div>
                  </div>
                  <Button className="mt-3 w-full bg-brand-gradient text-white" onClick={agregarFranja} disabled={!psicologoId}>
                    <Plus className="h-4 w-4" />Agregar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Citas disponibles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Citas disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs">Fecha</Label>
                  <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-48" />
                  <p className="mt-1 text-xs text-muted-foreground">{DIAS[diaSemanaDe(fecha)]}</p>
                </div>
                {slots.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No hay horarios libres este día (sin disponibilidad o todo ocupado).
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((hora) => (
                      <button
                        key={hora}
                        onClick={() => setAgendar({ hora })}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        {hora}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <CitaFormDialog
        key={agendar?.hora ?? "none"}
        open={!!agendar}
        onOpenChange={(o) => !o && setAgendar(null)}
        fechaInicial={fecha}
        psicologoInicial={psicologoId}
        horaInicial={agendar?.hora}
      />
    </div>
  );
}

export default function DisponibilidadPage() {
  return (
    <RoleGuard roles={[1, 3]}>
      <DisponibilidadInner />
    </RoleGuard>
  );
}
