"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { HandCoins, Wallet } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { EstadoPagoBadge } from "@/components/shared/status-badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CobroDialog } from "@/components/atenciones/cobro-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { atnEstado, atnSaldo, atnTotal } from "@/lib/data/atenciones";
import { formatDate, formatPEN } from "@/lib/format";
import type { Atencion } from "@/lib/data/types";

type Row = Atencion & { _paciente: string; _saldo: number };

function CobrarInner() {
  const router = useRouter();
  const ready = useDbReady();
  const atenciones = useDb((s) => s.atenciones);
  const pacientes = useDb((s) => s.pacientes);

  const [cobrar, setCobrar] = React.useState<Atencion | undefined>();

  const pendientes = React.useMemo(
    () => atenciones.filter((a) => !a.anulada && atnSaldo(a) > 0),
    [atenciones],
  );
  const total = pendientes.reduce((s, a) => s + atnSaldo(a), 0);

  const data: Row[] = React.useMemo(
    () =>
      pendientes
        .slice()
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .map((a) => ({
          ...a,
          _paciente: pacienteNombre(pacientes.find((p) => p.id === a.pacienteId)),
          _saldo: atnSaldo(a),
        })),
    [pendientes, pacientes],
  );

  const columns: ColumnDef<Row, unknown>[] = React.useMemo(
    () => [
      { accessorKey: "fecha", header: "Fecha", cell: ({ row }) => <span className="text-sm">{formatDate(row.original.fecha)}</span> },
      { accessorKey: "_paciente", header: "Paciente", cell: ({ row }) => <span className="font-medium">{row.original._paciente}</span> },
      { id: "total", header: "Total", cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatPEN(atnTotal(row.original))}</span> },
      { accessorKey: "_saldo", header: "Saldo", cell: ({ row }) => <span className="font-medium tabular-nums text-warning">{formatPEN(row.original._saldo)}</span> },
      { id: "estado", header: "Estado", cell: ({ row }) => <EstadoPagoBadge estado={atnEstado(row.original)} /> },
      {
        id: "accion",
        header: "",
        cell: ({ row }) => (
          <div className="text-right" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" className="bg-brand-gradient text-white" onClick={() => setCobrar(row.original)}>
              <HandCoins className="h-4 w-4" />Abonar
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Cuentas por Cobrar" description="Atenciones con saldo pendiente" />

      {!ready ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard kpi={{ label: "Total por cobrar", value: formatPEN(total), icon: HandCoins, color: "#f4b21f" }} />
            <KpiCard kpi={{ label: "Atenciones pendientes", value: String(pendientes.length), icon: Wallet, color: "#2b83c2" }} />
          </div>

          <DataTable
            columns={columns}
            data={data}
            searchKeys={["_paciente"]}
            searchPlaceholder="Buscar por paciente…"
            onRowClick={(a) => router.push(`/atenciones/${a.id}`)}
            emptyState={<EmptyState icon={HandCoins} title="No hay cuentas por cobrar" description="Todas las atenciones están saldadas." />}
          />
        </>
      )}

      <CobroDialog key={cobrar?.id ?? "none"} open={!!cobrar} onOpenChange={(o) => !o && setCobrar(undefined)} atencion={cobrar} />
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
