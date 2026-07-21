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
import type { Atencion, Cita } from "@/lib/data/types";

const schema = z.object({
  pacienteId: z.string().min(1, "Selecciona un paciente"),
  psicologoId: z.string().min(1, "Selecciona un psicólogo"),
  servicioId: z.string().min(1, "Selecciona un servicio"),
  fecha: z.string().min(1, "Requerido"),
  hora: z.string().min(1, "Requerido"),
  monto: z
    .number({ error: "Monto no válido" })
    .min(0, "Monto no válido"),
  estadoPago: z.enum(["Pagado", "Pendiente"]),
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

export function AtencionFormDialog({
  open,
  onOpenChange,
  cita,
  atencion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cita de origen (registrar atención desde la agenda). */
  cita?: Cita;
  /** Atención a editar. */
  atencion?: Atencion;
}) {
  const pacientes = useDb((s) => s.pacientes);
  const psicologos = useDb((s) => s.psicologos);
  const servicios = useDb((s) => s.servicios);
  const addAtencion = useDb((s) => s.addAtencion);
  const updateAtencion = useDb((s) => s.updateAtencion);
  const setEstadoCita = useDb((s) => s.setEstadoCita);
  const isEdit = !!atencion;

  const precioDe = React.useCallback(
    (servicioId: string) => servicios.find((s) => s.id === servicioId)?.precio ?? 0,
    [servicios],
  );

  const defaults = React.useCallback((): Values => {
    const base = atencion ?? cita;
    const servicioId = base?.servicioId ?? "";
    return {
      pacienteId: base?.pacienteId ?? "",
      psicologoId: base?.psicologoId ?? "",
      servicioId,
      fecha: base?.fecha ?? new Date().toISOString().slice(0, 10),
      hora: base?.hora ?? "09:00",
      monto: atencion?.monto ?? precioDe(servicioId),
      estadoPago: atencion?.estadoPago ?? "Pagado",
      notas: atencion?.notas ?? "",
    };
  }, [atencion, cita, precioDe]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults() });

  React.useEffect(() => {
    if (open) reset(defaults());
  }, [open, defaults, reset]);

  function onSubmit(v: Values) {
    if (isEdit && atencion) {
      updateAtencion(atencion.id, v);
      toast.success("Atención actualizada");
    } else {
      addAtencion({ ...v, citaId: cita?.id });
      if (cita) setEstadoCita(cita.id, "Atendida");
      toast.success("Atención registrada");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar atención" : "Registrar atención"}
          </DialogTitle>
          <DialogDescription>
            Registra la sesión realizada y su estado de pago.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Paciente" error={errors.pacienteId?.message}>
            <Controller
              control={control}
              name="pacienteId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!cita}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {pacienteNombre(p)} · {p.numDoc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Servicio" error={errors.servicioId?.message}>
              <Controller
                control={control}
                name="servicioId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("monto", precioDe(v));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha" error={errors.fecha?.message}>
              <Input type="date" {...register("fecha")} />
            </Field>
            <Field label="Hora" error={errors.hora?.message}>
              <Input type="time" step={300} {...register("hora")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Monto (S/)" error={errors.monto?.message}>
              <Input
                type="number"
                min={0}
                step="0.5"
                {...register("monto", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Estado de pago">
              <Controller
                control={control}
                name="estadoPago"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pagado">Pagado</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field label="Notas de la sesión (opcional)">
            <Textarea {...register("notas")} rows={3} placeholder="Resumen breve de la sesión" />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-gradient text-white">
              {isEdit ? "Guardar cambios" : "Registrar atención"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
