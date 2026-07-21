"use client";

import { Clock } from "lucide-react";
import { useAuth } from "@/lib/auth/store";
import { getRole } from "@/lib/auth/roles";
import { dashboardForRole } from "@/lib/data/dashboard";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AreaTrend, DonutBreakdown } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ESTADO_VARIANT: Record<string, string> = {
  Confirmada: "bg-success/12 text-success",
  Pendiente: "bg-warning/15 text-warning",
  "En espera": "bg-info/12 text-info",
};

/** Primer nombre, ignorando títulos profesionales (Lic., Dr., Dra., Mg., Ps.). */
const TITULOS = new Set(["lic.", "lic", "dr.", "dra.", "mg.", "ps.", "psic.", "lic.ª"]);
function nombreDePila(full: string): string {
  const partes = full.trim().split(/\s+/).filter(Boolean);
  const sinTitulo = partes.filter((p) => !TITULOS.has(p.toLowerCase()));
  return (sinTitulo[0] ?? partes[0] ?? "").trim();
}

export default function DashboardPage() {
  const session = useAuth((s) => s.session);
  const roleId = session?.roleId ?? 1;
  const role = getRole(roleId);
  const data = dashboardForRole(roleId);
  const firstName = nombreDePila(session?.user.name ?? "");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Hola, {firstName} 👋
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{data.saludo}</p>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 border-brand/30 text-brand"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: role.color }}
          />
          {role.name}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">{data.tendenciaTitulo}</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaTrend data={data.tendencia} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{data.distribucionTitulo}</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutBreakdown data={data.distribucion} />
          </CardContent>
        </Card>
      </div>

      {/* Próximas citas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-brand" />
            Próximas citas de hoy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {data.citas.map((c) => (
              <div
                key={c.hora + c.paciente}
                className="flex items-center gap-4 px-6 py-3"
              >
                <div className="w-14 shrink-0 font-heading text-sm font-bold tabular-nums text-brand">
                  {c.hora}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.paciente}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.servicio} · {c.psicologo}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ESTADO_VARIANT[c.estado] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.estado}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
