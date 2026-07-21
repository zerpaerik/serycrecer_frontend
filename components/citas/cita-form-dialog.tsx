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
import { useDb, pacienteNombre } from "@/lib/data/store";
import { formatPEN } from "@/lib/format";
import type { Cita } from "@/lib/data/types";

const schema = z.object({
  pacienteId: z.string().min(1, "Selecciona un paciente"),
  psicologoId: z.string().min(1, "Selecciona un psicólogo"),
  servicioId: z.string().min(1, "Selecciona un servicio"),
  fecha: z.string().min(1, "Requerido"),
  hora: z.string().min(1, "Requerido"),
  notas: z.string(),
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

export function CitaFormDialog({
  open,
  onOpenChange,
  cita,
  fechaInicial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cita?: Cita;
  /** Fecha por defecto para una cita nueva (ISO YYYY-MM-DD). */
  fechaInicial?: string;
}) {
  const pacientes = useDb((s) => s.pacientes);
  const psicologos = useDb((s) => s.psicologos);
  const servicios = useDb((s) => s.servicios);
  const addCita = useDb((s) => s.addCita);
  const updateCita = useDb((s) => s.updateCita);
  const isEdit = !!cita;

  const defaults = React.useCallback(
    (): Values => ({
      pacienteId: cita?.pacienteId ?? "",
      psicologoId: cita?.psicologoId ?? "",
      servicioId: cita?.servicioId ?? "",
      fecha: cita?.fecha ?? fechaInicial ?? new Date().toISOString().slice(0, 10),
      hora: cita?.hora ?? "09:00",
      notas: cita?.notas ?? "",
    }),
    [cita, fechaInicial],
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
    if (isEdit && cita) {
      updateCita(cita.id, v);
      toast.success("Cita actualizada");
    } else {
      addCita({ ...v, estado: "Agendada" });
      toast.success("Cita agendada");
    }
    onOpenChange(false);
  }

  const pacientesActivos = pacientes.filter((p) => p.estado === "Activo");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cita" : "Nueva cita"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Actualiza los datos de la cita." : "Agenda una nueva cita."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Paciente" error={errors.pacienteId?.message}>
            <Controller
              control={control}
              name="pacienteId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientesActivos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {pacienteNombre(p)} · {p.numDoc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Psicólogo" error={errors.psicologoId?.message}>
            <Controller
              control={control}
              name="psicologoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un psicólogo" />
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

          <Field label="Servicio" error={errors.servicioId?.message}>
            <Controller
              control={control}
              name="servicioId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicios.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre} · {formatPEN(s.precio)} · {s.duracionMin} min
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

          <Field label="Notas (opcional)">
            <Textarea {...register("notas")} rows={2} placeholder="Observaciones de la cita" />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-gradient text-white">
              {isEdit ? "Guardar cambios" : "Agendar cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
