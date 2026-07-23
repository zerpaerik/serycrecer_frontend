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
import type { Paciente } from "@/lib/data/types";

const schema = z.object({
  tipoDoc: z.enum(["DNI", "CE", "Pasaporte"]),
  numDoc: z.string().min(6, "Documento no válido"),
  nombres: z.string().min(1, "Requerido"),
  apellidos: z.string().min(1, "Requerido"),
  sexo: z.enum(["Femenino", "Masculino", "Otro"]),
  fechaNacimiento: z.string().min(1, "Requerido"),
  telefono: z.string().min(6, "Teléfono no válido"),
  email: z.string().email("Correo no válido").or(z.literal("")),
  direccion: z.string(),
  contactoNombre: z.string(),
  contactoTelefono: z.string(),
  motivoConsulta: z.string(),
  estado: z.enum(["Activo", "Inactivo"]),
});
type Values = z.infer<typeof schema>;

function toValues(p?: Paciente): Values {
  return {
    tipoDoc: p?.tipoDoc ?? "DNI",
    numDoc: p?.numDoc ?? "",
    nombres: p?.nombres ?? "",
    apellidos: p?.apellidos ?? "",
    sexo: p?.sexo ?? "Femenino",
    fechaNacimiento: p?.fechaNacimiento ?? "",
    telefono: p?.telefono ?? "",
    email: p?.email ?? "",
    direccion: p?.direccion ?? "",
    contactoNombre: p?.contactoNombre ?? "",
    contactoTelefono: p?.contactoTelefono ?? "",
    motivoConsulta: p?.motivoConsulta ?? "",
    estado: p?.estado ?? "Activo",
  };
}

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

export function PacienteFormDialog({
  open,
  onOpenChange,
  paciente,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente?: Paciente;
  onSaved?: (id: string) => void;
}) {
  const addPaciente = useDb((s) => s.addPaciente);
  const updatePaciente = useDb((s) => s.updatePaciente);
  const isEdit = !!paciente;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(paciente),
  });

  // Reinicia el formulario cuando cambia el paciente o se abre el diálogo.
  React.useEffect(() => {
    if (open) reset(toValues(paciente));
  }, [open, paciente, reset]);

  async function onSubmit(v: Values) {
    try {
      if (isEdit && paciente) {
        await updatePaciente(paciente.id, v);
        toast.success("Paciente actualizado");
        onSaved?.(paciente.id);
      } else {
        const nuevo = await addPaciente(v);
        toast.success("Paciente registrado");
        onSaved?.(nuevo.id);
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar paciente" : "Nuevo paciente"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del paciente."
              : "Registra los datos del nuevo paciente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de documento">
              <Controller
                control={control}
                name="tipoDoc"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="CE">Carné de extranjería</SelectItem>
                      <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="N° de documento" error={errors.numDoc?.message}>
              <Input {...register("numDoc")} placeholder="45872103" />
            </Field>

            <Field label="Nombres" error={errors.nombres?.message}>
              <Input {...register("nombres")} placeholder="Lucía" />
            </Field>
            <Field label="Apellidos" error={errors.apellidos?.message}>
              <Input {...register("apellidos")} placeholder="Vega Ramírez" />
            </Field>

            <Field label="Sexo">
              <Controller
                control={control}
                name="sexo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Fecha de nacimiento" error={errors.fechaNacimiento?.message}>
              <Input type="date" {...register("fechaNacimiento")} />
            </Field>

            <Field label="Teléfono" error={errors.telefono?.message}>
              <Input {...register("telefono")} placeholder="987654321" />
            </Field>
            <Field label="Correo (opcional)" error={errors.email?.message}>
              <Input {...register("email")} placeholder="correo@ejemplo.com" />
            </Field>

            <Field label="Dirección (opcional)" className="sm:col-span-2">
              <Input {...register("direccion")} placeholder="Av. Arequipa 1234, Lince" />
            </Field>

            <Field label="Contacto de emergencia (opcional)">
              <Input {...register("contactoNombre")} placeholder="Nombre" />
            </Field>
            <Field label="Teléfono de emergencia (opcional)">
              <Input {...register("contactoTelefono")} placeholder="987000111" />
            </Field>

            <Field label="Motivo de consulta (opcional)" className="sm:col-span-2">
              <Textarea
                {...register("motivoConsulta")}
                placeholder="Breve descripción del motivo de consulta"
                rows={3}
              />
            </Field>

            <Field label="Estado">
              <Controller
                control={control}
                name="estado"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-gradient text-white">
              {isEdit ? "Guardar cambios" : "Registrar paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
