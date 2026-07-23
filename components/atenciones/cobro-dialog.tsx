"use client";

import * as React from "react";
import { toast } from "sonner";
import { Banknote, CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { atnSaldo } from "@/lib/data/atenciones";
import { formatPEN } from "@/lib/format";
import { METODOS_PAGO, type Atencion, type MetodoPago } from "@/lib/data/types";

const ICONO: Record<MetodoPago, typeof Wallet> = {
  Efectivo: Banknote,
  Yape: Smartphone,
  Plin: Smartphone,
  Tarjeta: CreditCard,
  Transferencia: Landmark,
};

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

export function CobroDialog({
  open,
  onOpenChange,
  atencion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atencion?: Atencion;
}) {
  const pacientes = useDb((s) => s.pacientes);
  const agregarPago = useDb((s) => s.agregarPago);

  const saldo = atencion ? atnSaldo(atencion) : 0;
  const [monto, setMonto] = React.useState(saldo);
  const [metodo, setMetodo] = React.useState<MetodoPago>("Efectivo");

  if (!atencion) return null;
  const paciente = pacientes.find((p) => p.id === atencion.pacienteId);

  function confirmar() {
    if (!atencion) return;
    const m = Number(monto);
    if (!(m > 0)) return toast.error("Ingresa un monto válido");
    if (m > saldo) return toast.error("El abono no puede superar el saldo");
    agregarPago(atencion.id, { monto: m, metodo, tipo: "Cobro", fecha: hoyIso() });
    toast.success(`Abono registrado (${metodo})`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar abono</DialogTitle>
          <DialogDescription>Cobro parcial o total sobre el saldo pendiente.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-4">
          <p className="font-medium">{pacienteNombre(paciente)}</p>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saldo pendiente</span>
            <span className="font-heading text-lg font-bold text-brand">{formatPEN(saldo)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Monto a abonar (S/)</Label>
            <Input type="number" min={0} max={saldo} step="0.5" value={monto} onChange={(e) => setMonto(Number(e.target.value))} />
            <div className="mt-1.5 flex gap-2">
              <button type="button" className="text-xs font-medium text-brand hover:underline" onClick={() => setMonto(saldo)}>Saldo total</button>
              <button type="button" className="text-xs font-medium text-muted-foreground hover:underline" onClick={() => setMonto(Math.round((saldo / 2) * 100) / 100)}>Mitad</button>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Estado tras el abono</Label>
            <div className="rounded-lg border px-3 py-2 text-sm">
              {Number(monto) >= saldo ? (
                <span className="text-success">Quedará saldada</span>
              ) : (
                <span className="text-warning">Saldo: {formatPEN(Math.max(0, saldo - Number(monto)))}</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Método de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {METODOS_PAGO.map((m) => {
              const Icon = ICONO[m];
              const activo = metodo === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetodo(m)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors",
                    activo ? "border-brand bg-brand/10 text-brand" : "hover:bg-accent",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-brand-gradient text-white" onClick={confirmar}>Confirmar abono</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
