"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Clock, MoreHorizontal, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ServicioFormDialog } from "@/components/admin/servicio-form-dialog";
import { Button } from "@/components/ui/button";
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
import { formatPEN } from "@/lib/format";
import type { Servicio } from "@/lib/data/types";

function ServiciosInner() {
  const ready = useDbReady();
  const servicios = useDb((s) => s.servicios);
  const deleteServicio = useDb((s) => s.deleteServicio);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Servicio | undefined>();
  const [toDelete, setToDelete] = React.useState<Servicio | undefined>();

  const columns: ColumnDef<Servicio, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "nombre",
        header: "Servicio",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: row.original.color }} />
            <span className="font-medium">{row.original.nombre}</span>
          </div>
        ),
      },
      {
        accessorKey: "duracionMin",
        header: "Duración",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {row.original.duracionMin} min
          </span>
        ),
      },
      {
        accessorKey: "precio",
        header: "Tarifa",
        cell: ({ row }) => <span className="font-medium tabular-nums">{formatPEN(row.original.precio)}</span>,
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => {
          const s = row.original;
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
                      setEditing(s);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setToDelete(s)}>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
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
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Servicios y Tarifas" description={`${servicios.length} servicios`}>
        <Button
          className="bg-brand-gradient text-white"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo servicio
        </Button>
      </PageHeader>

      {!ready ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={servicios}
          searchKeys={["nombre"]}
          searchPlaceholder="Buscar servicio…"
          emptyState={<EmptyState icon={SlidersHorizontal} title="Sin servicios" />}
        />
      )}

      <ServicioFormDialog open={formOpen} onOpenChange={setFormOpen} servicio={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Eliminar servicio"
        description={toDelete ? `¿Eliminar "${toDelete.nombre}"?` : undefined}
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) {
            deleteServicio(toDelete.id);
            toast.success("Servicio eliminado");
            setToDelete(undefined);
          }
        }}
      />
    </div>
  );
}

export default function ServiciosPage() {
  return (
    <RoleGuard roles={[1]}>
      <ServiciosInner />
    </RoleGuard>
  );
}
