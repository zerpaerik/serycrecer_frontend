import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Emblema de la marca "Ser y Crecer" (logo real del Centro neuropsicológico).
 * Imagen a color con fondo transparente: `public/brand/logo-mark.png`.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo-mark.png"
      alt="Ser y Crecer"
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

/**
 * Logo completo (emblema + wordmark) para el login: PNG real
 * `public/brand/logo.png`; si faltara, cae en el emblema + nombre.
 */
export function LogoFull({ className }: { className?: string }) {
  const [error, setError] = React.useState(false);

  if (!error) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/logo.png"
        alt="Centro neuropsicológico Ser y Crecer"
        className={cn("h-auto w-full object-contain", className)}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <LogoMark className="h-20 w-20" />
      <p className="mt-3 font-heading text-xl font-extrabold tracking-tight text-brand">
        Ser y Crecer
      </p>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Centro neuropsicológico
      </p>
    </div>
  );
}

/** Marca + wordmark en línea (barra lateral / encabezados). */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" />
      <span className="flex flex-col leading-none">
        <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Centro neuropsicológico
        </span>
        <span className="font-heading text-[16px] font-extrabold tracking-tight text-brand">
          Ser y Crecer
        </span>
      </span>
    </span>
  );
}
