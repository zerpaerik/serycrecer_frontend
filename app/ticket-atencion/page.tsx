"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { formatDate, formatPEN } from "@/lib/format";

const N = (v: unknown) => Number(v ?? 0);

interface AtnResp {
  id: number;
  fecha: string;
  hora?: string | null;
  observaciones?: string | null;
  total: string | number;
  pagado: string | number;
  saldo: string | number;
  estado: string;
  paciente?: { nombres: string; apellidos: string; tipoDoc?: string; numDoc?: string };
  psicologo?: { nombre: string };
  items: { id: number; nombre: string; monto: string | number }[];
  pagos: { metodo: string }[];
}
interface ConfigResp {
  nombre?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
}

function TicketInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const [atn, setAtn] = React.useState<AtnResp | null>(null);
  const [config, setConfig] = React.useState<ConfigResp>({});
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let activo = true;
    Promise.all([
      api.get<AtnResp>(`/atenciones/${id}`),
      api.get<ConfigResp>("/config").catch(() => ({})),
    ])
      .then(([a, cfg]) => {
        if (!activo) return;
        setAtn(a);
        setConfig(cfg as ConfigResp);
        setTimeout(() => window.print(), 500);
      })
      .catch((e) => activo && setError(e instanceof Error ? e.message : "Error"));
    return () => { activo = false; };
  }, [id]);

  if (error) return <div className="p-6 text-center text-sm text-red-600">Error: {error}</div>;
  if (!atn) return <div className="p-6 text-center text-sm text-gray-500">Cargando ticket…</div>;

  const metodos = [...new Set(atn.pagos.map((p) => p.metodo))].join(", ") || "—";
  const paciente = atn.paciente ? `${atn.paciente.nombres} ${atn.paciente.apellidos}` : "—";

  return (
    <>
      {/* Formato ticketera térmica 80mm */}
      <style>{`@media print { @page { size: 80mm auto; margin: 3mm; } body { margin: 0; } }`}</style>

      <div className="mx-auto bg-white p-3 text-black" style={{ width: "80mm", maxWidth: "100%", fontFamily: "ui-monospace, monospace" }}>
        <div className="mb-2 flex justify-center print:hidden">
          <button onClick={() => window.print()} className="rounded bg-teal-600 px-3 py-1.5 text-xs font-medium text-white">
            Imprimir ticket
          </button>
        </div>

        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-ticket.png" alt={config.nombre ?? "Ser y Crecer"} className="mx-auto mb-1 w-[46mm] max-w-[70%]" />
          {config.ruc && <p className="text-[10px]">RUC {config.ruc}</p>}
          {config.direccion && <p className="text-[10px]">{config.direccion}</p>}
          {config.telefono && <p className="text-[10px]">{config.telefono}</p>}
        </div>

        <p className="my-1 text-center text-[11px] font-bold">TICKET DE ATENCIÓN</p>
        <div className="border-t border-dashed border-black" />

        <div className="py-1 text-[11px] leading-tight">
          <p>N° {String(atn.id).padStart(6, "0")}</p>
          <p>Fecha: {formatDate(atn.fecha)}{atn.hora ? ` ${atn.hora}` : ""}</p>
          <p>Paciente: {paciente}</p>
          {atn.paciente?.numDoc && <p>{atn.paciente.tipoDoc} {atn.paciente.numDoc}</p>}
          <p>Psicólogo: {atn.psicologo?.nombre ?? "—"}</p>
        </div>

        <div className="border-t border-dashed border-black" />
        <table className="w-full text-[11px]">
          <tbody>
            {atn.items.map((it) => (
              <tr key={it.id}>
                <td className="py-0.5 pr-1 align-top">{it.nombre}</td>
                <td className="py-0.5 text-right align-top tabular-nums whitespace-nowrap">{formatPEN(N(it.monto))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-black" />
        <table className="w-full text-[11px]">
          <tbody>
            <tr className="font-bold"><td className="py-0.5">TOTAL</td><td className="py-0.5 text-right tabular-nums">{formatPEN(N(atn.total))}</td></tr>
            <tr><td className="py-0.5">Pagado</td><td className="py-0.5 text-right tabular-nums">{formatPEN(N(atn.pagado))}</td></tr>
            <tr><td className="py-0.5">Saldo</td><td className="py-0.5 text-right tabular-nums">{formatPEN(N(atn.saldo))}</td></tr>
          </tbody>
        </table>
        <p className="mt-1 text-[11px]">Método: {metodos}</p>
        <p className="text-[11px]">Estado: {atn.estado}</p>

        <div className="mt-2 border-t border-dashed border-black" />
        <p className="mt-2 text-center text-[10px]">¡Gracias por su preferencia!</p>
        <p className="text-center text-[10px]">Ser y Crecer</p>
      </div>
    </>
  );
}

export default function TicketAtencionPage() {
  return (
    <React.Suspense fallback={null}>
      <TicketInner />
    </React.Suspense>
  );
}
