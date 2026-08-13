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
import type { Atencion } from "@/lib/data/types";

export function AtencionEditDialog({
  open,
  onOpenChange,
  atencion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atencion: Atencion;
}) {
  const psicologos = useDb((s) => s.psicologos);
  const updateAtencion = useDb((s) => s.updateAtencion);

  const [form, setForm] = React.useState({
    fecha: atencion.fecha,
    hora: atencion.hora ?? "",
    psicologoId: atencion.psicologoId,
    observaciones: atencion.observaciones ?? "",
  });
  const [guardando, setGuardando] = React.useState(false);

  async function guardar() {
    setGuardando(true);
    try {
      await updateAtencion(atencion.id, {
        fecha: form.fecha,
        hora: form.hora || undefined,
        psicologoId: form.psicologoId,
        observaciones: form.observaciones,
      });
      toast.success("Atención actualizada");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar atención</DialogTitle>
          <DialogDescription>
            Datos de la atención. Los ítems y pagos se gestionan con Abonar / Anular.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Fecha</Label>
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Hora</Label>
              <Input type="time" step={300} value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Psicólogo</Label>
            <Select value={form.psicologoId} onValueChange={(v) => setForm({ ...form, psicologoId: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {psicologos.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Observaciones</Label>
            <Textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-brand-gradient text-white" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
