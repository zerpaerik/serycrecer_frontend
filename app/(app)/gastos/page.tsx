"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Receipt, Pencil, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GastoDialog } from "@/components/gastos/gasto-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDb } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/store";
import { formatDate, formatPEN } from "@/lib/format";
import type { Gasto } from "@/lib/data/types";

function hoyIso() {
  return new Date().toLocaleDateString("en-CA");
}

export default function GastosPage() {
  const ready = useDbReady();
  const gastos = useDb((s) => s.gastos);
  const deleteGasto = useDb((s) => s.deleteGasto);
  const roleId = useAuth((s) => s.session?.roleId ?? 1);
  const puedeEditar = roleId !== 3; // Recepción no edita ni elimina gastos.

  const [fechaFiltro, setFechaFiltro] = React.useState<string | null>(hoyIso());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editando, setEditando] = React.useState<Gasto | undefined>();
  const [aEliminar, setAEliminar] = React.useState<Gasto | undefined>();

  const lista = React.useMemo(
    () =>
      gastos
        .filter((g) => !fechaFiltro || g.fecha === fechaFiltro)
        .slice()
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [gastos, fechaFiltro],
  );
  const total = lista.reduce((s, g) => s + g.monto, 0);

  function abrirNuevo() {
    setEditando(undefined);
    setDialogOpen(true);
  }
  function abrirEditar(g: Gasto) {
    setEditando(g);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Gastos" description="Egresos del centro. Se descuentan de la caja del día.">
        <Button className="bg-brand-gradient text-white" onClick={abrirNuevo}>
          <Plus className="h-4 w-4" />
          Registrar gasto
        </Button>
      </PageHeader>

      {/* Filtro + total */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-hidden rounded-lg border">
          <button
            type="button"
            onClick={() => setFechaFiltro(hoyIso())}
            className={`px-3 py-1.5 text-sm font-medium ${fechaFiltro ? "bg-brand text-white" : "hover:bg-accent"}`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setFechaFiltro(null)}
            className={`px-3 py-1.5 text-sm font-medium ${!fechaFiltro ? "bg-brand text-white" : "hover:bg-accent"}`}
          >
            Todos
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          Total {fechaFiltro ? "de hoy" : "acumulado"}:{" "}
          <span className="font-heading text-base font-bold text-destructive">{formatPEN(total)}</span>
        </div>
      </div>

      {!ready ? (
        <Skeleton className="h-64 w-full" />
      ) : lista.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin gastos"
          description={fechaFiltro ? "No hay gastos registrados hoy." : "Aún no se han registrado gastos."}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Descripción</th>
                    <th className="px-4 py-3 font-medium">Método</th>
                    <th className="px-4 py-3 text-right font-medium">Monto</th>
                    {puedeEditar && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lista.map((g) => (
                    <tr key={g.id} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(g.fecha)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-brand/20 bg-brand/5 px-2 py-0.5 text-xs font-medium text-brand">
                          {g.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {g.descripcion || "—"}
                        {g.usuarioNombre && <span className="block text-xs text-muted-foreground">por {g.usuarioNombre}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{g.metodo}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">{formatPEN(g.monto)}</td>
                      {puedeEditar && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(g)} aria-label="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setAEliminar(g)} aria-label="Eliminar">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <GastoDialog open={dialogOpen} onOpenChange={setDialogOpen} gasto={editando} />

      <ConfirmDialog
        open={!!aEliminar}
        onOpenChange={(o) => !o && setAEliminar(undefined)}
        title="Eliminar gasto"
        description="¿Eliminar este gasto? Esta acción no se puede deshacer."
        destructive
        onConfirm={async () => {
          if (!aEliminar) return;
          try {
            await deleteGasto(aEliminar.id);
            toast.success("Gasto eliminado");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
          }
          setAEliminar(undefined);
        }}
      />
    </div>
  );
}
