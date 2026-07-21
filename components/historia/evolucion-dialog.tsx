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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDb } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/store";
import type { EvolucionSesion } from "@/lib/data/types";

const schema = z.object({
  psicologoId: z.string().min(1, "Selecciona un psicólogo"),
  fecha: z.string().min(1, "Requerido"),
  hora: z.string().min(1, "Requerido"),
  motivo: z.string(),
  observaciones: z.string().min(1, "Registra las observaciones de la sesión"),
  acuerdos: z.string(),
});
type Values = z.infer<typeof schema>;

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function EvolucionDialog({
  open,
  onOpenChange,
  pacienteId,
  evolucion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  evolucion?: EvolucionSesion;
}) {
  const psicologos = useDb((s) => s.psicologos);
  const addEvolucion = useDb((s) => s.addEvolucion);
  const updateEvolucion = useDb((s) => s.updateEvolucion);
  const sessionName = useAuth((s) => s.session?.user.name);
  const isEdit = !!evolucion;

  // Preselecciona al psicólogo de la sesión si su nombre coincide con un profesional.
  const defaultPsicologo = React.useMemo(
    () => psicologos.find((p) => p.nombre === sessionName)?.id ?? psicologos[0]?.id ?? "",
    [psicologos, sessionName],
  );

  const defaults = React.useCallback(
    (): Values => ({
      psicologoId: evolucion?.psicologoId ?? defaultPsicologo,
      fecha: evolucion?.fecha ?? new Date().toISOString().slice(0, 10),
      hora: evolucion?.hora ?? "09:00",
      motivo: evolucion?.motivo ?? "",
      observaciones: evolucion?.observaciones ?? "",
      acuerdos: evolucion?.acuerdos ?? "",
    }),
    [evolucion, defaultPsicologo],
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
    if (isEdit && evolucion) {
      updateEvolucion(evolucion.id, v);
      toast.success("Evolución actualizada");
    } else {
      addEvolucion({ ...v, pacienteId });
      toast.success("Evolución registrada");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar evolución" : "Nueva evolución"}</DialogTitle>
          <DialogDescription>Registra la evolución de la sesión.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Psicólogo" error={errors.psicologoId?.message}>
            <Controller
              control={control}
              name="psicologoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Psicólogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {psicologos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha" error={errors.fecha?.message}>
              <Input type="date" {...register("fecha")} />
            </Field>
            <Field label="Hora" error={errors.hora?.message}>
              <Input type="time" step={300} {...register("hora")} />
            </Field>
          </div>

          <Field label="Motivo (opcional)">
            <Input {...register("motivo")} placeholder="Motivo o foco de la sesión" />
          </Field>

          <Field label="Observaciones" error={errors.observaciones?.message}>
            <Textarea
              {...register("observaciones")}
              rows={4}
              placeholder="Desarrollo de la sesión, evolución del paciente…"
            />
          </Field>

          <Field label="Acuerdos / tareas (opcional)">
            <Textarea {...register("acuerdos")} rows={2} placeholder="Tareas o acuerdos para la próxima sesión" />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-gradient text-white">
              {isEdit ? "Guardar cambios" : "Registrar evolución"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
