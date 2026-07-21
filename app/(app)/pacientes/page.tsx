"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Eye, MoreHorizontal, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { EstadoPacienteBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PacienteFormDialog } from "@/components/pacientes/paciente-form-dialog";
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
import { calcAge, initials } from "@/lib/format";
import type { Paciente } from "@/lib/data/types";

// Extiende Paciente con el nombre completo para búsqueda/orden.
type Row = Paciente & { _nombre: string };

export default function PacientesPage() {
  const router = useRouter();
  const ready = useDbReady();
  const pacientes = useDb((s) => s.pacientes);
  const deletePaciente = useDb((s) => s.deletePaciente);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Paciente | undefined>();
  const [toDelete, setToDelete] = React.useState<Paciente | undefined>();

  const data: Row[] = React.useMemo(
    () => pacientes.map((p) => ({ ...p, _nombre: `${p.nombres} ${p.apellidos}` })),
    [pacientes],
  );

  const columns: ColumnDef<Row, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "_nombre",
        header: "Paciente",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-brand/10 text-xs font-semibold text-brand">
                  {initials(p._nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{p._nombre}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.tipoDoc} {p.numDoc}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "telefono",
        header: "Contacto",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-sm">{row.original.telefono}</p>
            {row.original.email && (
              <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "fechaNacimiento",
        header: "Edad / Sexo",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {calcAge(row.original.fechaNacimiento)} años · {row.original.sexo}
          </span>
        ),
      },
      {
        accessorKey: "motivoConsulta",
        header: "Motivo",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[16rem] text-sm text-muted-foreground">
            {row.original.motivoConsulta || "—"}
          </span>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => <EstadoPacienteBadge estado={row.original.estado} />,
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/pacientes/${p.id}`)}>
                    <Eye className="h-4 w-4" />
                    Ver ficha
                  </DropdownMenuItem>
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
                  <DropdownMenuItem variant="destructive" onClick={() => setToDelete(p)}>
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
    [router],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Pacientes" description={`${pacientes.length} pacientes registrados`}>
        <Button
          className="bg-brand-gradient text-white"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo paciente
        </Button>
      </PageHeader>

      {!ready ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchKeys={["_nombre", "numDoc", "telefono", "email"]}
          searchPlaceholder="Buscar por nombre, documento o teléfono…"
          onRowClick={(p) => router.push(`/pacientes/${p.id}`)}
          emptyState={
            <EmptyState
              icon={Users}
              title="Aún no hay pacientes"
              description="Registra tu primer paciente para empezar a agendar citas."
            >
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(undefined);
                  setFormOpen(true);
                }}
              >
                <UserRound className="h-4 w-4" />
                Nuevo paciente
              </Button>
            </EmptyState>
          }
        />
      )}

      <PacienteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        paciente={editing}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Eliminar paciente"
        description={
          toDelete
            ? `¿Eliminar a ${toDelete.nombres} ${toDelete.apellidos}? Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) {
            deletePaciente(toDelete.id);
            toast.success("Paciente eliminado");
            setToDelete(undefined);
          }
        }}
      />
    </div>
  );
}
