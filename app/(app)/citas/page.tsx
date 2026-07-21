"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserX,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EstadoCitaBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CitaFormDialog } from "@/components/citas/cita-form-dialog";
import { AtencionFormDialog } from "@/components/atenciones/atencion-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import type { Cita, EstadoCita } from "@/lib/data/types";

const WEEKDAY = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
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
  const d = new Date(iso + "T12:00:00");
  const s = WEEKDAY.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function CitasPage() {
  const router = useRouter();
  const ready = useDbReady();
  const citas = useDb((s) => s.citas);
  const pacientes = useDb((s) => s.pacientes);
  const psicologos = useDb((s) => s.psicologos);
  const servicios = useDb((s) => s.servicios);
  const setEstadoCita = useDb((s) => s.setEstadoCita);
  const deleteCita = useDb((s) => s.deleteCita);

  const [fecha, setFecha] = React.useState(hoyIso());
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Cita | undefined>();
  const [atencionCita, setAtencionCita] = React.useState<Cita | undefined>();
  const [toDelete, setToDelete] = React.useState<Cita | undefined>();

  const delDia = React.useMemo(
    () =>
      citas
        .filter((c) => c.fecha === fecha)
        .sort((a, b) => a.hora.localeCompare(b.hora)),
    [citas, fecha],
  );

  function cambiarEstado(c: Cita, estado: EstadoCita) {
    setEstadoCita(c.id, estado);
    toast.success(`Cita marcada como "${estado}"`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Agenda de citas" description="Gestiona las citas del consultorio">
        <Button
          className="bg-brand-gradient text-white"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <CalendarPlus className="h-4 w-4" />
          Nueva cita
        </Button>
      </PageHeader>

      {/* Navegación por día */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setFecha((f) => shiftIso(f, -1))}
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setFecha((f) => shiftIso(f, 1))}
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 pl-1">
            <CalendarDays className="h-4 w-4 text-brand" />
            <span className="font-heading text-sm font-semibold sm:text-base">
              {tituloFecha(fecha)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {delDia.length} cita{delDia.length === 1 ? "" : "s"}
          </span>
          {fecha !== hoyIso() && (
            <Button variant="ghost" size="sm" onClick={() => setFecha(hoyIso())}>
              Hoy
            </Button>
          )}
        </div>
      </div>

      {/* Lista de citas */}
      {!ready ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : delDia.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Sin citas este día"
            description="No hay citas agendadas para la fecha seleccionada."
          >
            <Button
              variant="outline"
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <CalendarPlus className="h-4 w-4" />
              Agendar cita
            </Button>
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-2">
          {delDia.map((c) => {
            const paciente = pacientes.find((p) => p.id === c.pacienteId);
            const psi = psicologos.find((p) => p.id === c.psicologoId);
            const srv = servicios.find((s) => s.id === c.servicioId);
            const cerrada = c.estado === "Atendida" || c.estado === "Cancelada";
            return (
              <Card
                key={c.id}
                className="flex flex-row items-center gap-4 overflow-hidden p-0"
              >
                <div
                  className="flex h-full w-1.5 shrink-0 self-stretch"
                  style={{ backgroundColor: psi?.color ?? "var(--brand)" }}
                />
                <div className="w-16 shrink-0 py-4 text-center">
                  <p className="font-heading text-base font-bold tabular-nums">{c.hora}</p>
                </div>
                <button
                  className="min-w-0 flex-1 py-4 text-left"
                  onClick={() => paciente && router.push(`/pacientes/${paciente.id}`)}
                >
                  <p className="truncate font-medium">{pacienteNombre(paciente)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {srv?.nombre ?? "—"} · {psi?.nombre ?? "—"}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-2 pr-4">
                  <EstadoCitaBadge estado={c.estado} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {c.estado === "Agendada" && (
                        <DropdownMenuItem onClick={() => cambiarEstado(c, "Confirmada")}>
                          <Check className="h-4 w-4" />
                          Confirmar
                        </DropdownMenuItem>
                      )}
                      {!cerrada && (
                        <DropdownMenuItem onClick={() => setAtencionCita(c)}>
                          <ClipboardPlus className="h-4 w-4" />
                          Registrar atención
                        </DropdownMenuItem>
                      )}
                      {!cerrada && (
                        <DropdownMenuItem onClick={() => cambiarEstado(c, "No asistió")}>
                          <UserX className="h-4 w-4" />
                          No asistió
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(c);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {!cerrada && (
                        <DropdownMenuItem onClick={() => cambiarEstado(c, "Cancelada")}>
                          <XCircle className="h-4 w-4" />
                          Cancelar cita
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setToDelete(c)}>
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CitaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cita={editing}
        fechaInicial={fecha}
      />

      <AtencionFormDialog
        open={!!atencionCita}
        onOpenChange={(o) => !o && setAtencionCita(undefined)}
        cita={atencionCita}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Eliminar cita"
        description="¿Eliminar esta cita? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) {
            deleteCita(toDelete.id);
            toast.success("Cita eliminada");
            setToDelete(undefined);
          }
        }}
      />
    </div>
  );
}
