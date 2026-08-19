"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import {
  mapPaciente,
  mapEvaluacion,
  mapEvolucion,
  mapPsicologo,
  mapConfig,
} from "@/lib/data/mappers";
import { SECCIONES } from "@/lib/historia/config";
import type { Field, Section } from "@/lib/historia/config";
import type {
  Paciente,
  EvaluacionNeuro,
  EvolucionSesion,
  Psicologo,
  ConsultorioConfig,
  RespuestaBool,
} from "@/lib/data/types";
import { formatDate, formatDateLong, calcAge } from "@/lib/format";

// ── Helpers de valor ────────────────────────────────────────────────
function esBool(r: unknown): r is RespuestaBool {
  return typeof r === "object" && r !== null && "v" in (r as object);
}

const VACIO = "—";

/** Devuelve {texto, obs, lleno} de un campo. `lleno` indica si tiene respuesta. */
function valorCampo(field: Field, respuestas: Record<string, unknown>): { texto: string; obs?: string; lleno: boolean } {
  const raw = respuestas[field.id];
  if (field.type === "bool" || field.type === "cumple") {
    const b = esBool(raw) ? raw : null;
    const v = b?.v ?? null;
    const texto =
      field.type === "cumple"
        ? v === "si" ? "Cumple" : v === "no" ? "No cumple" : VACIO
        : v === "si" ? "Sí" : v === "no" ? "No" : VACIO;
    return { texto, obs: b?.obs || undefined, lleno: v != null || !!b?.obs };
  }
  if (raw == null || raw === "") return { texto: VACIO, lleno: false };
  if (field.type === "date") return { texto: formatDate(String(raw)), lleno: true };
  return { texto: String(raw), lleno: true };
}

