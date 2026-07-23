"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ClipboardCheck,
  HandCoins,
  NotebookPen,
  Package,
  Plus,
  Stethoscope,
  Trash2,
  UserSearch,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PatientSearch } from "@/components/atenciones/patient-search";
import { ItemPicker, type CatalogItem } from "@/components/atenciones/item-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDb } from "@/lib/data/store";
import { atnSaldo, atnEstado, atnTotal } from "@/lib/data/atenciones";
import { formatDate, formatPEN } from "@/lib/format";
import { METODOS_PAGO, type MetodoPago } from "@/lib/data/types";

interface LineItem extends CatalogItem {
  uid: string;
}
interface PagoLine {
  monto: number;
  metodo: MetodoPago;
}

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Id efímero para líneas del formulario (no persiste). */
function newUid() {
  return Math.random().toString(36).slice(2, 9);
}

function Step({ n, icon: Icon, title, children }: { n: number; icon: typeof UserSearch; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">{n}</span>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-brand" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function RegistroInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const citaId = searchParams.get("citaId");

  const pacientes = useDb((s) => s.pacientes);
  const psicologos = useDb((s) => s.psicologos);
  const servicios = useDb((s) => s.servicios);
  const citas = useDb((s) => s.citas);
  const atenciones = useDb((s) => s.atenciones);
  const paquetesPaciente = useDb((s) => s.paquetesPaciente);
  const addAtencion = useDb((s) => s.addAtencion);
  const addPaquetePaciente = useDb((s) => s.addPaquetePaciente);
  const setEstadoCita = useDb((s) => s.setEstadoCita);
  const updateCita = useDb((s) => s.updateCita);

  const cita = citaId ? citas.find((c) => c.id === citaId) : undefined;

  const [pacienteId, setPacienteId] = React.useState<string | null>(cita?.pacienteId ?? null);
  const [psicologoId, setPsicologoId] = React.useState(cita?.psicologoId ?? "");
  const [items, setItems] = React.useState<LineItem[]>(() => {
    if (cita) {
      const srv = servicios.find((s) => s.id === cita.servicioId);
      if (srv) return [{ uid: "l0", tipo: "Servicio", nombre: srv.nombre, monto: srv.precio, servicioId: srv.id, color: srv.color }];
    }
    return [];
  });
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [observaciones, setObservaciones] = React.useState("");

  const total = items.reduce((a, b) => a + (Number(b.monto) || 0), 0);

  // Abono inicial (sincronizado al total hasta que el usuario lo toque)
  const [pagos, setPagos] = React.useState<PagoLine[]>([{ monto: 0, metodo: "Efectivo" }]);
  const touched = React.useRef(false);
  React.useEffect(() => {
    if (!touched.current) setPagos((p) => [{ ...p[0], monto: total }, ...p.slice(1)]);
  }, [total]);

  const abonado = pagos.reduce((a, b) => a + (Number(b.monto) || 0), 0);
  const saldo = total - abonado;

  const paciente = pacientes.find((p) => p.id === pacienteId) ?? null;


  function addItem(c: CatalogItem) {
    setItems((prev) => [...prev, { ...c, uid: newUid() }]);
  }
  function setMonto(u: string, monto: number) {
    setItems((prev) => prev.map((it) => (it.uid === u ? { ...it, monto } : it)));
  }
  function removeItem(u: string) {
    setItems((prev) => prev.filter((it) => it.uid !== u));
  }

  function guardar() {
    if (!pacienteId) return toast.error("Selecciona un paciente");
    if (!psicologoId) return toast.error("Selecciona un psicólogo");
    if (items.length === 0) return toast.error("Agrega al menos un ítem");
    if (abonado > total) return toast.error("El abono no puede superar el total");

    const nueva = addAtencion({
      pacienteId,
      psicologoId,
      citaId: cita?.id,
      fecha: cita?.fecha ?? hoyIso(),
      hora: cita?.hora,
      observaciones,
      items: items.map((it) => ({
        id: newUid(),
        tipo: it.tipo,
        nombre: it.nombre,
        monto: Number(it.monto) || 0,
        servicioId: it.servicioId,
        paqueteId: it.paqueteId,
      })),
      pagos: pagos
        .filter((p) => Number(p.monto) > 0)
        .map((p) => ({ id: newUid(), monto: Number(p.monto), metodo: p.metodo, tipo: "Abono inicial" as const, fecha: hoyIso() })),
    });

    // Crea los paquetes de sesiones adquiridos
    items
      .filter((it) => it.tipo === "Paquete" && it.paqueteId)
      .forEach((it) => {
        addPaquetePaciente({
          pacienteId,
          paqueteId: it.paqueteId!,
          nombre: it.nombre,
          totalSesiones: it.sesiones ?? 0,
          precio: Number(it.monto) || 0,
          fecha: hoyIso(),
          atencionId: nueva.id,
        });
      });

    if (cita) {
      updateCita(cita.id, { estado: "Atendida" });
      setEstadoCita(cita.id, "Atendida");
    }

    toast.success("Atención registrada");
    router.push(`/atenciones/${nueva.id}`);
  }

  // Historial del paciente
  const histAtenciones = paciente
    ? atenciones.filter((a) => a.pacienteId === paciente.id && !a.anulada).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 6)
    : [];
  const histPaquetes = paciente ? paquetesPaciente.filter((pp) => pp.pacienteId === paciente.id) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/atenciones")} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Atenciones</span>
      </div>
      <PageHeader title="Nueva atención" description={cita ? `Desde la cita del ${formatDate(cita.fecha)} · ${cita.hora}` : "Registra una atención y su abono"} />

      <div className="grid gap-6 lg:grid-cols-[1.55fr_minmax(0,1fr)]">
        {/* Columna de pasos */}
        <div className="space-y-4">
          <Step n={1} icon={UserSearch} title="Paciente">
            <PatientSearch value={paciente} onSelect={(p) => setPacienteId(p?.id ?? null)} />
          </Step>

          <Step n={2} icon={Stethoscope} title="Psicólogo">
            <Select value={psicologoId} onValueChange={setPsicologoId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona un psicólogo" /></SelectTrigger>
              <SelectContent>
                {psicologos.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>))}
              </SelectContent>
            </Select>
          </Step>

          <Step n={3} icon={ClipboardCheck} title="Servicios e ítems">
            <div className="space-y-2">
              {items.length === 0 && (
                <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">Aún no hay ítems.</p>
              )}
              {items.map((it) => (
                <div key={it.uid} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${it.color}1a` }}>
                    {it.tipo === "Paquete" ? <Package className="h-4 w-4" style={{ color: it.color }} /> : <Stethoscope className="h-4 w-4" style={{ color: it.color }} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.nombre}</p>
                    {it.tipo === "Paquete" && <p className="text-xs text-muted-foreground">{it.sesiones} sesiones</p>}
                  </div>
                  <div className="relative w-28 shrink-0">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">S/</span>
                    <Input type="number" min={0} step="0.5" value={it.monto} onChange={(e) => setMonto(it.uid, Number(e.target.value))} className="h-9 pl-7 text-right" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(it.uid)} aria-label="Quitar">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
                <Plus className="h-4 w-4" />
                Agregar ítem
              </Button>
            </div>
          </Step>

          <Step n={4} icon={HandCoins} title="Abono inicial">
            <p className="mb-3 text-xs text-muted-foreground">
              El abono es sobre el total. Puede ser parcial y dividirse en varios métodos. Lo que falte quedará como cobro pendiente.
            </p>
            <div className="space-y-2">
              {pagos.map((pg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">S/</span>
                    <Input
                      type="number" min={0} step="0.5" value={pg.monto}
                      onChange={(e) => { touched.current = true; setPagos((p) => p.map((x, j) => (j === i ? { ...x, monto: Number(e.target.value) } : x))); }}
                      className="pl-7"
                    />
                  </div>
                  <Select value={pg.metodo} onValueChange={(v) => { touched.current = true; setPagos((p) => p.map((x, j) => (j === i ? { ...x, metodo: v as MetodoPago } : x))); }}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{METODOS_PAGO.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
                  </Select>
                  {pagos.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => { touched.current = true; setPagos((p) => p.filter((_, j) => j !== i)); }} aria-label="Quitar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => { touched.current = true; setPagos([{ monto: total, metodo: pagos[0]?.metodo ?? "Efectivo" }]); }}>Pagar todo</Button>
              <Button variant="ghost" size="sm" onClick={() => { touched.current = true; setPagos([{ monto: 0, metodo: pagos[0]?.metodo ?? "Efectivo" }]); }}>Sin abono</Button>
              <Button variant="ghost" size="sm" onClick={() => { touched.current = true; setPagos((p) => [...p, { monto: 0, metodo: "Efectivo" }]); }}>+ Dividir método</Button>
            </div>
          </Step>

          <Step n={5} icon={NotebookPen} title="Observaciones">
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} placeholder="Notas de la atención (opcional)" />
          </Step>

          {/* Resumen */}
          <Card>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-xs text-muted-foreground">Total</p><p className="font-heading text-lg font-bold">{formatPEN(total)}</p></div>
                <div><p className="text-xs text-muted-foreground">Abonado</p><p className="font-heading text-lg font-bold text-success">{formatPEN(abonado)}</p></div>
                <div><p className="text-xs text-muted-foreground">Saldo</p><p className={cn("font-heading text-lg font-bold", saldo > 0 ? "text-warning" : "text-muted-foreground")}>{formatPEN(Math.max(0, saldo))}</p></div>
              </div>
              {abonado > total ? (
                <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">El abono supera el total.</p>
              ) : saldo > 0 ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">Se registrará con un cobro pendiente de {formatPEN(saldo)}, que irá a Cuentas por Cobrar.</p>
              ) : total > 0 ? (
                <p className="rounded-lg bg-success/10 px-3 py-2 text-xs text-success">Pago completo: la atención queda saldada.</p>
              ) : null}
              <Button className="w-full bg-brand-gradient text-white" onClick={guardar}>Registrar atención</Button>
            </CardContent>
          </Card>
        </div>

        {/* Columna de historial */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader><CardTitle className="text-base">Historial del paciente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!paciente ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Selecciona o crea un paciente para ver su historial.</p>
              ) : (
                <>
                  {histPaquetes.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paquetes</p>
                      <div className="space-y-1.5">
                        {histPaquetes.map((pp) => {
                          const usadas = citas.filter((c) => c.paquetePacienteId === pp.id && c.estado !== "Cancelada").length;
                          return (
                            <div key={pp.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                              <Package className="h-4 w-4 text-brand" />
                              <span className="flex-1 truncate text-xs">{pp.nombre}</span>
                              <span className="shrink-0 text-xs font-medium">{Math.max(0, pp.totalSesiones - usadas)}/{pp.totalSesiones}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Últimas atenciones</p>
                    {histAtenciones.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">Sin atenciones previas.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {histAtenciones.map((a) => (
                          <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium">{formatDate(a.fecha)}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{atnEstado(a)} · Total {formatPEN(atnTotal(a))}</p>
                            </div>
                            {atnSaldo(a) > 0 && <span className="shrink-0 text-xs font-medium text-warning">Debe {formatPEN(atnSaldo(a))}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ItemPicker open={pickerOpen} onOpenChange={setPickerOpen} onPick={addItem} />
    </div>
  );
}

export default function NuevaAtencionPage() {
  return (
    <React.Suspense fallback={null}>
      <RegistroInner />
    </React.Suspense>
  );
}
