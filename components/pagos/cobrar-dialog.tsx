"use client";

import * as React from "react";
import { toast } from "sonner";
import { Banknote, CreditCard, Smartphone, Landmark, Wallet } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { formatPEN } from "@/lib/format";
import { METODOS_PAGO, type Atencion, type MetodoPago } from "@/lib/data/types";

const ICONO: Record<MetodoPago, typeof Wallet> = {
  Efectivo: Banknote,
  Yape: Smartphone,
  Plin: Smartphone,
  Tarjeta: CreditCard,
  Transferencia: Landmark,
};

export function CobrarDialog({
  open,
  onOpenChange,
  atencion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atencion?: Atencion;
}) {
  const pacientes = useDb((s) => s.pacientes);
  const servicios = useDb((s) => s.servicios);
  const registrarCobro = useDb((s) => s.registrarCobro);
  // El método arranca en "Efectivo" en cada apertura gracias al remontaje por
  // `key` en el componente padre.
  const [metodo, setMetodo] = React.useState<MetodoPago>("Efectivo");

  if (!atencion) return null;

  const paciente = pacientes.find((p) => p.id === atencion.pacienteId);
  const servicio = servicios.find((s) => s.id === atencion.servicioId);

  function confirmar() {
    if (!atencion) return;
    registrarCobro(atencion.id, metodo);
    toast.success(`Cobro registrado (${metodo})`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar cobro</DialogTitle>
          <DialogDescription>Confirma el pago de la sesión.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-4">
          <p className="font-medium">{pacienteNombre(paciente)}</p>
          <p className="text-sm text-muted-foreground">{servicio?.nombre ?? "—"}</p>
          <p className="mt-2 font-heading text-2xl font-bold text-brand">
            {formatPEN(atencion.monto)}
          </p>
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
                    activo
                      ? "border-brand bg-brand/10 text-brand"
                      : "hover:bg-accent",
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="bg-brand-gradient text-white" onClick={confirmar}>
            Confirmar cobro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
