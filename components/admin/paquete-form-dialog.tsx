"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDb } from "@/lib/data/store";
import type { Paquete } from "@/lib/data/types";

const COLORES = ["#14a89c", "#2b83c2", "#4fa64a", "#f4b21f", "#e8774a", "#8b5cf6"];

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  sesiones: z.number({ error: "N.º inválido" }).min(1, "Mínimo 1 sesión"),
  precio: z.number({ error: "Precio inválido" }).min(0, "Precio inválido"),
  servicioId: z.string(),
  color: z.string(),
});
type Values = z.infer<typeof schema>;

export function PaqueteFormDialog({
  open,
  onOpenChange,
  paquete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paquete?: Paquete;
}) {
  const servicios = useDb((s) => s.servicios);
  const addPaquete = useDb((s) => s.addPaquete);
  const updatePaquete = useDb((s) => s.updatePaquete);
  const isEdit = !!paquete;

  const defaults = React.useCallback(
    (): Values => ({
      nombre: paquete?.nombre ?? "",
      sesiones: paquete?.sesiones ?? 4,
      precio: paquete?.precio ?? 280,
      servicioId: paquete?.servicioId ?? "none",
      color: paquete?.color ?? COLORES[0],
    }),
    [paquete],
  );

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults(),
  });

  React.useEffect(() => {
    if (open) reset(defaults());
  }, [open, defaults, reset]);

  function onSubmit(v: Values) {
    const payload = {
      nombre: v.nombre,
      sesiones: v.sesiones,
      precio: v.precio,
      servicioId: v.servicioId === "none" ? undefined : v.servicioId,
      color: v.color,
    };
    if (isEdit && paquete) {
      updatePaquete(paquete.id, payload);
      toast.success("Paquete actualizado");
    } else {
      addPaquete(payload);
      toast.success("Paquete creado");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar paquete" : "Nuevo paquete"}</DialogTitle>
          <DialogDescription>Paquete de sesiones prepagadas.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label className="mb-1.5 block">Nombre</Label>
            <Input {...register("nombre")} placeholder="Paquete 4 sesiones · Terapia individual" />
            {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">N.º de sesiones</Label>
              <Input type="number" min={1} step={1} {...register("sesiones", { valueAsNumber: true })} />
              {errors.sesiones && <p className="mt-1 text-xs text-destructive">{errors.sesiones.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Precio total (S/)</Label>
              <Input type="number" min={0} step="0.5" {...register("precio", { valueAsNumber: true })} />
              {errors.precio && <p className="mt-1 text-xs text-destructive">{errors.precio.message}</p>}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Servicio asociado (opcional)</Label>
            <Controller
              control={control}
              name="servicioId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {servicios.map((s) => (<SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label className="mb-2 block">Color</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <div className="flex gap-2">
                  {COLORES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => field.onChange(c)}
                      className={cn("h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all", field.value === c && "ring-2 ring-foreground")}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-brand-gradient text-white">{isEdit ? "Guardar cambios" : "Crear paquete"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
