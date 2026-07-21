"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  FilePlus2,
  MoreHorizontal,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { HistoriaHeaderDialog } from "@/components/historia/historia-header-dialog";
import { EvolucionDialog } from "@/components/historia/evolucion-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDb } from "@/lib/data/store";
import { useDbReady, useEvoluciones, useHistoria } from "@/lib/data/hooks";
import { calcAge, formatDate } from "@/lib/format";
import type { EvolucionSesion } from "@/lib/data/types";

function Seccion({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <p className="mt-1 text-sm">{texto || "—"}</p>
    </div>
  );
}

function HistoriaDetalleInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ready = useDbReady();

  const paciente = useDb((s) => s.pacientes.find((p) => p.id === params.id));
  const psicologos = useDb((s) => s.psicologos);
  const historia = useHistoria(params.id);
  const evoluciones = useEvoluciones(params.id);
  const deleteEvolucion = useDb((s) => s.deleteEvolucion);

  const [headerOpen, setHeaderOpen] = React.useState(false);
  const [evoOpen, setEvoOpen] = React.useState(false);
  const [editingEvo, setEditingEvo] = React.useState<EvolucionSesion | undefined>();
  const [toDelete, setToDelete] = React.useState<EvolucionSesion | undefined>();

  if (ready && !paciente) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-muted-foreground">Paciente no encontrado.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/historia-clinica">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
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
        <Button variant="outline" onClick={() => setHeaderOpen(true)}>
          <Pencil className="h-4 w-4" />
          {historia ? "Editar historia" : "Abrir historia"}
        </Button>
      </PageHeader>

      {/* Encabezado clínico */}
      {historia ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos clínicos</CardTitle>
            <p className="text-xs text-muted-foreground">
              Historia abierta el {formatDate(historia.fechaApertura)}
            </p>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Seccion titulo="Antecedentes" texto={historia.antecedentes} />
            <Seccion titulo="Diagnóstico presuntivo" texto={historia.diagnostico} />
            <Seccion titulo="Plan de tratamiento" texto={historia.planTratamiento} />
            <Seccion titulo="Objetivos terapéuticos" texto={historia.objetivos} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient-soft">
              <FilePlus2 className="h-6 w-6 text-brand" />
            </span>
            <p className="font-medium">Este paciente aún no tiene historia clínica</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Abre la historia para registrar antecedentes, diagnóstico y plan de tratamiento.
            </p>
            <Button className="mt-1 bg-brand-gradient text-white" onClick={() => setHeaderOpen(true)}>
              <Plus className="h-4 w-4" />
              Abrir historia
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Evoluciones */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold">
          Evoluciones ({evoluciones.length})
        </h3>
        <Button
          variant="outline"
          onClick={() => {
            setEditingEvo(undefined);
            setEvoOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva evolución
        </Button>
      </div>

      {evoluciones.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay evoluciones registradas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evoluciones.map((e) => {
            const psi = psicologos.find((p) => p.id === e.psicologoId);
            return (
              <Card key={e.id} className="p-0">
                <div className="flex items-start gap-4 p-5">
                  <div className="flex flex-col items-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10">
                      <Stethoscope className="h-4 w-4 text-brand" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          {formatDate(e.fecha)} · {e.hora}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {psi?.nombre ?? "—"}
                          {e.motivo ? ` · ${e.motivo}` : ""}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingEvo(e);
                              setEvoOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setToDelete(e)}>
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm">{e.observaciones}</p>
                    {e.acuerdos && (
                      <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                        <span className="font-medium">Acuerdos: </span>
                        {e.acuerdos}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <HistoriaHeaderDialog
        open={headerOpen}
        onOpenChange={setHeaderOpen}
        pacienteId={paciente.id}
        historia={historia}
      />
      <EvolucionDialog
        open={evoOpen}
        onOpenChange={setEvoOpen}
        pacienteId={paciente.id}
        evolucion={editingEvo}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Eliminar evolución"
        description="¿Eliminar esta nota de evolución? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) {
            deleteEvolucion(toDelete.id);
            toast.success("Evolución eliminada");
            setToDelete(undefined);
          }
        }}
      />
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
