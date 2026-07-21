import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface Kpi {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Variación (%) respecto al periodo anterior. Opcional. */
  delta?: number;
  hint?: string;
  color?: string;
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  const color = kpi.color ?? "var(--brand)";
  const positive = (kpi.delta ?? 0) >= 0;

  return (
    <Card className="relative gap-0 overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {kpi.label}
          </p>
          <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight">
            {kpi.value}
          </p>
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {kpi.delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(kpi.delta)}%
          </span>
        )}
        {kpi.hint && <span className="truncate text-muted-foreground">{kpi.hint}</span>}
      </div>
    </Card>
  );
}
