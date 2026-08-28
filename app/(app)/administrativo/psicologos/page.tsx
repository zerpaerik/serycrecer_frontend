"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, RotateCcw, Stethoscope, Trash2 } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PsicologoFormDialog } from "@/components/admin/psicologo-form-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDb } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { initials } from "@/lib/format";
import type { Psicologo } from "@/lib/data/types";

function PsicologosInner() {
  const ready = useDbReady();
  const psicologos = useDb((s) => s.psicologos);
  const deletePsicologo = useDb((s) => s.deletePsicologo);
  const reactivarPsicologo = useDb((s) => s.reactivarPsicologo);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Psicologo | undefined>();
  const [toDelete, setToDelete] = React.useState<Psicologo | undefined>();

  const columns: ColumnDef<Psicologo, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "nombre",
        header: "Profesional",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs font-bold text-white" style={{ backgroundColor: p.color }}>
                  {initials(p.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-medium">
                  {p.nombre}
                  {p.estado === "Inactivo" && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Inactivo
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.especialidad}
                  {p.licencia ? ` · ${p.licencia}` : ""}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Contacto",
        cell: ({ row }) => (
          <div className="min-w-0 text-sm">
            <p className="truncate">{row.original.email || "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.telefono || ""}</p>
          </div>
        ),
      },
      {
        accessorKey: "horario",
        header: "Horario",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.horario || "—"}</span>
        ),
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {p.estado === "Inactivo" ? (
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await reactivarPsicologo(p.id);
                          toast.success(`${p.nombre} fue reactivado`);
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "No se pudo reactivar");
                        }
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reactivar
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem variant="destructive" onClick={() => setToDelete(p)}>
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Psicólogos" description={`${psicologos.length} profesionales`}>
        <Button
          className="bg-brand-gradient text-white"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo psicólogo
        </Button>
      </PageHeader>

      {!ready ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={psicologos}
          searchKeys={["nombre", "especialidad", "email"]}
          searchPlaceholder="Buscar profesional…"
          emptyState={<EmptyState icon={Stethoscope} title="Sin psicólogos" />}
        />
      )}

      <PsicologoFormDialog open={formOpen} onOpenChange={setFormOpen} psicologo={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Eliminar psicólogo"
        description={toDelete ? `¿Eliminar a ${toDelete.nombre}?` : undefined}
        confirmLabel="Eliminar"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          const nombre = toDelete.nombre;
          setToDelete(undefined);
          try {
            const res = await deletePsicologo(toDelete.id);
            if (res?.desactivado) {
              // Tiene historial: se desactiva para no perder citas ni atenciones.
              toast.warning(res.mensaje ?? `${nombre} fue desactivado.`);
            } else {
              toast.success("Psicólogo eliminado");
            }
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "No se pudo eliminar el psicólogo");
          }
        }}
      />
    </div>
  );
}

export default function PsicologosPage() {
  return (
    <RoleGuard roles={[1]}>
      <PsicologosInner />
    </RoleGuard>
  );
}
