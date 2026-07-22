"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Save } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDb } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import type { ConsultorioConfig } from "@/lib/data/types";

function ConfiguracionInner() {
  const ready = useDbReady();
  const config = useDb((s) => s.config);
  const updateConfig = useDb((s) => s.updateConfig);

  const { register, handleSubmit, reset } = useForm<ConsultorioConfig>({
    defaultValues: config,
  });

  React.useEffect(() => {
    if (ready) reset(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function onSubmit(v: ConsultorioConfig) {
    updateConfig(v);
    toast.success("Configuración guardada");
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Configuración"
        description="Datos generales del consultorio"
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del consultorio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Nombre</Label>
              <Input {...register("nombre")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">RUC</Label>
                <Input {...register("ruc")} placeholder="20123456789" />
              </div>
              <div>
                <Label className="mb-1.5 block">Teléfono</Label>
                <Input {...register("telefono")} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Dirección</Label>
              <Input {...register("direccion")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Correo</Label>
                <Input {...register("email")} />
              </div>
              <div>
                <Label className="mb-1.5 block">Moneda</Label>
                <Input {...register("moneda")} placeholder="PEN" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Horario de atención</Label>
              <Input {...register("horario")} />
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end">
          <Button type="submit" className="bg-brand-gradient text-white">
            <Save className="h-4 w-4" />
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <RoleGuard roles={[1]}>
      <ConfiguracionInner />
    </RoleGuard>
  );
}
