"use client";

import * as React from "react";
import { BadgeCheck, Banknote, CreditCard, Landmark, LockKeyhole, Printer, Receipt, Smartphone, Unlock, Wallet } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { AbrirTurnoDialog, CerrarTurnoDialog } from "@/components/caja/turno-dialogs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { formatPEN, hoyIso } from "@/lib/format";
import { METODOS_PAGO, type MetodoPago } from "@/lib/data/types";

const ICONO: Record<MetodoPago, typeof Wallet> = {
  Efectivo: Banknote, Yape: Smartphone, Plin: Smartphone, Tarjeta: CreditCard, Transferencia: Landmark,
};

function PagosInner() {
  const ready = useDbReady();
  const atenciones = useDb((s) => s.atenciones);
  const pacientes = useDb((s) => s.pacientes);
  const gastos = useDb((s) => s.gastos);
  const turnoActual = useDb((s) => s.turnoActual);
  const turnos = useDb((s) => s.turnos);
  const refreshCaja = useDb((s) => s.refreshCaja);

  const [fecha, setFecha] = React.useState(hoyIso());
  const [abrirOpen, setAbrirOpen] = React.useState(false);
  const [cerrarOpen, setCerrarOpen] = React.useState(false);

  // Turnos de la fecha seleccionada (y el turno abierto, si lo hay).
  React.useEffect(() => {
    refreshCaja(fecha).catch(() => {});
  }, [fecha, refreshCaja]);

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

  const gastosDia = React.useMemo(() => gastos.filter((g) => g.fecha === fecha), [gastos, fecha]);
  const totalGastos = gastosDia.reduce((s, g) => s + g.monto, 0);
  const neto = total - totalGastos;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Pagos y Caja" description="Caja diaria del centro">
        {turnoActual ? (
          <Button className="bg-brand-gradient text-white" onClick={() => setCerrarOpen(true)}>
            <LockKeyhole className="h-4 w-4" />
            Cerrar caja
          </Button>
        ) : (
          <Button className="bg-brand-gradient text-white" onClick={() => setAbrirOpen(true)}>
            <Unlock className="h-4 w-4" />
            Abrir caja
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => window.open(`/cierre-caja?fecha=${fecha}`, "_blank")}
        >
          <Printer className="h-4 w-4" />
          Cierre del día (PDF)
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3">
        <div>
          <Label className="mb-1.5 block text-xs">Fecha de caja</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-48" />
        </div>
        {fecha !== hoyIso() && (
          <button className="text-sm font-medium text-brand hover:underline" onClick={() => setFecha(hoyIso())}>Ir a hoy</button>
        )}
      </div>

      {/* Turnos de caja del día (una jornada puede tener varios) */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Turnos de caja</CardTitle>
          {turnoActual ? (
            <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">
              {turnoActual.nombre} abierto
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Caja cerrada
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {turnos.length === 0 ? (
            <p className="px-6 py-6 text-center text-sm text-muted-foreground">
              No se abrió caja este día.
            </p>
          ) : (
            <div className="divide-y">
              {turnos.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {t.nombre}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          t.estado === "Abierto" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.estado}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Inicial {formatPEN(t.montoInicial)} · {t.count} pagos
                      {t.usuarioApertura ? ` · abrió ${t.usuarioApertura}` : ""}
                      {t.usuarioCierre ? ` · cerró ${t.usuarioCierre}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold tabular-nums">{formatPEN(t.neto)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.estado === "Cerrado" && t.diferencia !== null ? (
                        t.diferencia === 0 ? (
                          <span className="text-success">Cuadró</span>
                        ) : (
                          <span className={t.diferencia < 0 ? "text-destructive" : "text-warning"}>
                            {t.diferencia < 0 ? "Faltó " : "Sobró "}
                            {formatPEN(Math.abs(t.diferencia))}
                          </span>
                        )
                      ) : (
                        `Esperado ${formatPEN(t.esperadoEfectivo)}`
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/cierre-caja?turnoId=${t.id}`, "_blank")}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Imprimir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!ready ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard kpi={{ label: "Ingresos", value: formatPEN(total), icon: Wallet, color: "#14a89c" }} />
            <KpiCard kpi={{ label: "Gastos", value: formatPEN(totalGastos), icon: Receipt, color: "#e8774a" }} />
            <KpiCard kpi={{ label: "Neto en caja", value: formatPEN(neto), icon: BadgeCheck, color: neto < 0 ? "#dc2626" : "#2b83c2" }} />
            <KpiCard kpi={{ label: "N° de pagos", value: String(cobros.length), icon: BadgeCheck, color: "#8b5cf6" }} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-1">
              <Card>
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

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Gastos del día</CardTitle>
                  <span className="text-sm font-semibold tabular-nums text-destructive">− {formatPEN(totalGastos)}</span>
                </CardHeader>
                <CardContent className="p-0">
                  {gastosDia.length === 0 ? (
                    <p className="px-6 py-6 text-center text-sm text-muted-foreground">Sin gastos este día.</p>
                  ) : (
                    <div className="divide-y">
                      {gastosDia.map((g) => (
                        <div key={g.id} className="flex items-center gap-3 px-6 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{g.categoria}</p>
                            <p className="truncate text-xs text-muted-foreground">{g.descripcion || g.metodo}</p>
                          </div>
                          <span className="shrink-0 text-sm font-medium tabular-nums text-destructive">{formatPEN(g.monto)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

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

      <AbrirTurnoDialog open={abrirOpen} onOpenChange={setAbrirOpen} />
      {turnoActual && (
        <CerrarTurnoDialog
          key={turnoActual.id + turnoActual.esperadoEfectivo}
          open={cerrarOpen}
          onOpenChange={setCerrarOpen}
          turno={turnoActual}
        />
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
