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
import { cn } from "@/lib/utils";
import { useDb } from "@/lib/data/store";
import type { Servicio } from "@/lib/data/types";

const COLORES = ["#0d9488", "#0ea5e9", "#8b5cf6", "#f59e0b", "#f43f5e", "#14b8a6"];

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  duracionMin: z.number({ error: "Duración no válida" }).min(5, "Mínimo 5 minutos"),
  precio: z.number({ error: "Precio no válido" }).min(0, "Precio no válido"),
  color: z.string(),
});
type Values = z.infer<typeof schema>;

export function ServicioFormDialog({
  open,
  onOpenChange,
  servicio,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicio?: Servicio;
}) {
  const addServicio = useDb((s) => s.addServicio);
  const updateServicio = useDb((s) => s.updateServicio);
  const isEdit = !!servicio;

  const defaults = React.useCallback(
    (): Values => ({
      nombre: servicio?.nombre ?? "",
      duracionMin: servicio?.duracionMin ?? 50,
      precio: servicio?.precio ?? 80,
      color: servicio?.color ?? COLORES[0],
    }),
    [servicio],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults() });

  React.useEffect(() => {
    if (open) reset(defaults());
  }, [open, defaults, reset]);

  function onSubmit(v: Values) {
    if (isEdit && servicio) {
      updateServicio(servicio.id, v);
      toast.success("Servicio actualizado");
    } else {
      addServicio(v);
      toast.success("Servicio agregado");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          <DialogDescription>Servicio y tarifa de sesión.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label className="mb-1.5 block">Nombre</Label>
            <Input {...register("nombre")} placeholder="Terapia individual" />
            {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Duración (min)</Label>
              <Input type="number" min={5} step={5} {...register("duracionMin", { valueAsNumber: true })} />
              {errors.duracionMin && <p className="mt-1 text-xs text-destructive">{errors.duracionMin.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Precio (S/)</Label>
              <Input type="number" min={0} step="0.5" {...register("precio", { valueAsNumber: true })} />
              {errors.precio && <p className="mt-1 text-xs text-destructive">{errors.precio.message}</p>}
            </div>
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
                      className={cn(
                        "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all",
                        field.value === c && "ring-2 ring-foreground",
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-gradient text-white">
              {isEdit ? "Guardar cambios" : "Agregar servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
