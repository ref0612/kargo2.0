import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "destructive" | "bus";
  className?: string;
}

const TONE: Record<NonNullable<KpiProps["tone"]>, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  bus: "text-bus",
};

export function KpiCard({ label, value, hint, icon, tone = "default", className }: KpiProps) {
  return (
    <div className={cn("kargo-kpi flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between text-xs font-medium tracking-wide uppercase text-muted-foreground">
        <span>{label}</span>
        {icon && <span className={cn("size-4", TONE[tone])}>{icon}</span>}
      </div>
      <div className={cn("text-3xl font-semibold tabular-nums", TONE[tone])}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
