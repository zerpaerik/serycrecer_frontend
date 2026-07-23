"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EstadoCitaBadge, EstadoPacienteBadge } from "@/components/shared/status-badge";
import { PacienteFormDialog } from "@/components/pacientes/paciente-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDb } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { calcAge, formatDate, initials } from "@/lib/format";

function DatoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function PacienteDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ready = useDbReady();

  const paciente = useDb((s) => s.pacientes.find((p) => p.id === params.id));
  const citas = useDb((s) => s.citas);
  const psicologos = useDb((s) => s.psicologos);
  const servicios = useDb((s) => s.servicios);
  const paquetesPaciente = useDb((s) => s.paquetesPaciente);

  const misPaquetes = React.useMemo(
    () => paquetesPaciente.filter((pp) => pp.pacienteId === params.id),
    [paquetesPaciente, params.id],
  );

  const [editOpen, setEditOpen] = React.useState(false);

  const citasPaciente = React.useMemo(
    () =>
      citas
        .filter((c) => c.pacienteId === params.id)
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [citas, params.id],
  );

  if (ready && !paciente) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-muted-foreground">Paciente no encontrado.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/pacientes">
            <ArrowLeft className="h-4 w-4" />
            Volver a pacientes
          </Link>
        </Button>
      </div>
    );
  }

  if (!paciente) return null;

  const nombre = `${paciente.nombres} ${paciente.apellidos}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Pacientes</span>
      </div>

      <PageHeader title={nombre}>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Datos del paciente */}
        <Card className="lg:col-span-1">
          <CardHeader className="items-center text-center">
            <Avatar className="mx-auto h-16 w-16">
              <AvatarFallback className="bg-brand/10 text-lg font-bold text-brand">
                {initials(nombre)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-2 text-lg">{nombre}</CardTitle>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                {calcAge(paciente.fechaNacimiento)} años · {paciente.sexo}
              </span>
              <EstadoPacienteBadge estado={paciente.estado} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DatoItem icon={UserRound} label="Documento" value={`${paciente.tipoDoc} ${paciente.numDoc}`} />
            <DatoItem icon={Phone} label="Teléfono" value={paciente.telefono} />
            <DatoItem icon={Mail} label="Correo" value={paciente.email} />
            <DatoItem icon={MapPin} label="Dirección" value={paciente.direccion} />
            <DatoItem
              icon={ShieldAlert}
              label="Contacto de emergencia"
              value={
                paciente.contactoNombre
                  ? `${paciente.contactoNombre}${paciente.contactoTelefono ? " · " + paciente.contactoTelefono : ""}`
                  : undefined
              }
            />
          </CardContent>
        </Card>

        {/* Motivo + historial de citas */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Motivo de consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {paciente.motivoConsulta || "Sin motivo registrado."}
              </p>
            </CardContent>
          </Card>

          {misPaquetes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-brand" />
                  Paquetes de sesiones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {misPaquetes.map((pp) => {
                  const usadas = citas.filter((c) => c.paquetePacienteId === pp.id && c.estado !== "Cancelada").length;
                  const restantes = Math.max(0, pp.totalSesiones - usadas);
                  const pct = (usadas / Math.max(1, pp.totalSesiones)) * 100;
                  return (
                    <div key={pp.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{pp.nombre}</span>
                        <span className="shrink-0 tabular-nums">
                          <span className="font-semibold text-brand">{restantes}</span>
                          <span className="text-muted-foreground"> / {pp.totalSesiones}</span>
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{usadas} sesiones usadas · {restantes} disponibles</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-brand" />
                Historial de citas ({citasPaciente.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {citasPaciente.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Este paciente aún no tiene citas.
                </p>
              ) : (
                <div className="divide-y">
                  {citasPaciente.map((c) => {
                    const psi = psicologos.find((p) => p.id === c.psicologoId);
                    const srv = servicios.find((s) => s.id === c.servicioId);
                    return (
                      <div key={c.id} className="flex items-center gap-4 px-6 py-3">
                        <div className="w-24 shrink-0 text-sm">
                          <p className="font-medium">{formatDate(c.fecha)}</p>
                          <p className="text-xs text-muted-foreground">{c.hora}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{srv?.nombre ?? "—"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {psi?.nombre ?? "—"}
                          </p>
                        </div>
                        <EstadoCitaBadge estado={c.estado} />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PacienteFormDialog open={editOpen} onOpenChange={setEditOpen} paciente={paciente} />
    </div>
  );
}
