"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Figura blanca (persona con brazos en alto), estilo del logo. */
function Persona({ x, foot, h }: { x: number; foot: number; h: number }) {
  const headR = h * 0.15;
  const headCY = foot - h + headR;
  const shoulderY = foot - h * 0.62;
  const hipY = foot - h * 0.4;
  const handY = headCY - headR * 0.4;
  const sw = h * 0.13;
  const armDX = h * 0.34;
  const legDX = h * 0.17;
  return (
    <g stroke="#ffffff" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx={x} cy={headCY} r={headR} fill="#ffffff" stroke="none" />
      {/* torso */}
      <line x1={x} y1={headCY + headR} x2={x} y2={hipY} />
      {/* brazos en alto */}
      <path d={`M ${x - armDX} ${handY} L ${x} ${shoulderY} L ${x + armDX} ${handY}`} />
      {/* piernas */}
      <path d={`M ${x - legDX} ${foot} L ${x} ${hipY} L ${x + legDX} ${foot}`} />
    </g>
  );
}

/**
 * Marca "Ser y Crecer" — recreación del logo del Centro neuropsicológico:
 * aro teal + aro dorado, pinceladas de color y figuras blancas celebrando.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="syc-disc">
          <circle cx="32" cy="32" r="21.5" />
        </clipPath>
      </defs>

      {/* Aros */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="#14a89c" strokeWidth="4" />
      <circle cx="32" cy="32" r="24.5" fill="none" stroke="#f4b21f" strokeWidth="3" />

      {/* Pinceladas de color dentro del disco */}
      <g clipPath="url(#syc-disc)">
        <rect x="9" y="9" width="46" height="46" fill="#4fa64a" />
        <ellipse cx="42" cy="16" rx="22" ry="12" fill="#e8774a" transform="rotate(-6 42 16)" />
        <ellipse cx="26" cy="50" rx="24" ry="12" fill="#2b83c2" transform="rotate(-6 26 50)" />
      </g>

      {/* Figuras (2 adultos al centro, 2 niños a los lados) */}
      <Persona x={20} foot={45} h={17} />
      <Persona x={28} foot={46} h={26} />
      <Persona x={38} foot={46} h={29} />
      <Persona x={46} foot={45} h={18} />
    </svg>
  );
}

/**
 * Logo completo para el login: usa el PNG real (`/brand/logo.png`) si existe;
 * si no, cae en el emblema SVG + nombre. Así, al colocar el archivo aparece solo.
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

/** Logo completo: marca + wordmark. */
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
