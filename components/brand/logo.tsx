import { cn } from "@/lib/utils";

/**
 * Marca "Ser y Crecer" — brote/hoja creciendo dentro de un contenedor suave.
 * Evoca crecimiento personal y bienestar. No depende de imágenes externas.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="syc-grad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand)" />
          <stop offset="1" stopColor="var(--brand-blue)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#syc-grad)" />
      {/* Tallo */}
      <path
        d="M24 35V21"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Hoja izquierda */}
      <path
        d="M24 25c-2.8 0-6.4-1.2-7.8-4.4-.4-.9.3-1.9 1.3-1.8 3.4.3 6.9 2.2 7.5 6"
        fill="white"
        fillOpacity="0.92"
      />
      {/* Hoja derecha (brote superior) */}
      <path
        d="M24 22c0-3.4 1.8-7.2 5.6-8.6.9-.4 1.9.4 1.7 1.4-.7 3.7-2.9 7.6-7.3 8.2"
        fill="white"
      />
    </svg>
  );
}

/** Logo completo: marca + wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" />
      <span className="flex flex-col leading-none">
        <span className="font-heading text-[15px] font-extrabold tracking-tight text-foreground">
          Ser y Crecer
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Consultorio Psicológico
        </span>
      </span>
    </span>
  );
}
