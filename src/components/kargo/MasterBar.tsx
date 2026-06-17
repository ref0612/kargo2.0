import { Link, useRouterState } from "@tanstack/react-router";
import {
  Store, Globe2, Building2, Truck, PackageCheck, Bus, Wand2, RotateCcw,
} from "lucide-react";
import { useKargo } from "@/lib/kargo/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ROLES = [
  { to: "/merchant",    label: "Merchant",          icon: Store,        badge: "Falabella", sep: false },
  { to: "/coord-kupos", label: "Coord. Kupos",       icon: Globe2,       badge: "Global",    sep: true  },
  { to: "/coord-op",    label: "Coord. Operador",    icon: Building2,    badge: "Zonal",     sep: false },
  { to: "/driver1",     label: "Driver 1",           icon: Truck,        badge: "Pickup",    sep: true  },
  { to: "/wh-loader",   label: "Loader",             icon: PackageCheck, badge: "WH1",       sep: false },
  { to: "/driver2",     label: "Driver 2",           icon: Bus,          badge: "Bus",       sep: false },
] as const;

export function MasterBar() {
  const pathname  = useRouterState({ select: (s) => s.location.pathname });
  const generar   = useKargo((s) => s.generarFlujoEjemplo);
  const reset     = useKargo((s) => s.resetDemo);

  // ── Select scalars individually — never return a new object from a selector.
  // Returning { a, b, c } creates a new reference every render → infinite loop.
  const total    = useKargo((s) => s.ots.length);
  const transito = useKargo((s) => s.ots.filter((o) => o.estado === "en-transito").length);
  const alertas  = useKargo((s) => s.ots.filter((o) => ["incidencia", "suspendida"].includes(o.estado)).length);

  return (
    <div className="kargo-bar sticky top-0 z-50 flex h-12 items-center gap-0.5 overflow-x-auto px-3">
      {/* Logo */}
      <span className="mr-3 flex flex-shrink-0 items-center gap-2 text-sm font-bold tracking-tight">
        <span className="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-black text-primary-foreground">
          K
        </span>
        <span className="text-white">KARGO</span>
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/60">
          v2.0
        </span>
      </span>

      <div className="mx-2 h-5 w-px flex-shrink-0 bg-white/15" />

      {/* Nav tabs */}
      {ROLES.map((r) => {
        const active = pathname === r.to;
        const Icon   = r.icon;
        return (
          <div key={r.to} className="flex items-center">
            {r.sep && <div className="mx-1.5 h-4 w-px flex-shrink-0 bg-white/15" />}
            <Link
              to={r.to}
              className={cn(
                "group inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] font-medium transition",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white/90"
              )}
            >
              <Icon size={13} />
              {r.label}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-medium transition",
                active ? "bg-white/20" : "bg-white/10 text-white/50"
              )}>
                {r.badge}
              </span>
            </Link>
          </div>
        );
      })}

      {/* Right side */}
      <div className="ml-auto flex flex-shrink-0 items-center gap-2 pl-4">
        <div className="hidden items-center gap-3 text-[11px] text-white/60 md:flex">
          <span className="tabular-nums">{total} OTs</span>
          <span className="flex items-center gap-1 text-primary">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            {transito} en ruta
          </span>
          {alertas > 0 && (
            <span className="font-medium text-destructive">
              ⚠ {alertas} alerta{alertas > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant="secondary"
          className="h-7 gap-1.5 text-xs"
          onClick={() => {
            generar();
            toast.success("Flujo de ejemplo iniciado", {
              description: "La OT avanzará por todos los roles automáticamente.",
            });
          }}
        >
          <Wand2 size={12} /> Generar flujo
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => {
            reset();
            toast("Demo reiniciado");
          }}
        >
          <RotateCcw size={12} /> Reset
        </Button>
      </div>
    </div>
  );
}