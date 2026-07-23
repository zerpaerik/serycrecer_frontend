"use client";

import * as React from "react";
import { Package, Search, Stethoscope } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDb } from "@/lib/data/store";
import { formatPEN } from "@/lib/format";
import type { TipoItem } from "@/lib/data/types";

export interface CatalogItem {
  tipo: TipoItem;
  nombre: string;
  monto: number;
  servicioId?: string;
  paqueteId?: string;
  sesiones?: number;
  color: string;
}

export function ItemPicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (item: CatalogItem) => void;
}) {
  const servicios = useDb((s) => s.servicios);
  const paquetes = useDb((s) => s.paquetes);
  const [q, setQ] = React.useState("");

  const query = q.trim().toLowerCase();
  const srvFiltrados = servicios.filter((s) => s.nombre.toLowerCase().includes(query));
  const paqFiltrados = paquetes.filter((p) => p.nombre.toLowerCase().includes(query));

  function pick(item: CatalogItem) {
    onPick(item);
    onOpenChange(false);
    setQ("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Agregar ítem</DialogTitle>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar servicio o paquete…" className="pl-9" autoFocus />
          </div>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {srvFiltrados.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Servicios
              </p>
              {srvFiltrados.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick({ tipo: "Servicio", nombre: s.nombre, monto: s.precio, servicioId: s.id, color: s.color })}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}1a` }}>
                    <Stethoscope className="h-4 w-4" style={{ color: s.color }} />
                  </span>
                  <span className="flex-1 text-sm">{s.nombre}</span>
                  <span className="text-sm font-medium tabular-nums">{formatPEN(s.precio)}</span>
                </button>
              ))}
            </>
          )}

          {paqFiltrados.length > 0 && (
            <>
              <p className="px-2 py-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Paquetes de sesiones
              </p>
              {paqFiltrados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick({ tipo: "Paquete", nombre: p.nombre, monto: p.precio, paqueteId: p.id, sesiones: p.sesiones, color: p.color })}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${p.color}1a` }}>
                    <Package className="h-4 w-4" style={{ color: p.color }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{p.nombre}</span>
                    <span className="block text-xs text-muted-foreground">{p.sesiones} sesiones</span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">{formatPEN(p.precio)}</span>
                </button>
              ))}
            </>
          )}

          {srvFiltrados.length === 0 && paqFiltrados.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
