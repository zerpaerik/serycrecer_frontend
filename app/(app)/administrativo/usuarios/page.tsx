"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UsuarioFormDialog } from "@/components/admin/usuario-form-dialog";
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
import { getRole } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format";
import type { Usuario } from "@/lib/data/types";

function UsuariosInner() {
  const ready = useDbReady();
  const usuarios = useDb((s) => s.usuarios);
  const deleteUsuario = useDb((s) => s.deleteUsuario);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Usuario | undefined>();
  const [toDelete, setToDelete] = React.useState<Usuario | undefined>();

  const columns: ColumnDef<Usuario, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "nombre",
        header: "Usuario",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.nombre}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "roleId",
        header: "Rol",
        cell: ({ row }) => {
          const role = getRole(row.original.roleId);
          return (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${role.color}1a`, color: role.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: role.color }} />
              {role.name}
            </span>
          );
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) =>
          row.original.estado === "Activo" ? (
            <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">Activo</span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Inactivo</span>
          ),
      },
      {
        accessorKey: "creadoEn",
        header: "Creado",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.creadoEn)}</span>
        ),
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => {
          const u = row.original;
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
                      setEditing(u);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setToDelete(u)}>
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
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Usuarios" description={`${usuarios.length} usuarios del sistema`}>
        <Button
          className="bg-brand-gradient text-white"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </PageHeader>

      {!ready ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={usuarios}
          searchKeys={["nombre", "email"]}
          searchPlaceholder="Buscar por nombre o correo…"
          emptyState={<EmptyState icon={Users} title="Sin usuarios" />}
        />
      )}

      <UsuarioFormDialog open={formOpen} onOpenChange={setFormOpen} usuario={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Eliminar usuario"
        description={toDelete ? `¿Eliminar a ${toDelete.nombre}?` : undefined}
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) {
            deleteUsuario(toDelete.id);
            toast.success("Usuario eliminado");
            setToDelete(undefined);
          }
        }}
      />
    </div>
  );
}

export default function UsuariosPage() {
  return (
    <RoleGuard roles={[1]}>
      <UsuariosInner />
    </RoleGuard>
  );
}
