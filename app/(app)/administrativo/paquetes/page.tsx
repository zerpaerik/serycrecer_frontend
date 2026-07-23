"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { MoreHorizontal, Package, Pencil, Plus, Trash2 } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PaqueteFormDialog } from "@/components/admin/paquete-form-dialog";
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
import type { Paquete } from "@/lib/data/types";

function PaquetesInner() {
  const ready = useDbReady();
  const paquetes = useDb((s) => s.paquetes);
  const servicios = useDb((s) => s.servicios);
  const deletePaquete = useDb((s) => s.deletePaquete);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Paquete | undefined>();
  const [toDelete, setToDelete] = React.useState<Paquete | undefined>();

  const columns: ColumnDef<Paquete, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "nombre",
        header: "Paquete",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${row.original.color}1a` }}>
              <Package className="h-4 w-4" style={{ color: row.original.color }} />
            </span>
            <span className="font-medium">{row.original.nombre}</span>
          </div>
        ),
      },
      { accessorKey: "sesiones", header: "Sesiones", cell: ({ row }) => <span className="tabular-nums">{row.original.sesiones}</span> },
      { accessorKey: "precio", header: "Precio", cell: ({ row }) => <span className="font-medium tabular-nums">{formatPEN(row.original.precio)}</span> },
      {
        id: "unit",
        header: "Precio/sesión",
        cell: ({ row }) => <span className="text-sm text-muted-foreground tabular-nums">{formatPEN(row.original.precio / Math.max(1, row.original.sesiones))}</span>,
      },
      {
        accessorKey: "servicioId",
        header: "Servicio",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{servicios.find((s) => s.id === row.original.servicioId)?.nombre ?? "—"}</span>,
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="h-4 w-4" />Editar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" />Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [servicios],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Paquetes" description={`${paquetes.length} paquetes de sesiones`}>
        <Button className="bg-brand-gradient text-white" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />Nuevo paquete
        </Button>
      </PageHeader>

      {!ready ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : (
        <DataTable
          columns={columns}
          data={paquetes}
          searchKeys={["nombre"]}
          searchPlaceholder="Buscar paquete…"
          emptyState={<EmptyState icon={Package} title="Sin paquetes" description="Crea paquetes de sesiones prepagadas." />}
        />
      )}

      <PaqueteFormDialog open={formOpen} onOpenChange={setFormOpen} paquete={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Eliminar paquete"
        description={toDelete ? `¿Eliminar "${toDelete.nombre}"?` : undefined}
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => { if (toDelete) { deletePaquete(toDelete.id); toast.success("Paquete eliminado"); setToDelete(undefined); } }}
      />
    </div>
  );
}

export default function PaquetesPage() {
  return (
    <RoleGuard roles={[1]}>
      <PaquetesInner />
    </RoleGuard>
  );
}
