import { cn } from "@/lib/utils";
import type { EstadoCita, EstadoPago, EstadoPaciente, MetodoPago } from "@/lib/data/types";

/** Abreviatura y color de cada método de pago (chips estilo intimas). */
export const METODO_ABBR: Record<MetodoPago, string> = {
  Efectivo: "EF",
  Yape: "YP",
  Plin: "PL",
  Tarjeta: "TJ",
  Transferencia: "TR",
};
const METODO_COLOR: Record<MetodoPago, string> = {
  Efectivo: "#4fa64a",
  Yape: "#8b5cf6",
  Plin: "#14a89c",
  Tarjeta: "#2b83c2",
  Transferencia: "#f4b21f",
};

const CITA_STYLES: Record<EstadoCita, string> = {
  Agendada: "bg-muted text-muted-foreground",
  Confirmada: "bg-info/12 text-info",
  Atendida: "bg-success/12 text-success",
  "No asistió": "bg-destructive/12 text-destructive",
  Cancelada: "bg-muted text-muted-foreground line-through",
};

const PAGO_STYLES: Record<EstadoPago, string> = {
  Pagado: "bg-success/12 text-success",
  Parcial: "bg-info/12 text-info",
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

/** Chips de métodos de pago usados (EF/YP/TJ/PL/TR). */
export function MetodoChips({ metodos }: { metodos: string[] }) {
  if (!metodos.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {metodos.map((m) => {
        const key = m as MetodoPago;
        const color = METODO_COLOR[key] ?? "var(--muted-foreground)";
        return (
          <span
            key={m}
            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: `${color}1f`, color }}
            title={m}
          >
            {METODO_ABBR[key] ?? m.slice(0, 2).toUpperCase()}
          </span>
        );
      })}
    </span>
  );
}
