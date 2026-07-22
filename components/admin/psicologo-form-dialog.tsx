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
import type { Psicologo } from "@/lib/data/types";

const COLORES = ["#0d9488", "#0ea5e9", "#8b5cf6", "#f59e0b", "#f43f5e", "#14b8a6"];

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  especialidad: z.string().min(1, "Requerido"),
  email: z.string().email("Correo no válido").or(z.literal("")),
  telefono: z.string(),
  horario: z.string(),
  color: z.string(),
});
type Values = z.infer<typeof schema>;

export function PsicologoFormDialog({
  open,
  onOpenChange,
  psicologo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  psicologo?: Psicologo;
}) {
  const addPsicologo = useDb((s) => s.addPsicologo);
  const updatePsicologo = useDb((s) => s.updatePsicologo);
  const isEdit = !!psicologo;

  const defaults = React.useCallback(
    (): Values => ({
      nombre: psicologo?.nombre ?? "",
      especialidad: psicologo?.especialidad ?? "",
      email: psicologo?.email ?? "",
      telefono: psicologo?.telefono ?? "",
      horario: psicologo?.horario ?? "",
      color: psicologo?.color ?? COLORES[0],
    }),
    [psicologo],
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
    if (isEdit && psicologo) {
      updatePsicologo(psicologo.id, v);
      toast.success("Psicólogo actualizado");
    } else {
      addPsicologo(v);
      toast.success("Psicólogo agregado");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar psicólogo" : "Nuevo psicólogo"}</DialogTitle>
          <DialogDescription>Datos del profesional.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label className="mb-1.5 block">Nombre</Label>
            <Input {...register("nombre")} placeholder="Lic. Nombre Apellido" />
            {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label className="mb-1.5 block">Especialidad</Label>
            <Input {...register("especialidad")} placeholder="Psicología clínica" />
            {errors.especialidad && <p className="mt-1 text-xs text-destructive">{errors.especialidad.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Correo (opcional)</Label>
              <Input {...register("email")} placeholder="correo@serycrecer.pe" />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Teléfono (opcional)</Label>
              <Input {...register("telefono")} placeholder="987654321" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Horario (opcional)</Label>
            <Input {...register("horario")} placeholder="Lun a Vie · 9:00–18:00" />
          </div>
          <div>
            <Label className="mb-2 block">Color en agenda</Label>
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
              {isEdit ? "Guardar cambios" : "Agregar psicólogo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
