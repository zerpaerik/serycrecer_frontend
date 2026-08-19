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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDb } from "@/lib/data/store";
import { CATEGORIAS_GASTO, METODOS_PAGO, type Gasto, type MetodoPago } from "@/lib/data/types";

function hoyIso() {
  return new Date().toLocaleDateString("en-CA");
}

export function GastoDialog({
  open,
  onOpenChange,
  gasto,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gasto?: Gasto;
}) {
  const addGasto = useDb((s) => s.addGasto);
  const updateGasto = useDb((s) => s.updateGasto);
  const editando = !!gasto;

  const [form, setForm] = React.useState({
    fecha: gasto?.fecha ?? hoyIso(),
    monto: gasto ? String(gasto.monto) : "",
    categoria: gasto?.categoria ?? "Operativo",
    metodo: (gasto?.metodo ?? "Efectivo") as MetodoPago,
    descripcion: gasto?.descripcion ?? "",
  });
  const [guardando, setGuardando] = React.useState(false);

  async function guardar() {
    const monto = Number(form.monto);
    if (!monto || monto <= 0) return toast.error("Ingresa un monto válido");
    setGuardando(true);
    try {
      const data = {
        fecha: form.fecha,
        monto,
        categoria: form.categoria,
        metodo: form.metodo,
        descripcion: form.descripcion || undefined,
      };
      if (editando && gasto) await updateGasto(gasto.id, data);
      else await addGasto(data);
      toast.success(editando ? "Gasto actualizado" : "Gasto registrado");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar gasto" : "Registrar gasto"}</DialogTitle>
          <DialogDescription>Los gastos se descuentan de la caja del día.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Fecha</Label>
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Monto (S/)</Label>
              <Input type="number" min={0} step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Categoría</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_GASTO.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Método de pago</Label>
              <Select value={form.metodo} onValueChange={(v) => setForm({ ...form, metodo: v as MetodoPago })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Descripción</Label>
            <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} placeholder="Detalle del gasto…" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-brand-gradient text-white" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
