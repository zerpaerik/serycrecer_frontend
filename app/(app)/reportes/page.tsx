"use client";

import * as React from "react";
import { BadgeCheck, CalendarCheck2, Download, TrendingUp, Users } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AreaTrend } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { atnEstado, atnPagado, atnSaldo, atnTotal } from "@/lib/data/atenciones";
import { formatPEN, formatPercent } from "@/lib/format";
import { exportCSV } from "@/lib/export/csv";

function isoOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function ddmm(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function BarRow({ label, sub, value, max, color }: { label: string; sub?: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="ml-2 shrink-0 tabular-nums">{formatPEN(value)}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        {sub && <span className="shrink-0 text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function ReportesInner() {
  const ready = useDbReady();
  const atenciones = useDb((s) => s.atenciones);
  const citas = useDb((s) => s.citas);
  const pacientes = useDb((s) => s.pacientes);
  const psicologos = useDb((s) => s.psicologos);
  const servicios = useDb((s) => s.servicios);

  const [desde, setDesde] = React.useState(isoOffset(-30));
  const [hasta, setHasta] = React.useState(isoOffset(0));

  const inRango = React.useCallback((fecha: string) => fecha >= desde && fecha <= hasta, [desde, hasta]);

  const atnRango = React.useMemo(
    () => atenciones.filter((a) => !a.anulada && inRango(a.fecha)),
    [atenciones, inRango],
  );
  const citasRango = React.useMemo(
    () => citas.filter((c) => inRango(c.fecha) && c.estado !== "Cancelada"),
    [citas, inRango],
  );

  // Ingresos = pagos (por fecha del pago) en el rango.
  const pagosRango = React.useMemo(() => {
    const list: { fecha: string; monto: number }[] = [];
    for (const a of atenciones) {
      if (a.anulada) continue;
      for (const p of a.pagos) if (inRango(p.fecha)) list.push({ fecha: p.fecha, monto: p.monto });
    }
    return list;
  }, [atenciones, inRango]);

  const ingresos = pagosRango.reduce((s, p) => s + p.monto, 0);
  const atendidas = citasRango.filter((c) => c.estado === "Atendida").length;
  const faltas = citasRango.filter((c) => c.estado === "No asistió").length;
  const tasa = atendidas + faltas ? (atendidas / (atendidas + faltas)) * 100 : 0;
  const pacientesUnicos = new Set(atnRango.map((a) => a.pacienteId)).size;

  const serieIngresos = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pagosRango) map.set(p.fecha, (map.get(p.fecha) ?? 0) + p.monto);
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([fecha, value]) => ({ label: ddmm(fecha), value }));
  }, [pagosRango]);

  const porPsicologo = React.useMemo(() => {
    return psicologos
      .map((p) => {
        const suyas = atnRango.filter((a) => a.psicologoId === p.id);
        const ingreso = suyas.reduce((s, a) => s + atnPagado(a), 0);
        return { id: p.id, nombre: p.nombre, color: p.color, sesiones: suyas.length, ingreso };
      })
      .filter((x) => x.sesiones > 0)
      .sort((a, b) => b.ingreso - a.ingreso);
  }, [psicologos, atnRango]);
  const maxPsi = Math.max(1, ...porPsicologo.map((p) => p.ingreso));

  const porServicio = React.useMemo(() => {
    const map = new Map<string, { nombre: string; color: string; sesiones: number; ingreso: number }>();
    for (const a of atnRango) {
      for (const it of a.items) {
        const key = it.servicioId ?? it.paqueteId ?? it.nombre;
        const color = servicios.find((s) => s.id === it.servicioId)?.color ?? "#14a89c";
        const cur = map.get(key) ?? { nombre: it.nombre, color, sesiones: 0, ingreso: 0 };
        cur.sesiones += 1;
        cur.ingreso += it.monto;
        map.set(key, cur);
      }
    }
    return [...map.values()].filter((x) => x.ingreso > 0).sort((a, b) => b.ingreso - a.ingreso);
  }, [atnRango, servicios]);
  const maxSrv = Math.max(1, ...porServicio.map((s) => s.ingreso));

  function exportarDetalle() {
    const rows = atnRango
      .slice()
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
      .map((a) => ({
        fecha: a.fecha,
        paciente: pacienteNombre(pacientes.find((p) => p.id === a.pacienteId)),
        psicologo: psicologos.find((p) => p.id === a.psicologoId)?.nombre ?? "",
        items: a.items.map((i) => i.nombre).join(" / "),
        total: atnTotal(a),
        pagado: atnPagado(a),
        saldo: atnSaldo(a),
        estado: atnEstado(a),
      }));
    if (rows.length === 0) return;
    exportCSV(`atenciones_${desde}_a_${hasta}`, rows, {
      fecha: "Fecha", paciente: "Paciente", psicologo: "Psicólogo", items: "Ítems",
      total: "Total (S/)", pagado: "Pagado (S/)", saldo: "Saldo (S/)", estado: "Estado",
    });
  }

  if (!ready) {
    return <div className="mx-auto max-w-6xl space-y-6"><Skeleton className="h-40 w-full rounded-xl" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Reportes" description="Indicadores del centro por período">
        <Button variant="outline" onClick={exportarDetalle} disabled={atnRango.length === 0}>
          <Download className="h-4 w-4" />Exportar CSV
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3">
        <div><Label className="mb-1.5 block text-xs">Desde</Label><Input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className="w-44" /></div>
        <div><Label className="mb-1.5 block text-xs">Hasta</Label><Input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className="w-44" /></div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setDesde(isoOffset(-30)); setHasta(isoOffset(0)); }}>Últimos 30 días</Button>
          <Button variant="ghost" size="sm" onClick={() => { setDesde(isoOffset(-365)); setHasta(isoOffset(0)); }}>Último año</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard kpi={{ label: "Ingresos", value: formatPEN(ingresos), icon: TrendingUp, color: "#14a89c" }} />
        <KpiCard kpi={{ label: "Atenciones", value: String(atnRango.length), icon: BadgeCheck, color: "#2b83c2" }} />
        <KpiCard kpi={{ label: "Tasa de asistencia", value: formatPercent(tasa, 0), icon: CalendarCheck2, color: "#8b5cf6" }} />
        <KpiCard kpi={{ label: "Pacientes atendidos", value: String(pacientesUnicos), icon: Users, color: "#f4b21f" }} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ingresos por día</CardTitle></CardHeader>
        <CardContent>
          {serieIngresos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Sin ingresos en el período seleccionado.</p>
          ) : (
            <AreaTrend data={serieIngresos} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Producción por psicólogo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {porPsicologo.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Sin datos.</p> : porPsicologo.map((p) => <BarRow key={p.id} label={p.nombre} sub={`${p.sesiones} ses.`} value={p.ingreso} max={maxPsi} color={p.color} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Producción por servicio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {porServicio.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Sin datos.</p> : porServicio.map((s) => <BarRow key={s.nombre} label={s.nombre} sub={`${s.sesiones} ses.`} value={s.ingreso} max={maxSrv} color={s.color} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportesPage() {
  return (
    <RoleGuard roles={[1, 2]}>
      <ReportesInner />
    </RoleGuard>
  );
}
