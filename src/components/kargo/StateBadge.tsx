import type { OTEstado } from "@/lib/kargo/types";
import { ESTADO_LABEL } from "@/lib/kargo/types";
import { cn } from "@/lib/utils";

const STYLES: Record<OTEstado, string> = {
  creada: "bg-info/10 text-info border-info/20",
  asignada: "bg-warning/10 text-warning border-warning/20",
  recolectada: "bg-warning/15 text-warning border-warning/30",
  wh1: "bg-bus/10 text-bus border-bus/20",
  "en-transito": "bg-primary/10 text-primary border-primary/20",
  finalizada: "bg-success/10 text-success border-success/20",
  incidencia: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StateBadge({ estado, className }: { estado: OTEstado; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[estado],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {ESTADO_LABEL[estado]}
    </span>
  );
}
