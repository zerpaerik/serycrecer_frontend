"use client";

import * as React from "react";
import { BadgeCheck, Banknote, CreditCard, Landmark, Receipt, Smartphone, Wallet } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { formatPEN } from "@/lib/format";
import { METODOS_PAGO, type MetodoPago } from "@/lib/data/types";

const ICONO: Record<MetodoPago, typeof Wallet> = {
  Efectivo: Banknote, Yape: Smartphone, Plin: Smartphone, Tarjeta: CreditCard, Transferencia: Landmark,
};

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

function PagosInner() {
  const ready = useDbReady();
  const atenciones = useDb((s) => s.atenciones);
  const pacientes = useDb((s) => s.pacientes);

  const [fecha, setFecha] = React.useState(hoyIso());

  // Todos los pagos del día (de atenciones no anuladas).
  const cobros = React.useMemo(() => {
    const rows: { id: string; hora: string; paciente: string; tipo: string; metodo: MetodoPago; monto: number }[] = [];
    for (const a of atenciones) {
      if (a.anulada) continue;
      for (const p of a.pagos) {
        if (p.fecha !== fecha) continue;
        rows.push({
          id: p.id,
          hora: a.hora ?? "",
          paciente: pacienteNombre(pacientes.find((x) => x.id === a.pacienteId)),
          tipo: p.tipo,
          metodo: p.metodo,
          monto: p.monto,
        });
      }
    }
    return rows;
  }, [atenciones, pacientes, fecha]);

  const total = cobros.reduce((s, c) => s + c.monto, 0);
  const porMetodo = React.useMemo(() => {
    const map = new Map<MetodoPago, number>();
    for (const c of cobros) map.set(c.metodo, (map.get(c.metodo) ?? 0) + c.monto);
    return map;
  }, [cobros]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Pagos y Caja" description="Caja diaria del centro" />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3">
        <div>
          <Label className="mb-1.5 block text-xs">Fecha de caja</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-48" />
        </div>
        {fecha !== hoyIso() && (
          <button className="text-sm font-medium text-brand hover:underline" onClick={() => setFecha(hoyIso())}>Ir a hoy</button>
        )}
      </div>

      {!ready ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard kpi={{ label: "Total cobrado", value: formatPEN(total), icon: Wallet, color: "#14a89c" }} />
            <KpiCard kpi={{ label: "N° de pagos", value: String(cobros.length), icon: Receipt, color: "#2b83c2" }} />
            <KpiCard kpi={{ label: "Ticket promedio", value: formatPEN(cobros.length ? total / cobros.length : 0), icon: BadgeCheck, color: "#8b5cf6" }} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base">Por método de pago</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {METODOS_PAGO.map((m) => {
                  const Icon = ICONO[m];
                  return (
                    <div key={m} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Icon className="h-4 w-4 text-muted-foreground" /></span>
                      <span className="flex-1 text-sm">{m}</span>
                      <span className="text-sm font-medium tabular-nums">{formatPEN(porMetodo.get(m) ?? 0)}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Pagos del día</CardTitle></CardHeader>
              <CardContent className="p-0">
                {cobros.length === 0 ? (
                  <EmptyState icon={Wallet} title="Sin pagos este día" description="No se registraron pagos en la fecha seleccionada." />
                ) : (
                  <div className="divide-y">
                    {cobros.map((c) => (
                      <div key={c.id} className="flex items-center gap-4 px-6 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{c.paciente}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.tipo} · {c.metodo}</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPEN(c.monto)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default function PagosPage() {
  return (
    <RoleGuard roles={[1, 3]}>
      <PagosInner />
    </RoleGuard>
  );
}
