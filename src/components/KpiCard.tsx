import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  delta,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
  delta?: number;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg",
              tone === "primary" && "bg-primary/10 text-primary",
              tone === "warning" && "bg-chart-5/15 text-chart-5",
              tone === "default" && "bg-secondary text-secondary-foreground",
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
              delta > 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
            )}
          >
            {delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="truncate">{hint}</span>}
      </div>
    </Card>
  );
}
