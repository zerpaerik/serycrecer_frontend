"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Search, UserPlus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDb, pacienteNombre } from "@/lib/data/store";
import { calcAge, initials } from "@/lib/format";
import type { Paciente, TipoDoc } from "@/lib/data/types";

export function PatientSearch({
  value,
  onSelect,
}: {
  value: Paciente | null;
  onSelect: (p: Paciente | null) => void;
}) {
  const pacientes = useDb((s) => s.pacientes);
  const addPaciente = useDb((s) => s.addPaciente);
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const resultados = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return pacientes
      .filter((p) =>
        `${p.nombres} ${p.apellidos} ${p.numDoc}`.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [pacientes, query]);

  // Alta rápida
  const [form, setForm] = React.useState({
    nombres: "", apellidos: "", tipoDoc: "DNI" as TipoDoc, numDoc: "", sexo: "Femenino", telefono: "",
  });

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-brand/10 text-sm font-semibold text-brand">
            {initials(pacienteNombre(value))}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{pacienteNombre(value)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {value.tipoDoc} {value.numDoc} · {calcAge(value.fechaNacimiento)} años · {value.sexo}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
          <X className="h-4 w-4" />
          Cambiar
        </Button>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="space-y-3 rounded-xl border border-dashed p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Nuevo paciente</p>
          <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
            Cancelar
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-1 block text-xs">Nombres</Label>
            <Input value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Apellidos</Label>
            <Input value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-xs">Tipo</Label>
              <Select value={form.tipoDoc} onValueChange={(v) => setForm({ ...form, tipoDoc: v as TipoDoc })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">N° documento</Label>
              <Input value={form.numDoc} onChange={(e) => setForm({ ...form, numDoc: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-xs">Sexo</Label>
              <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Teléfono</Label>
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
          </div>
        </div>
        <Button
          className="w-full bg-brand-gradient text-white"
          onClick={() => {
            if (!form.nombres.trim() || !form.apellidos.trim() || form.numDoc.trim().length < 6) {
              toast.error("Completa nombres, apellidos y documento");
              return;
            }
            const nuevo = addPaciente({
              tipoDoc: form.tipoDoc,
              numDoc: form.numDoc.trim(),
              nombres: form.nombres.trim(),
              apellidos: form.apellidos.trim(),
              sexo: form.sexo as Paciente["sexo"],
              fechaNacimiento: "2000-01-01",
              telefono: form.telefono.trim(),
              estado: "Activo",
            });
            toast.success("Paciente creado · registro retomado");
            setCreating(false);
            onSelect(nuevo);
          }}
        >
          <UserPlus className="h-4 w-4" />
          Crear y seleccionar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por nombre o documento…"
          className="pl-9"
          autoFocus
        />
      </div>

      {resultados.length > 0 && (
        <div className="overflow-hidden rounded-xl border">
          {resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p); setQuery(""); }}
              className="flex w-full items-center gap-3 border-b px-3 py-2 text-left transition-colors last:border-0 hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-brand/10 text-xs font-semibold text-brand">
                  {initials(pacienteNombre(p))}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{pacienteNombre(p)}</p>
                <p className="truncate text-xs text-muted-foreground">{p.tipoDoc} {p.numDoc}</p>
              </div>
              <Check className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && resultados.length === 0 && (
        <div className="flex items-center justify-between rounded-xl border border-dashed p-3">
          <span className="text-sm text-muted-foreground">No se encontró el paciente.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const numeric = /^\d+$/.test(query.trim());
              setForm((f) => ({ ...f, numDoc: numeric ? query.trim() : f.numDoc }));
              setCreating(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Crear paciente
          </Button>
        </div>
      )}
    </div>
  );
}
