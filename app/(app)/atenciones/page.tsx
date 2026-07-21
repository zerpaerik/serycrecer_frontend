"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  BadgeCheck,
  ClipboardPlus,
  MoreHorizontal,
  Pencil,
  Stethoscope,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { EstadoPagoBadge } from "@/components/shared/status-badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AtencionFormDialog } from "@/components/atenciones/atencion-form-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { formatDate, formatPEN } from "@/lib/format";
import type { Atencion } from "@/lib/data/types";

type Row = Atencion & { _paciente: string; _psicologo: string; _servicio: string };

export default function AtencionesPage() {
  const router = useRouter();
  const ready = useDbReady();
  const atenciones = useDb((s) => s.atenciones);
  const pacientes = useDb((s) => s.pacientes);
  const psicologos = useDb((s) => s.psicologos);
  const servicios = useDb((s) => s.servicios);
  const updateAtencion = useDb((s) => s.updateAtencion);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Atencion | undefined>();

  const data: Row[] = React.useMemo(
    () =>
      atenciones
        .slice()
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .map((a) => ({
          ...a,
          _paciente: pacienteNombre(pacientes.find((p) => p.id === a.pacienteId)),
          _psicologo: psicologos.find((p) => p.id === a.psicologoId)?.nombre ?? "—",
          _servicio: servicios.find((s) => s.id === a.servicioId)?.nombre ?? "—",
        })),
    [atenciones, pacientes, psicologos, servicios],
  );

  const totales = React.useMemo(() => {
    const pagado = atenciones.filter((a) => a.estadoPago === "Pagado").reduce((s, a) => s + a.monto, 0);
    const pendiente = atenciones.filter((a) => a.estadoPago === "Pendiente").reduce((s, a) => s + a.monto, 0);
    return { pagado, pendiente, count: atenciones.length };
  }, [atenciones]);

  const columns: ColumnDef<Row, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-medium">{formatDate(row.original.fecha)}</p>
            <p className="text-xs text-muted-foreground">{row.original.hora}</p>
          </div>
        ),
      },
      {
        accessorKey: "_paciente",
        header: "Paciente",
        cell: ({ row }) => <span className="font-medium">{row.original._paciente}</span>,
      },
      { accessorKey: "_servicio", header: "Servicio" },
      {
        accessorKey: "_psicologo",
        header: "Psicólogo",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original._psicologo}</span>
        ),
      },
      {
        accessorKey: "monto",
        header: "Monto",
        cell: ({ row }) => <span className="tabular-nums">{formatPEN(row.original.monto)}</span>,
      },
      {
        accessorKey: "estadoPago",
        header: "Pago",
        cell: ({ row }) => <EstadoPagoBadge estado={row.original.estadoPago} />,
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => {
          const a = row.original;
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
                      setEditing(a);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  {a.estadoPago === "Pendiente" && (
                    <DropdownMenuItem
                      onClick={() => {
                        updateAtencion(a.id, { estadoPago: "Pagado" });
                        toast.success("Marcada como pagada");
                      }}
                    >
                      <BadgeCheck className="h-4 w-4" />
                      Marcar como pagada
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => router.push(`/pacientes/${a.pacienteId}`)}>
                    <Stethoscope className="h-4 w-4" />
                    Ver paciente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router, updateAtencion],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Atenciones" description="Sesiones registradas y su estado de pago">
        <Button
          className="bg-brand-gradient text-white"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <ClipboardPlus className="h-4 w-4" />
          Registrar atención
        </Button>
      </PageHeader>

      {ready && atenciones.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard kpi={{ label: "Sesiones registradas", value: String(totales.count), icon: ClipboardPlus, color: "#0d9488" }} />
          <KpiCard kpi={{ label: "Cobrado", value: formatPEN(totales.pagado), icon: BadgeCheck, color: "#0ea5e9" }} />
          <KpiCard kpi={{ label: "Pendiente de cobro", value: formatPEN(totales.pendiente), icon: BadgeCheck, color: "#f59e0b" }} />
        </div>
      )}

      {!ready ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchKeys={["_paciente", "_psicologo", "_servicio"]}
          searchPlaceholder="Buscar por paciente, psicólogo o servicio…"
          emptyState={
            <EmptyState
              icon={ClipboardPlus}
              title="Aún no hay atenciones"
              description="Registra una atención desde la agenda o directamente aquí."
            />
          }
        />
      )}

      <AtencionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        atencion={editing}
      />
    </div>
  );
}
