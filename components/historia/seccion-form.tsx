"use client";

import * as React from "react";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDb } from "@/lib/data/store";
import type { RespuestaBool } from "@/lib/data/types";
import type { Field, Group, Section } from "@/lib/historia/config";

/** Textarea que crece con el contenido (para ver todo lo que se escribe). */
function AutoTextarea({
  value,
  onChange,
  className,
  placeholder,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    // Re-ajusta tras el layout (evita medir alto erróneo al montar).
    const raf = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      className={cn(
        "block w-full resize-none rounded-md border border-input bg-transparent px-2 py-1 text-xs leading-snug shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

/** Campo de observación: textarea que crece + botón para abrir un modal amplio. */
function ObservacionField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative w-full sm:w-56">
      <AutoTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Observación"
        className="max-h-40 overflow-y-auto pr-7"
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ampliar observación"
        title="Ampliar"
        className="absolute right-1 top-1 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Observación</DialogTitle>
            <DialogDescription className="line-clamp-3">{label}</DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            placeholder="Escribe la observación con el detalle que necesites…"
            className="text-sm"
          />
          <DialogFooter>
            <Button className="bg-brand-gradient text-white" onClick={() => setOpen(false)}>
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Campo Sí/No con observación (patrón de la anamnesis). */
function CampoBool({ pacienteId, field }: { pacienteId: string; field: Field }) {
  const valor = useDb((s) => s.evaluaciones.find((e) => e.pacienteId === pacienteId)?.respuestas[field.id]) as
    | RespuestaBool
    | undefined;
  const setRespuesta = useDb((s) => s.setRespuesta);
  const v = valor?.v ?? null;

  const set = (nuevo: Partial<RespuestaBool>) =>
    setRespuesta(pacienteId, field.id, { v, obs: valor?.obs ?? "", ...nuevo });

  const labels =
    field.type === "cumple"
      ? { si: "Cumple", no: "No cumple" }
      : { si: "Sí", no: "No" };

  return (
    <div className="flex flex-col gap-2 border-b py-2.5 last:border-0 sm:flex-row sm:items-start">
      <p className="flex-1 text-sm sm:pt-1">{field.label}</p>
      <div className="flex shrink-0 items-start gap-2">
        <div className="flex overflow-hidden rounded-lg border">
          {(["si", "no"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set({ v: v === opt ? null : opt })}
              className={cn(
                "whitespace-nowrap px-3 py-1 text-xs font-medium transition-colors",
                v === opt
                  ? opt === "si"
                    ? "bg-success text-white"
                    : "bg-destructive text-white"
                  : "hover:bg-accent",
              )}
            >
              {labels[opt]}
            </button>
          ))}
        </div>
        <ObservacionField
          label={field.label}
          value={valor?.obs ?? ""}
          onChange={(obs) => set({ obs })}
        />
      </div>
    </div>
  );
}

/** Campo simple (texto, número, fecha, select, textarea). */
function CampoSimple({ pacienteId, field }: { pacienteId: string; field: Field }) {
  const valor = useDb((s) => s.evaluaciones.find((e) => e.pacienteId === pacienteId)?.respuestas[field.id]);
  const setRespuesta = useDb((s) => s.setRespuesta);
  const strVal = valor == null ? "" : String(valor);

  return (
    <div className={cn(field.full && "sm:col-span-2")}>
      <Label className="mb-1.5 block text-sm">{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea
          value={strVal}
          onChange={(e) => setRespuesta(pacienteId, field.id, e.target.value)}
          rows={3}
        />
      ) : field.type === "select" ? (
        <Select
          value={strVal}
          onValueChange={(val) => setRespuesta(pacienteId, field.id, val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona…" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          value={strVal}
          onChange={(e) => setRespuesta(pacienteId, field.id, e.target.value)}
        />
      )}
    </div>
  );
}

function GrupoCard({ pacienteId, group }: { pacienteId: string; group: Group }) {
  const bools = group.fields.filter((f) => f.type === "bool" || f.type === "cumple");
  const simples = group.fields.filter((f) => f.type !== "bool" && f.type !== "cumple");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{group.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {simples.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {simples.map((f) => (
              <CampoSimple key={f.id} pacienteId={pacienteId} field={f} />
            ))}
          </div>
        )}
        {bools.length > 0 && (
          <div className="rounded-lg border px-4">
            {bools.map((f) => (
              <CampoBool key={f.id} pacienteId={pacienteId} field={f} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SeccionForm({ pacienteId, section }: { pacienteId: string; section: Section }) {
  return (
    <div className="space-y-4">
      {section.groups.map((g) => (
        <GrupoCard key={g.title} pacienteId={pacienteId} group={g} />
      ))}
    </div>
  );
}

/** Sección "Plan de trabajo": objetivos con estado + observaciones + informe. */
export function PlanTrabajo({ pacienteId }: { pacienteId: string }) {
  const evaluacion = useDb((s) => s.evaluaciones.find((e) => e.pacienteId === pacienteId));
  const addObjetivo = useDb((s) => s.addObjetivo);
  const updateObjetivo = useDb((s) => s.updateObjetivo);
  const deleteObjetivo = useDb((s) => s.deleteObjetivo);
  const setEvalCampo = useDb((s) => s.setEvalCampo);

  const [nuevo, setNuevo] = React.useState("");
  const objetivos = evaluacion?.objetivos ?? [];

  const ESTADOS = ["En proceso inicial", "Muestra mejora", "Logrado"];
  const ESTADO_COLOR: Record<string, string> = {
    "En proceso inicial": "bg-muted text-muted-foreground",
    "Muestra mejora": "bg-warning/15 text-warning",
    Logrado: "bg-success/12 text-success",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Objetivos terapéuticos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              placeholder="Describe un objetivo…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && nuevo.trim()) {
                  addObjetivo(pacienteId, nuevo.trim());
                  setNuevo("");
                }
              }}
            />
            <Button
              className="bg-brand-gradient text-white"
              onClick={() => {
                if (nuevo.trim()) {
                  addObjetivo(pacienteId, nuevo.trim());
                  setNuevo("");
                }
              }}
            >
              Agregar
            </Button>
          </div>

          {objetivos.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aún no hay objetivos.
            </p>
          ) : (
            <div className="space-y-2">
              {objetivos.map((o, i) => (
                <div key={o.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="text-sm font-semibold text-brand">{i + 1}.</span>
                  <span className="min-w-0 flex-1 text-sm">{o.texto}</span>
                  <div className="flex shrink-0 gap-1">
                    {ESTADOS.map((est) => (
                      <button
                        key={est}
                        type="button"
                        onClick={() => updateObjetivo(pacienteId, o.id, { estado: est })}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                          o.estado === est ? ESTADO_COLOR[est] : "text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {est}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteObjetivo(pacienteId, o.id)}
                    className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observaciones iniciales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["obsConducta", "Conducta del niño"],
              ["obsFamilia", "Contexto familiar"],
              ["obsEscolar", "Contexto escolar"],
              ["informe", "Informe / conclusiones"],
            ] as const
          ).map(([campo, label]) => (
            <div key={campo}>
              <Label className="mb-1.5 block text-sm">{label}</Label>
              <Textarea
                value={evaluacion?.[campo] ?? ""}
                onChange={(e) => setEvalCampo(pacienteId, campo, e.target.value)}
                rows={3}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