// ── Instrumento completo (todas las secciones/grupos/campos) ────────
function GrupoImpreso({ title, fields, respuestas }: { title: string; fields: Field[]; respuestas: Record<string, unknown> }) {
  return (
    <div className="mb-3 break-inside-avoid rounded-md border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-teal-700">
        {title}
      </div>
      <div className="divide-y divide-gray-100">
        {fields.map((f) => {
          const val = valorCampo(f, respuestas);
          return (
            <div key={f.id} className="flex gap-3 px-3 py-1.5 text-[11.5px] leading-snug">
              <span className="w-1/2 shrink-0 text-gray-600">{f.label}</span>
              <span className="flex-1 text-gray-900">
                <span className={val.lleno ? "font-medium" : "text-gray-400"}>{val.texto}</span>
                {val.obs && (
                  <span className="mt-0.5 block whitespace-pre-wrap break-words text-gray-600">{val.obs}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeccionImpresa({ seccion, respuestas, index }: { seccion: Section; respuestas: Record<string, unknown>; index: number }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b-2 border-teal-600 pb-1 text-[13px] font-extrabold text-teal-800">
        {index}. {seccion.title}
      </h2>
      {seccion.groups.map((g) => (
        <GrupoImpreso key={g.title} title={g.title} fields={g.fields} respuestas={respuestas} />
      ))}
    </section>
  );
}

// ── Página ──────────────────────────────────────────────────────────
function HistoriaPrintInner() {
  const params = useSearchParams();
  const id = params.get("id");

  const [paciente, setPaciente] = React.useState<Paciente | null>(null);
  const [evaluacion, setEvaluacion] = React.useState<EvaluacionNeuro | null>(null);
  const [evoluciones, setEvoluciones] = React.useState<EvolucionSesion[]>([]);
  const [psicologos, setPsicologos] = React.useState<Psicologo[]>([]);
  const [config, setConfig] = React.useState<ConsultorioConfig | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let activo = true;
    Promise.all([
      api.get(`/pacientes/${id}`).then(mapPaciente),
      api.get(`/evaluaciones/${id}`).then(mapEvaluacion).catch(() => null),
      api.get<unknown[]>(`/evoluciones?pacienteId=${id}`).then((l) => l.map(mapEvolucion)).catch(() => []),
      api.get<unknown[]>("/psicologos").then((l) => l.map(mapPsicologo)).catch(() => []),
      api.get("/config").then(mapConfig).catch(() => null),
    ])
      .then(([p, ev, evo, psi, cfg]) => {
        if (!activo) return;
        setPaciente(p as Paciente);
        setEvaluacion(ev as EvaluacionNeuro | null);
        setEvoluciones(evo as EvolucionSesion[]);
        setPsicologos(psi as Psicologo[]);
        setConfig(cfg as ConsultorioConfig | null);
        setTimeout(() => window.print(), 700);
      })
      .catch((e) => activo && setError(e instanceof Error ? e.message : "Error"));
    return () => { activo = false; };
  }, [id]);

  if (error) return <div className="mx-auto max-w-lg p-10 text-center text-sm text-red-600">Error: {error}</div>;
  if (!paciente) return <div className="mx-auto max-w-lg p-10 text-center text-sm text-gray-500">Cargando historia clínica…</div>;

  const respuestas = evaluacion?.respuestas ?? {};
  const objetivos = evaluacion?.objetivos ?? [];
  const obs = [
    { label: "Observaciones de conducta", v: evaluacion?.obsConducta },
    { label: "Observaciones del contexto familiar", v: evaluacion?.obsFamilia },
    { label: "Observaciones del contexto escolar", v: evaluacion?.obsEscolar },
    { label: "Informe / conclusiones", v: evaluacion?.informe },
  ].filter((o) => o.v && o.v.trim());
  const nombreCompleto = `${paciente.nombres} ${paciente.apellidos}`.trim();
  const nombreCentro = config?.nombre ?? "Ser y Crecer";
  // Profesional responsable: el de la evolución más reciente (si hay).
  const profesional = evoluciones.length
    ? psicologos.find((p) => p.id === evoluciones[0].psicologoId)
    : undefined;

  return (
    <div className="mx-auto max-w-[820px] bg-white px-10 py-8 text-gray-900 print:px-0 print:py-0">
      <style>{`@media print { @page { size: A4; margin: 15mm; } body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      {/* Barra de acciones (no imprime) */}
      <div className="mb-6 flex justify-end gap-2 print:hidden">
        <button onClick={() => window.print()} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white">
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Encabezado */}
      <header className="mb-5 flex items-center gap-4 border-b-2 border-teal-600 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-mark.png" alt="" className="h-16 w-16 shrink-0 object-contain" />
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-teal-800">{nombreCentro}</h1>
          <p className="text-[11px] text-gray-500">
            Centro neuropsicológico
            {config?.ruc ? ` · RUC ${config.ruc}` : ""}
            {config?.direccion ? ` · ${config.direccion}` : ""}
            {config?.telefono ? ` · ${config.telefono}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-bold text-gray-800">Historia Clínica</p>
          <p className="text-[10px] text-gray-500">Emitida: {formatDateLong(new Date())}</p>
        </div>
      </header>

      {/* Datos del paciente */}
      <section className="mb-5 break-inside-avoid rounded-md border border-gray-200">
        <div className="border-b border-gray-200 bg-teal-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-teal-700">
          Datos del paciente
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-3 py-3 text-[11.5px]">
          <Dato label="Nombres y apellidos" value={nombreCompleto} />
          <Dato label="Documento" value={`${paciente.tipoDoc} ${paciente.numDoc}`} />
          <Dato label="Sexo" value={paciente.sexo} />
          <Dato
            label="Fecha de nacimiento"
            value={paciente.fechaNacimiento ? `${formatDate(paciente.fechaNacimiento)} (${calcAge(paciente.fechaNacimiento)} años)` : "—"}
          />
          <Dato label="Teléfono" value={paciente.telefono || "—"} />
          <Dato label="Correo" value={paciente.email || "—"} />
          <Dato label="Dirección" value={paciente.direccion || "—"} />
          <Dato label="Estado" value={paciente.estado} />
          {(paciente.contactoNombre || paciente.contactoTelefono) && (
            <Dato label="Contacto de emergencia" value={`${paciente.contactoNombre ?? ""} ${paciente.contactoTelefono ? "· " + paciente.contactoTelefono : ""}`.trim()} />
          )}
          {paciente.motivoConsulta && <Dato full label="Motivo de consulta" value={paciente.motivoConsulta} />}
        </div>
      </section>

      {/* Secciones del instrumento */}
      {SECCIONES.map((sec, i) => (
        <SeccionImpresa key={sec.id} seccion={sec} respuestas={respuestas} index={i + 1} />
      ))}

      {/* Plan de trabajo */}
      <section className="mb-5">
        <h2 className="mb-2 border-b-2 border-teal-600 pb-1 text-[13px] font-extrabold text-teal-800">
          {SECCIONES.length + 1}. Plan de trabajo
        </h2>
        {objetivos.length > 0 ? (
          <div className="rounded-md border border-gray-200 divide-y divide-gray-100">
            {objetivos.map((o, i) => (
              <div key={o.id} className="flex items-start gap-3 px-3 py-2 text-[11.5px] break-inside-avoid">
                <span className="font-bold text-teal-700">{i + 1}.</span>
                <span className="flex-1">{o.texto}</span>
                <span className="shrink-0 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                  {o.estado}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11.5px] text-gray-400">Sin objetivos registrados.</p>
        )}
      </section>

      {/* Observaciones e informe */}
      <section className="mb-5">
        <h2 className="mb-2 border-b-2 border-teal-600 pb-1 text-[13px] font-extrabold text-teal-800">
          {SECCIONES.length + 2}. Observaciones e informe
        </h2>
        {obs.length > 0 ? (
          obs.map((o) => (
            <div key={o.label} className="mb-2 break-inside-avoid">
              <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">{o.label}</p>
              <p className="whitespace-pre-wrap text-[11.5px] text-gray-800">{o.v}</p>
            </div>
          ))
        ) : (
          <p className="text-[11.5px] text-gray-400">Sin observaciones registradas.</p>
        )}
      </section>

      {/* Evoluciones */}
      <section className="mb-5">
        <h2 className="mb-2 border-b-2 border-teal-600 pb-1 text-[13px] font-extrabold text-teal-800">
          {SECCIONES.length + 3}. Evoluciones por sesión
        </h2>
        {evoluciones.length > 0 ? (
          <div className="space-y-2">
            {evoluciones.map((e) => {
              const psi = psicologos.find((p) => p.id === e.psicologoId);
              return (
                <div key={e.id} className="break-inside-avoid rounded-md border border-gray-200 px-3 py-2 text-[11.5px]">
                  <div className="mb-1 flex items-center justify-between border-b border-gray-100 pb-1">
                    <span className="font-semibold text-gray-800">{formatDate(e.fecha)}{e.hora ? ` · ${e.hora}` : ""}</span>
                    <span className="text-[10px] text-gray-500">
                      {psi?.nombre ?? ""}{psi?.licencia ? ` · ${psi.licencia}` : ""}{e.motivo ? ` · ${e.motivo}` : ""}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-gray-800">{e.observaciones}</p>
                  {e.acuerdos && <p className="mt-1 text-gray-600"><span className="font-medium">Acuerdos:</span> {e.acuerdos}</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11.5px] text-gray-400">Sin evoluciones registradas.</p>
        )}
      </section>

      {/* Firma */}
      <div className="mt-14 flex justify-between gap-8 break-inside-avoid text-[11px] text-gray-600">
        <div className="flex-1 border-t border-gray-400 pt-1 text-center">
          <p className="font-medium text-gray-800">{profesional?.nombre ?? "Firma del profesional"}</p>
          {profesional?.licencia && <p className="text-[10px] text-gray-500">{profesional.licencia}</p>}
          <p className="text-[10px] text-gray-500">Firma del profesional</p>
        </div>
        <div className="flex-1 border-t border-gray-400 pt-1 text-center">Sello del centro</div>
      </div>

      <p className="mt-6 text-center text-[9px] text-gray-400">
        Documento confidencial · {nombreCentro} · Generado el {formatDate(new Date())}
      </p>
    </div>
  );
}

function Dato({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <span className="text-gray-500">{label}: </span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function HistoriaPrintPage() {
  return (
    <React.Suspense fallback={null}>
      <HistoriaPrintInner />
    </React.Suspense>
  );
}
