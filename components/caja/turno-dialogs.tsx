"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDb } from "@/lib/data/store";
import { formatPEN } from "@/lib/format";
import type { TurnoCaja } from "@/lib/data/types";

/** Apertura de turno: nombre y efectivo con el que arranca la caja. */
export function AbrirTurnoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const abrirTurno = useDb((s) => s.abrirTurno);
  const [nombre, setNombre] = React.useState("");
  const [montoInicial, setMontoInicial] = React.useState("0");
  const [guardando, setGuardando] = React.useState(false);

  async function abrir() {
    setGuardando(true);
    try {
      const t = await abrirTurno({
        nombre: nombre.trim() || undefined,
        montoInicial: Number(montoInicial) || 0,
      });
      toast.success(`${t.nombre} abierto`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo abrir la caja");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir caja</DialogTitle>
          <DialogDescription>
            Los cobros y gastos que registres quedarán dentro de este turno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Nombre del turno</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Turno mañana (opcional)"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Efectivo inicial (S/)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Con cuánto sencillo empieza la caja este turno.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-brand-gradient text-white" onClick={abrir} disabled={guardando}>
            {guardando ? "Abriendo…" : "Abrir caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Cierre de turno: se cuenta el efectivo y se compara con lo esperado. */
export function CerrarTurnoDialog({
  open,
  onOpenChange,
  turno,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turno: TurnoCaja;
}) {
  const cerrarTurno = useDb((s) => s.cerrarTurno);
  const [montoContado, setMontoContado] = React.useState("");
  const [observaciones, setObservaciones] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);

  const contado = montoContado === "" ? null : Number(montoContado);
  const diferencia = contado == null ? null : contado - turno.esperadoEfectivo;

  async function cerrar() {
    setGuardando(true);
    try {
      await cerrarTurno(turno.id, {
        montoContado: contado ?? undefined,
        observaciones: observaciones.trim() || undefined,
      });
      toast.success(`${turno.nombre} cerrado`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cerrar la caja");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cerrar {turno.nombre}</DialogTitle>
          <DialogDescription>
            Cuenta el efectivo en caja y compáralo con lo esperado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cuadre del efectivo */}
          <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
            <Linea label="Efectivo inicial" value={turno.montoInicial} />
            <Linea label="+ Cobros en efectivo" value={turno.efectivoCobrado} />
            <Linea label="− Gastos en efectivo" value={-turno.efectivoGastado} />
            <div className="mt-1 flex items-center justify-between border-t pt-1.5 font-semibold">
              <span>Efectivo esperado</span>
              <span className="tabular-nums">{formatPEN(turno.esperadoEfectivo)}</span>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Efectivo contado (S/)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={montoContado}
              onChange={(e) => setMontoContado(e.target.value)}
              placeholder={String(turno.esperadoEfectivo)}
            />
            {diferencia !== null && diferencia !== 0 && (
              <p className={`mt-1 text-xs font-medium ${diferencia < 0 ? "text-destructive" : "text-warning"}`}>
                {diferencia < 0 ? "Faltante" : "Sobrante"} de {formatPEN(Math.abs(diferencia))}
              </p>
            )}
            {diferencia === 0 && <p className="mt-1 text-xs font-medium text-success">La caja cuadra.</p>}
          </div>

          <div>
            <Label className="mb-1.5 block">Observaciones</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Notas del cierre (opcional)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-brand-gradient text-white" onClick={cerrar} disabled={guardando}>
            {guardando ? "Cerrando…" : "Cerrar caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Linea({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{formatPEN(value)}</span>
    </div>
  );
}
