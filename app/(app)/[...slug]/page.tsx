import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { findNavItem, groupLabelForHref } from "@/lib/nav";

/** Qué se construirá en cada módulo (roadmap de fases siguientes). */
const ROADMAP: Record<string, string[]> = {
  "/citas": [
    "Calendario por día y semana",
    "Agendar cita: paciente + psicólogo + servicio + hora",
    "Estados: confirmada, atendida, no asistió, reprogramada",
  ],
  "/pacientes": [
    "Ficha del paciente (DNI/CE, contacto, emergencia)",
    "Historial de citas, pagos y asistencia",
    "Alta rápida desde la agenda",
  ],
  "/atenciones": [
    "Registrar la sesión a partir de una cita",
    "Enlace con historia clínica y cobro",
    "Listado por día y por psicólogo",
  ],
  "/historia-clinica": [
    "Apertura de historia por paciente",
    "Evolución por sesión (motivo, diagnóstico, plan)",
    "Acceso confidencial (solo psicólogo tratante)",
  ],
  "/asistencia": [
    "Marcar asistió / no asistió / tardanza",
    "Reporte de inasistencias por paciente",
  ],
  "/pagos": [
    "Registro de pago (efectivo, Yape/Plin, tarjeta)",
    "Estado pagado / pendiente y comprobante",
    "Arqueo de caja diario",
  ],
  "/cobrar": ["Cuentas por cobrar por paciente", "Sesiones pendientes de pago"],
  "/reportes": [
    "Ingresos por período",
    "Sesiones por psicólogo y tasa de asistencia",
    "Exportación a CSV",
  ],
  "/administrativo/usuarios": ["Gestión de usuarios y roles"],
  "/administrativo/psicologos": ["Psicólogos: especialidad y horarios"],
  "/administrativo/servicios": ["Servicios y tarifas de sesión"],
  "/administrativo/configuracion": ["Datos del consultorio y preferencias"],
};

export default async function EnConstruccionPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const href = "/" + slug.join("/");
  const item = findNavItem(href);
  const group = groupLabelForHref(href);
  const Icon = item?.icon ?? Hammer;
  const titulo = item?.label ?? "Módulo";
  const puntos = ROADMAP[href] ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient-soft">
        <Icon className="h-7 w-7 text-brand" />
      </span>

      {group && (
        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {group}
        </p>
      )}
      <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight">{titulo}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Este módulo forma parte del plan y se construirá en las próximas fases.
        La base del sistema (login, roles, navegación y tema) ya está lista.
      </p>

      {puntos.length > 0 && (
        <Card className="mt-8 w-full max-w-md p-6 text-left">
          <p className="mb-3 text-sm font-semibold">Qué incluirá:</p>
          <ul className="space-y-2">
            {puntos.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {p}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Button asChild variant="outline" className="mt-8">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
      </Button>
    </div>
  );
}
