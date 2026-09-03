"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * Campo de monto en soles. A diferencia de un `input type="number"` normal,
 * puede quedar vacío mientras se escribe: así no hay que borrar el "0" antes
 * de teclear el importe. Vacío equivale a 0.
 */
export function MoneyInput({
  value,
  onValueChange,
  className,
  prefijo = true,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (v: number) => void;
  /** Muestra el "S/" dentro del campo. */
  prefijo?: boolean;
}) {
  // Texto que ve el usuario; 0 se muestra como vacío.
  const [texto, setTexto] = React.useState(() => (value ? String(value) : ""));
  const [valorPrevio, setValorPrevio] = React.useState(value);

  // Si el monto cambia desde fuera (p. ej. "Pagar todo"), se refleja aquí.
  if (value !== valorPrevio) {
    setValorPrevio(value);
    if (value !== (Number(texto) || 0)) setTexto(value ? String(value) : "");
  }

  return (
    <div className="relative w-full">
      {prefijo && (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          S/
        </span>
      )}
      <Input
        {...props}
        type="number"
        inputMode="decimal"
        min={0}
        step="0.5"
        value={texto}
        placeholder={props.placeholder ?? "0.00"}
        onChange={(e) => {
          const v = e.target.value;
          setTexto(v);
          setValorPrevio(Number(v) || 0);
          onValueChange(Number(v) || 0);
        }}
        onFocus={(e) => e.currentTarget.select()}
        className={cn(prefijo && "pl-7", className)}
      />
    </div>
  );
}
