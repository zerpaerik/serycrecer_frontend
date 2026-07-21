import { CalendarCheck2, HeartPulse, ShieldCheck } from "lucide-react";
import { LogoMark } from "./logo";

const HIGHLIGHTS = [
  { icon: CalendarCheck2, label: "Agenda de citas y control de asistencia" },
  { icon: HeartPulse, label: "Historia clínica y evolución por sesión" },
  { icon: ShieldCheck, label: "Confidencialidad por rol de acceso" },
];

/** Panel lateral del login — calmo, con la marca y beneficios clave. */
export function LoginArtwork() {
  return (
    <div className="relative hidden overflow-hidden bg-brand-gradient lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Formas suaves de fondo */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-20 -top-24 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
      </div>

      <div className="relative flex items-center gap-3 text-white">
        <LogoMark className="h-11 w-11 drop-shadow" />
        <div className="leading-none">
          <p className="font-heading text-lg font-extrabold">Ser y Crecer</p>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/80">
            Consultorio Psicológico
          </p>
        </div>
      </div>

      <div className="relative max-w-md text-white">
        <h1 className="font-heading text-3xl font-extrabold leading-tight xl:text-4xl">
          Acompañamos el bienestar de tus pacientes.
        </h1>
        <p className="mt-3 text-sm text-white/85">
          Gestiona citas, atenciones, historia clínica y pagos desde un solo
          lugar, con calma y orden.
        </p>

        <ul className="mt-8 space-y-3">
          {HIGHLIGHTS.map((h) => (
            <li key={h.label} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <h.icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm font-medium text-white/95">{h.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/70">
        © {new Date().getFullYear()} Ser y Crecer · Lima, Perú
      </p>
    </div>
  );
}
