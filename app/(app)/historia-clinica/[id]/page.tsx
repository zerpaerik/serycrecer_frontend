"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, MoreHorizontal, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EvolucionDialog } from "@/components/historia/evolucion-dialog";
import { SeccionForm, PlanTrabajo } from "@/components/historia/seccion-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDb } from "@/lib/data/store";
import { useDbReady, useEvaluacion, useEvoluciones } from "@/lib/data/hooks";
import { calcAge, formatDate } from "@/lib/format";
import { SECCIONES } from "@/lib/historia/config";
import type { EvolucionSesion } from "@/lib/data/types";

function EvolucionesTab({ pacienteId }: { pacienteId: string }) {
  const psicologos = useDb((s) => s.psicologos);
  const evoluciones = useEvoluciones(pacienteId);
  const deleteEvolucion = useDb((s) => s.deleteEvolucion);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EvolucionSesion | undefined>();
  const [toDelete, setToDelete] = React.useState<EvolucionSesion | undefined>();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nueva evolución
        </Button>
      </div>
      {evoluciones.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Aún no hay evoluciones registradas.</CardContent></Card>
      ) : (
        evoluciones.map((e) => {
          const psi = psicologos.find((p) => p.id === e.psicologoId);
          return (
            <Card key={e.id} className="p-0">
              <div className="flex items-start gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10">
                  <Stethoscope className="h-4 w-4 text-brand" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{formatDate(e.fecha)} · {e.hora}</p>
                      <p className="text-xs text-muted-foreground">{psi?.nombre ?? "—"}{e.motivo ? ` · ${e.motivo}` : ""}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(e); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setToDelete(e)}>
                          <Trash2 className="h-4 w-4" />Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm">{e.observaciones}</p>
                  {e.acuerdos && (
                    <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                      <span className="font-medium">Acuerdos: </span>{e.acuerdos}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })
      )}

      <EvolucionDialog open={open} onOpenChange={setOpen} pacienteId={pacienteId} evolucion={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Eliminar evolución"
        description="¿Eliminar esta nota de evolución?"
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) { deleteEvolucion(toDelete.id); toast.success("Evolución eliminada"); setToDelete(undefined); }
        }}
      />
    </div>
  );
}

function HistoriaDetalleInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ready = useDbReady();
  const paciente = useDb((s) => s.pacientes.find((p) => p.id === params.id));
  const evaluacion = useEvaluacion(params.id);

  if (ready && !paciente) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-muted-foreground">Paciente no encontrado.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/historia-clinica"><ArrowLeft className="h-4 w-4" />Volver</Link>
        </Button>
      </div>
    );
  }
  if (!paciente) return null;

  const nombre = `${paciente.nombres} ${paciente.apellidos}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/historia-clinica")} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Historia Clínica</span>
      </div>

      <PageHeader
        title={nombre}
        description={`${calcAge(paciente.fechaNacimiento)} años · ${paciente.sexo} · ${paciente.tipoDoc} ${paciente.numDoc}`}
      >
        {evaluacion?.actualizadoEn && (
          <span className="text-xs text-muted-foreground">
            Guardado automáticamente · {formatDate(evaluacion.actualizadoEn)}
          </span>
        )}
      </PageHeader>

      <Tabs defaultValue={SECCIONES[0].id}>
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          {SECCIONES.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>{s.title}</TabsTrigger>
          ))}
          <TabsTrigger value="plan_trabajo">Plan de trabajo</TabsTrigger>
          <TabsTrigger value="evoluciones">Evoluciones</TabsTrigger>
        </TabsList>

        {SECCIONES.map((s) => (
          <TabsContent key={s.id} value={s.id} className="mt-4">
            <SeccionForm pacienteId={paciente.id} section={s} />
          </TabsContent>
        ))}
        <TabsContent value="plan_trabajo" className="mt-4">
          <PlanTrabajo pacienteId={paciente.id} />
        </TabsContent>
        <TabsContent value="evoluciones" className="mt-4">
          <EvolucionesTab pacienteId={paciente.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function HistoriaDetallePage() {
  return (
    <RoleGuard roles={[1, 2]}>
      <HistoriaDetalleInner />
    </RoleGuard>
  );
}
