import { cn } from "@/lib/utils";
import type { EstadoCita, EstadoPago, EstadoPaciente } from "@/lib/data/types";

const CITA_STYLES: Record<EstadoCita, string> = {
  Agendada: "bg-muted text-muted-foreground",
  Confirmada: "bg-info/12 text-info",
  Atendida: "bg-success/12 text-success",
  "No asistió": "bg-destructive/12 text-destructive",
  Cancelada: "bg-muted text-muted-foreground line-through",
};

const PAGO_STYLES: Record<EstadoPago, string> = {
  Pagado: "bg-success/12 text-success",
  Pendiente: "bg-warning/15 text-warning",
};

const PACIENTE_STYLES: Record<EstadoPaciente, string> = {
  Activo: "bg-success/12 text-success",
  Inactivo: "bg-muted text-muted-foreground",
};

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EstadoCitaBadge({ estado }: { estado: EstadoCita }) {
  return <Pill className={CITA_STYLES[estado]}>{estado}</Pill>;
}

export function EstadoPagoBadge({ estado }: { estado: EstadoPago }) {
  return <Pill className={PAGO_STYLES[estado]}>{estado}</Pill>;
}

export function EstadoPacienteBadge({ estado }: { estado: EstadoPaciente }) {
  return <Pill className={PACIENTE_STYLES[estado]}>{estado}</Pill>;
}
