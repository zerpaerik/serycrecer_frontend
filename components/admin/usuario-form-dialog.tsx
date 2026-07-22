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
import { useDb } from "@/lib/data/store";
import { ROLES, type RoleId } from "@/lib/auth/roles";
import type { Usuario } from "@/lib/data/types";

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  email: z.string().email("Correo no válido"),
  roleId: z.string().min(1, "Selecciona un rol"),
  estado: z.enum(["Activo", "Inactivo"]),
});
type Values = z.infer<typeof schema>;

export function UsuarioFormDialog({
  open,
  onOpenChange,
  usuario,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario;
}) {
  const addUsuario = useDb((s) => s.addUsuario);
  const updateUsuario = useDb((s) => s.updateUsuario);
  const isEdit = !!usuario;

  const defaults = React.useCallback(
    (): Values => ({
      nombre: usuario?.nombre ?? "",
      email: usuario?.email ?? "",
      roleId: String(usuario?.roleId ?? 3),
      estado: usuario?.estado ?? "Activo",
    }),
    [usuario],
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
    const payload = {
      nombre: v.nombre,
      email: v.email,
      roleId: Number(v.roleId) as RoleId,
      estado: v.estado,
    };
    if (isEdit && usuario) {
      updateUsuario(usuario.id, payload);
      toast.success("Usuario actualizado");
    } else {
      addUsuario(payload);
      toast.success("Usuario creado");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>Acceso al sistema y rol asignado.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label className="mb-1.5 block">Nombre</Label>
            <Input {...register("nombre")} placeholder="Nombre completo" />
            {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label className="mb-1.5 block">Correo</Label>
            <Input {...register("email")} placeholder="correo@serycrecer.pe" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Rol</Label>
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Estado</Label>
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
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-gradient text-white">
              {isEdit ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
