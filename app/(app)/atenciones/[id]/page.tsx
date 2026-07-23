"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Ban, HandCoins, Package, Stethoscope } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EstadoPagoBadge } from "@/components/shared/status-badge";
import { CobroDialog } from "@/components/atenciones/cobro-dialog";
import { AnularDialog } from "@/components/atenciones/anular-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { atnEstado, atnPagado, atnSaldo, atnTotal } from "@/lib/data/atenciones";
import { formatDate, formatPEN } from "@/lib/format";

export default function AtencionDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ready = useDbReady();

  const atencion = useDb((s) => s.atenciones.find((a) => a.id === params.id));
  const pacientes = useDb((s) => s.pacientes);
  const psicologos = useDb((s) => s.psicologos);
  const anularAtencion = useDb((s) => s.anularAtencion);

  const [cobroOpen, setCobroOpen] = React.useState(false);
  const [anularOpen, setAnularOpen] = React.useState(false);

  if (ready && !atencion) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-muted-foreground">Atención no encontrada.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/atenciones"><ArrowLeft className="h-4 w-4" />Volver</Link>
        </Button>
      </div>
    );
  }
  if (!atencion) return null;

  const paciente = pacientes.find((p) => p.id === atencion.pacienteId);
  const psi = psicologos.find((p) => p.id === atencion.psicologoId);
  const total = atnTotal(atencion);
  const pagado = atnPagado(atencion);
  const saldo = atnSaldo(atencion);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/atenciones")} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Atenciones</span>
      </div>

      <PageHeader
        title={pacienteNombre(paciente)}
        description={`${formatDate(atencion.fecha)}${atencion.hora ? " · " + atencion.hora : ""} · ${psi?.nombre ?? "—"}`}
      >
        {!atencion.anulada && (
          <div className="flex gap-2">
            {saldo > 0 && (
              <Button className="bg-brand-gradient text-white" onClick={() => setCobroOpen(true)}>
                <HandCoins className="h-4 w-4" />Abonar
              </Button>
            )}
            <Button variant="outline" className="text-destructive" onClick={() => setAnularOpen(true)}>
              <Ban className="h-4 w-4" />Anular
            </Button>
          </div>
        )}
      </PageHeader>

      {atencion.anulada && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="font-medium">Atención anulada.</span> {atencion.motivoAnulacion}
        </div>
      )}

      {/* Ítems */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ítems</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {atencion.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 px-6 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                  {it.tipo === "Paquete" ? <Package className="h-4 w-4 text-brand" /> : <Stethoscope className="h-4 w-4 text-brand" />}
                </span>
                <span className="flex-1 text-sm">{it.nombre}</span>
                <span className="text-sm font-medium tabular-nums">{formatPEN(it.monto)}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 border-t bg-muted/30 px-6 py-4 text-center">
            <div><p className="text-xs text-muted-foreground">Total</p><p className="font-heading text-lg font-bold">{formatPEN(total)}</p></div>
            <div><p className="text-xs text-muted-foreground">Pagado</p><p className="font-heading text-lg font-bold text-success">{formatPEN(pagado)}</p></div>
            <div><p className="text-xs text-muted-foreground">Saldo</p><p className="font-heading text-lg font-bold text-warning">{formatPEN(saldo)}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Pagos */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Pagos</CardTitle>
          <EstadoPagoBadge estado={atnEstado(atencion)} />
        </CardHeader>
        <CardContent className="p-0">
          {atencion.pagos.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">Esta atención está al crédito (sin pagos).</p>
          ) : (
            <div className="divide-y">
              {atencion.pagos.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-3">
                  <span className="w-24 shrink-0 text-sm text-muted-foreground">{formatDate(p.fecha)}</span>
                  <span className="flex-1 text-sm">{p.tipo} · {p.metodo}</span>
                  <span className="text-sm font-medium tabular-nums">{formatPEN(p.monto)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {atencion.observaciones && (
        <Card>
          <CardHeader><CardTitle className="text-base">Observaciones</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{atencion.observaciones}</p></CardContent>
        </Card>
      )}

      <CobroDialog key={atencion.id + pagado} open={cobroOpen} onOpenChange={setCobroOpen} atencion={atencion} />
      <AnularDialog
        open={anularOpen}
        onOpenChange={setAnularOpen}
        onConfirm={(motivo) => { anularAtencion(atencion.id, motivo); toast.success("Atención anulada"); setAnularOpen(false); }}
      />
    </div>
  );
}
