"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { HandCoins, Wallet } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CobrarDialog } from "@/components/pagos/cobrar-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { formatDate, formatPEN } from "@/lib/format";
import type { Atencion } from "@/lib/data/types";

type Row = Atencion & { _paciente: string; _servicio: string };

function CobrarInner() {
  const ready = useDbReady();
  const atenciones = useDb((s) => s.atenciones);
  const pacientes = useDb((s) => s.pacientes);
  const servicios = useDb((s) => s.servicios);

  const [cobrar, setCobrar] = React.useState<Atencion | undefined>();

  const pendientes = React.useMemo(
    () => atenciones.filter((a) => a.estadoPago === "Pendiente"),
    [atenciones],
  );
  const total = pendientes.reduce((s, a) => s + a.monto, 0);

  const data: Row[] = React.useMemo(
    () =>
      pendientes
        .slice()
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .map((a) => ({
          ...a,
          _paciente: pacienteNombre(pacientes.find((p) => p.id === a.pacienteId)),
          _servicio: servicios.find((s) => s.id === a.servicioId)?.nombre ?? "—",
        })),
    [pendientes, pacientes, servicios],
  );

  const columns: ColumnDef<Row, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.fecha)}</span>
        ),
      },
      {
        accessorKey: "_paciente",
        header: "Paciente",
        cell: ({ row }) => <span className="font-medium">{row.original._paciente}</span>,
      },
      { accessorKey: "_servicio", header: "Servicio" },
      {
        accessorKey: "monto",
        header: "Monto",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{formatPEN(row.original.monto)}</span>
        ),
      },
      {
        id: "accion",
        header: "",
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              size="sm"
              className="bg-brand-gradient text-white"
              onClick={() => setCobrar(row.original)}
            >
              <HandCoins className="h-4 w-4" />
              Registrar cobro
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Cuentas por Cobrar"
        description="Sesiones registradas con pago pendiente"
      />

      {!ready ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard kpi={{ label: "Total por cobrar", value: formatPEN(total), icon: HandCoins, color: "#f59e0b" }} />
            <KpiCard kpi={{ label: "Sesiones pendientes", value: String(pendientes.length), icon: Wallet, color: "#0ea5e9" }} />
          </div>

          <DataTable
            columns={columns}
            data={data}
            searchKeys={["_paciente", "_servicio"]}
            searchPlaceholder="Buscar por paciente o servicio…"
            emptyState={
              <EmptyState
                icon={HandCoins}
                title="No hay cuentas por cobrar"
                description="Todas las sesiones registradas están pagadas."
              />
            }
          />
        </>
      )}

      <CobrarDialog
        key={cobrar?.id ?? "none"}
        open={!!cobrar}
        onOpenChange={(o) => !o && setCobrar(undefined)}
        atencion={cobrar}
      />
    </div>
  );
}

export default function CobrarPage() {
  return (
    <RoleGuard roles={[1, 3]}>
      <CobrarInner />
    </RoleGuard>
  );
}
