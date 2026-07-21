"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDb } from "@/lib/data/store";
import type { HistoriaClinica } from "@/lib/data/types";

interface Values {
  antecedentes: string;
  diagnostico: string;
  planTratamiento: string;
  objetivos: string;
}

export function HistoriaHeaderDialog({
  open,
  onOpenChange,
  pacienteId,
  historia,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  historia?: HistoriaClinica;
}) {
  const upsertHistoria = useDb((s) => s.upsertHistoria);

  const { register, handleSubmit, reset } = useForm<Values>({
    defaultValues: {
      antecedentes: historia?.antecedentes ?? "",
      diagnostico: historia?.diagnostico ?? "",
      planTratamiento: historia?.planTratamiento ?? "",
      objetivos: historia?.objetivos ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        antecedentes: historia?.antecedentes ?? "",
        diagnostico: historia?.diagnostico ?? "",
        planTratamiento: historia?.planTratamiento ?? "",
        objetivos: historia?.objetivos ?? "",
      });
    }
  }, [open, historia, reset]);

  function onSubmit(v: Values) {
    upsertHistoria(pacienteId, v);
    toast.success(historia ? "Historia actualizada" : "Historia clínica abierta");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {historia ? "Editar historia clínica" : "Abrir historia clínica"}
          </DialogTitle>
          <DialogDescription>
            Datos clínicos generales del paciente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Antecedentes</Label>
            <Textarea {...register("antecedentes")} rows={3} placeholder="Antecedentes relevantes…" />
          </div>
          <div>
            <Label className="mb-1.5 block">Diagnóstico presuntivo</Label>
            <Textarea {...register("diagnostico")} rows={2} placeholder="Impresión diagnóstica…" />
          </div>
          <div>
            <Label className="mb-1.5 block">Plan de tratamiento</Label>
            <Textarea {...register("planTratamiento")} rows={3} placeholder="Enfoque y frecuencia…" />
          </div>
          <div>
            <Label className="mb-1.5 block">Objetivos terapéuticos</Label>
            <Textarea {...register("objetivos")} rows={2} placeholder="Metas del tratamiento…" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-gradient text-white">
              {historia ? "Guardar cambios" : "Abrir historia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
