"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { formatDateLong, formatPEN } from "@/lib/format";
import { METODOS_PAGO } from "@/lib/data/types";

interface CajaResp {
  fecha: string;
  total: number;
  count: number;
  porMetodo: Record<string, number>;
  totalGastos?: number;
  neto?: number;
  pagos: { id: string; monto: number; metodo: string; tipo: string; paciente: string }[];
  gastos?: { id: string; monto: number; categoria: string; metodo: string; descripcion: string }[];
}
interface ConfigResp {
  nombre?: string;
  ruc?: string;
  direccion?: string;
}

function hoyIso() {
  return new Date().toLocaleDateString("en-CA");
}

function CierreCajaInner() {
  const params = useSearchParams();
  const fecha = params.get("fecha") || hoyIso();
  const [caja, setCaja] = React.useState<CajaResp | null>(null);
  const [config, setConfig] = React.useState<ConfigResp>({});
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let activo = true;
    Promise.all([
      api.get<CajaResp>(`/caja?fecha=${fecha}`),
      api.get<ConfigResp>("/config").catch(() => ({})),
    ])
      .then(([c, cfg]) => {
        if (!activo) return;
        setCaja(c);
        setConfig(cfg as ConfigResp);
        // Imprime automáticamente al cargar.
        setTimeout(() => window.print(), 500);
      })
      .catch((e) => activo && setError(e instanceof Error ? e.message : "Error"));
    return () => {
      activo = false;
    };
  }, [fecha]);

  if (error) {
    return <div className="mx-auto max-w-lg p-10 text-center text-sm text-red-600">Error: {error}</div>;
  }
  if (!caja) {
    return <div className="mx-auto max-w-lg p-10 text-center text-sm text-gray-500">Cargando cierre de caja…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-gray-900">
      {/* Barra de acciones (no se imprime) */}
      <div className="mb-6 flex justify-end gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white"
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Encabezado */}
      <div className="border-b-2 border-teal-600 pb-4 text-center">
        <h1 className="text-xl font-extrabold text-teal-700">{config.nombre ?? "Ser y Crecer"}</h1>
        {config.ruc && <p className="text-xs text-gray-500">RUC {config.ruc}</p>}
        {config.direccion && <p className="text-xs text-gray-500">{config.direccion}</p>}
        <h2 className="mt-3 text-lg font-bold">Cierre de caja</h2>
        <p className="text-sm text-gray-600">{formatDateLong(fecha)}</p>
      </div>

      {/* Resumen */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-gray-500">Ingresos</p>
          <p className="text-xl font-extrabold text-teal-700">{formatPEN(caja.total)}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-gray-500">Gastos</p>
          <p className="text-xl font-extrabold text-orange-600">− {formatPEN(caja.totalGastos ?? 0)}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-gray-500">Neto en caja</p>
          <p className={`text-xl font-extrabold ${(caja.neto ?? caja.total) < 0 ? "text-red-600" : "text-gray-900"}`}>
            {formatPEN(caja.neto ?? caja.total)}
          </p>
        </div>
      </div>

      {/* Desglose por método */}
      <h3 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Por método de pago</h3>
      <table className="w-full text-sm">
        <tbody>
          {METODOS_PAGO.map((m) => (
            <tr key={m} className="border-b">
              <td className="py-1.5">{m}</td>
              <td className="py-1.5 text-right tabular-nums">{formatPEN(caja.porMetodo[m] ?? 0)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-2">Total</td>
            <td className="py-2 text-right tabular-nums">{formatPEN(caja.total)}</td>
          </tr>
        </tbody>
      </table>

      {/* Detalle de pagos */}
      <h3 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Detalle de pagos</h3>
      {caja.pagos.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">Sin pagos registrados en la fecha.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-gray-500">
              <th className="py-1.5">Paciente</th>
              <th className="py-1.5">Tipo</th>
              <th className="py-1.5">Método</th>
              <th className="py-1.5 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {caja.pagos.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-1.5">{p.paciente}</td>
                <td className="py-1.5">{p.tipo}</td>
                <td className="py-1.5">{p.metodo}</td>
                <td className="py-1.5 text-right tabular-nums">{formatPEN(p.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Detalle de gastos */}
      {caja.gastos && caja.gastos.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Gastos del día</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-1.5">Categoría</th>
                <th className="py-1.5">Descripción</th>
                <th className="py-1.5">Método</th>
                <th className="py-1.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {caja.gastos.map((g) => (
                <tr key={g.id} className="border-b">
                  <td className="py-1.5">{g.categoria}</td>
                  <td className="py-1.5">{g.descripcion || "—"}</td>
                  <td className="py-1.5">{g.metodo}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatPEN(g.monto)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2" colSpan={3}>Total gastos</td>
                <td className="py-2 text-right tabular-nums">{formatPEN(caja.totalGastos ?? 0)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* Neto final */}
      <div className="mt-6 flex items-center justify-between rounded-lg border-2 border-teal-600 px-4 py-3">
        <span className="text-sm font-bold uppercase tracking-wide text-gray-700">Neto en caja</span>
        <span className={`text-xl font-extrabold ${(caja.neto ?? caja.total) < 0 ? "text-red-600" : "text-teal-700"}`}>
          {formatPEN(caja.neto ?? caja.total)}
        </span>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        Generado el {formatDateLong(hoyIso())} · Ser y Crecer
      </p>
    </div>
  );
}

export default function CierreCajaPage() {
  return (
    <React.Suspense fallback={null}>
      <CierreCajaInner />
    </React.Suspense>
  );
}
