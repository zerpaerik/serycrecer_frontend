"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCheck, ClipboardPlus, Eye, HandCoins, MoreHorizontal } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { EstadoPagoBadge } from "@/components/shared/status-badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CobroDialog } from "@/components/atenciones/cobro-dialog";
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
import { atnEstado, atnPagado, atnSaldo, atnTotal } from "@/lib/data/atenciones";
import { formatDate, formatPEN } from "@/lib/format";
import type { Atencion } from "@/lib/data/types";

type Row = Atencion & {
  _paciente: string;
  _psicologo: string;
  _resumen: string;
  _total: number;
  _saldo: number;
};

export default function AtencionesPage() {
  const router = useRouter();
  const ready = useDbReady();
  const atenciones = useDb((s) => s.atenciones);
  const pacientes = useDb((s) => s.pacientes);
  const psicologos = useDb((s) => s.psicologos);

  const [cobrar, setCobrar] = React.useState<Atencion | undefined>();

  const activas = React.useMemo(() => atenciones.filter((a) => !a.anulada), [atenciones]);

  const data: Row[] = React.useMemo(
    () =>
      activas
        .slice()
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .map((a) => ({
          ...a,
          _paciente: pacienteNombre(pacientes.find((p) => p.id === a.pacienteId)),
          _psicologo: psicologos.find((p) => p.id === a.psicologoId)?.nombre ?? "—",
          _resumen: a.items.map((i) => i.nombre).join(", "),
          _total: atnTotal(a),
          _saldo: atnSaldo(a),
        })),
    [activas, pacientes, psicologos],
  );

  const totales = React.useMemo(() => {
    const cobrado = activas.reduce((s, a) => s + atnPagado(a), 0);
    const pendiente = activas.reduce((s, a) => s + atnSaldo(a), 0);
    return { cobrado, pendiente, count: activas.length };
  }, [activas]);

  const columns: ColumnDef<Row, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-medium">{formatDate(row.original.fecha)}</p>
            {row.original.hora && <p className="text-xs text-muted-foreground">{row.original.hora}</p>}
          </div>
        ),
      },
      {
        accessorKey: "_paciente",
        header: "Paciente",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original._paciente}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original._resumen}</p>
          </div>
        ),
      },
      {
        accessorKey: "_total",
        header: "Total",
        cell: ({ row }) => <span className="tabular-nums">{formatPEN(row.original._total)}</span>,
      },
      {
        accessorKey: "_saldo",
        header: "Saldo",
        cell: ({ row }) =>
          row.original._saldo > 0 ? (
            <span className="font-medium tabular-nums text-warning">{formatPEN(row.original._saldo)}</span>
          ) : (
            <span className="tabular-nums text-muted-foreground">—</span>
          ),
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => <EstadoPagoBadge estado={atnEstado(row.original)} />,
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/atenciones/${a.id}`)}>
                    <Eye className="h-4 w-4" />Ver detalle
                  </DropdownMenuItem>
                  {atnSaldo(a) > 0 && (
                    <DropdownMenuItem onClick={() => setCobrar(a)}>
                      <HandCoins className="h-4 w-4" />Abonar
                    </DropdownMenuItem>
                  )}
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
      <PageHeader title="Atenciones" description="Sesiones registradas, pagos y saldos">
        <Button className="bg-brand-gradient text-white" onClick={() => router.push("/atenciones/nueva")}>
          <ClipboardPlus className="h-4 w-4" />
          Nueva atención
        </Button>
      </PageHeader>

      {ready && activas.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard kpi={{ label: "Atenciones", value: String(totales.count), icon: ClipboardPlus, color: "#14a89c" }} />
          <KpiCard kpi={{ label: "Cobrado", value: formatPEN(totales.cobrado), icon: BadgeCheck, color: "#2b83c2" }} />
          <KpiCard kpi={{ label: "Por cobrar", value: formatPEN(totales.pendiente), icon: HandCoins, color: "#f4b21f" }} />
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
          searchKeys={["_paciente", "_psicologo", "_resumen"]}
          searchPlaceholder="Buscar por paciente, psicólogo o servicio…"
          onRowClick={(a) => router.push(`/atenciones/${a.id}`)}
          emptyState={
            <EmptyState icon={ClipboardPlus} title="Aún no hay atenciones" description="Registra la primera atención del centro.">
              <Button variant="outline" onClick={() => router.push("/atenciones/nueva")}>
                <ClipboardPlus className="h-4 w-4" />Nueva atención
              </Button>
            </EmptyState>
          }
        />
      )}

      <CobroDialog key={cobrar?.id ?? "none"} open={!!cobrar} onOpenChange={(o) => !o && setCobrar(undefined)} atencion={cobrar} />
    </div>
  );
}
