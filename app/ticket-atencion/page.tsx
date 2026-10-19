"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { formatDate, formatPEN } from "@/lib/format";
import type { TicketData } from "@/lib/pdf/ticket";

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

/** Línea divisoria de guiones, como en los tickets de caja. */
function Separador() {
  return <div className="border-t border-dashed border-black" />;
}

/**
 * Concepto a la izquierda e importe a la derecha. Se usa flex (y no una tabla)
 * para que el importe quede siempre pegado al margen derecho y en su misma
 * línea, aunque el concepto ocupe dos renglones.
 */
function Fila({ label, valor, bold }: { label: string; valor: string; bold?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-2 ${bold ? "font-bold" : ""}`}>
      <span className="min-w-0 break-words">{label}</span>
      <span className="shrink-0 tabular-nums whitespace-nowrap">{valor}</span>
    </div>
  );
}

function TicketInner() {
  const params = useSearchParams();
  const id = params.get("id");
  // Con ?descargar=1 se abre y baja el PDF directamente (sin diálogo de impresión).
  const soloDescarga = params.get("descargar") === "1";
  const [atn, setAtn] = React.useState<AtnResp | null>(null);
  const [config, setConfig] = React.useState<ConfigResp>({});
  const [error, setError] = React.useState<string | null>(null);
  const [ocupado, setOcupado] = React.useState(false);
  // El menú de compartir del sistema solo existe en navegadores compatibles
  // (sobre todo móviles); ahí es donde aparece WhatsApp.
  const [puedeCompartir] = React.useState(
    () => typeof navigator !== "undefined" && typeof navigator.canShare === "function",
  );

  async function construirPdf(t: TicketData, cfg: ConfigResp) {
    const { generarTicketPdf, nombreArchivoTicket } = await import("@/lib/pdf/ticket");
    const doc = await generarTicketPdf(t, cfg);
    return { doc, nombre: nombreArchivoTicket(t) };
  }

  async function descargarPdf(t: TicketData, cfg: ConfigResp) {
    setOcupado(true);
    try {
      const { doc, nombre } = await construirPdf(t, cfg);
      doc.save(nombre);
    } catch {
      setError("No se pudo generar el PDF");
    } finally {
      setOcupado(false);
    }
  }

  /** Abre el menú de compartir del celular (ahí aparece WhatsApp). */
  async function compartirPdf(t: TicketData, cfg: ConfigResp) {
    setOcupado(true);
    try {
      const { doc, nombre } = await construirPdf(t, cfg);
      const archivo = new File([doc.output("blob")], nombre, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: nombre });
      } else {
        doc.save(nombre); // Sin soporte de compartir: se descarga.
      }
    } catch {
      // El usuario puede cancelar el menú de compartir: no es un error.
    } finally {
      setOcupado(false);
    }
  }

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
        if (!soloDescarga) setTimeout(() => window.print(), 500);
      })
      .catch((e) => activo && setError(e instanceof Error ? e.message : "Error"));
    return () => { activo = false; };
  }, [id, soloDescarga]);

  if (error) return <div className="p-6 text-center text-sm text-red-600">Error: {error}</div>;
  if (!atn) return <div className="p-6 text-center text-sm text-gray-500">Cargando ticket…</div>;

  const metodos = [...new Set(atn.pagos.map((p) => p.metodo))].join(", ") || "—";
  const paciente = atn.paciente ? `${atn.paciente.nombres} ${atn.paciente.apellidos}` : "—";

  const datosTicket = {
    id: atn.id,
    fecha: atn.fecha,
    hora: atn.hora,
    total: N(atn.total),
    pagado: N(atn.pagado),
    saldo: N(atn.saldo),
    estado: atn.estado,
    paciente,
    documento: atn.paciente?.numDoc ? `${atn.paciente.tipoDoc ?? ""} ${atn.paciente.numDoc}`.trim() : undefined,
    psicologo: atn.psicologo?.nombre,
    items: atn.items.map((i) => ({ nombre: i.nombre, monto: N(i.monto) })),
    metodos,
  };

  return (
    <>
      {/* Formato ticketera térmica 80mm.
          El layout de la app pone min-h-screen en el body: al imprimir eso vale
          "una página completa", y la ticketera avanzaba todo ese papel en blanco
          después del ticket. Aquí se anula para que el rollo corte al terminar. */}
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            background: #fff !important;
          }
          body > * { min-height: 0 !important; }
          .ticket {
            width: auto !important;
            max-width: none !important;
            margin: 0 !important;
            /* Último avance mínimo para que la cuchilla no corte el texto. */
            padding: 2mm 3mm 6mm !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div
        className="ticket mx-auto bg-white p-3 text-black"
        style={{ width: "80mm", maxWidth: "100%", fontFamily: "ui-monospace, monospace" }}
      >
        <div className="mb-3 flex flex-wrap justify-center gap-2 print:hidden">
          <button onClick={() => window.print()} className="rounded bg-teal-600 px-3 py-1.5 text-xs font-medium text-white">
            Imprimir
          </button>
          <button
            onClick={() => descargarPdf(datosTicket, config)}
            disabled={ocupado}
            className="rounded border border-teal-600 px-3 py-1.5 text-xs font-medium text-teal-700 disabled:opacity-50"
          >
            {ocupado ? "Generando…" : "Descargar PDF"}
          </button>
          {puedeCompartir && (
            <button
              onClick={() => compartirPdf(datosTicket, config)}
              disabled={ocupado}
              className="rounded border border-teal-600 px-3 py-1.5 text-xs font-medium text-teal-700 disabled:opacity-50"
            >
              Compartir
            </button>
          )}
        </div>

        <div className="text-center leading-tight">
          {/* El logo ya incluye el nombre del centro; si no carga, el texto
              alternativo lo muestra igual. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-ticket.png"
            alt={config.nombre ?? "Ser y Crecer"}
            className="mx-auto mb-1 w-[24mm] max-w-[45%] font-bold"
          />
          {config.ruc && <p className="text-[11px]">RUC {config.ruc}</p>}
          {config.direccion && <p className="text-[11px]">{config.direccion}</p>}
          {config.telefono && <p className="text-[11px]">{config.telefono}</p>}
        </div>

        <p className="my-1.5 text-center text-[13px] font-bold tracking-wide">TICKET DE ATENCIÓN</p>
        <Separador />

        <div className="py-1 text-[12px] leading-snug">
          <p><span className="font-bold">N° {String(atn.id).padStart(6, "0")}</span></p>
          <p>Fecha: {formatDate(atn.fecha)}{atn.hora ? ` ${atn.hora}` : ""}</p>
          <p>Paciente: {paciente}</p>
          {atn.paciente?.numDoc && <p>{atn.paciente.tipoDoc} {atn.paciente.numDoc}</p>}
          <p>Psicólogo: {atn.psicologo?.nombre ?? "—"}</p>
        </div>

        <Separador />
        <div className="py-1 text-[12px] leading-snug">
          {atn.items.map((it) => (
            <Fila key={it.id} label={it.nombre} valor={formatPEN(N(it.monto))} />
          ))}
        </div>

        <Separador />
        <div className="py-1 text-[12px] leading-snug">
          <Fila label="TOTAL" valor={formatPEN(N(atn.total))} bold />
          <Fila label="Pagado" valor={formatPEN(N(atn.pagado))} />
          <Fila label="Saldo" valor={formatPEN(N(atn.saldo))} />
        </div>

        <Separador />
        <div className="py-1 text-[12px] leading-snug">
          <p>Método: {metodos}</p>
          <p>Estado: {atn.estado}</p>
        </div>

        <Separador />
        <p className="mt-2 text-center text-[11px]">¡Gracias por su preferencia!</p>
        <p className="text-center text-[11px] font-bold">{config.nombre ?? "Ser y Crecer"}</p>
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
