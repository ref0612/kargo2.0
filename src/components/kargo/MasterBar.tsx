import { Link, useRouterState } from "@tanstack/react-router";
import { Store, Globe2, MapPinned, Truck, PackageCheck, Bus, Wand2, RotateCcw } from "lucide-react";
import { useKargo } from "@/lib/kargo/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ROLES = [
  { to: "/merchant", label: "Merchant", icon: Store, badge: "Falabella" },
  { to: "/coord-kupos", label: "Kupos · Global", icon: Globe2, badge: "Coord" },
  { to: "/coord-op", label: "Operador Zonal", icon: MapPinned, badge: "RM" },
  { to: "/driver1", label: "Driver 1", icon: Truck, badge: "Pickup" },
  { to: "/wh-loader", label: "Loader", icon: PackageCheck, badge: "WH1" },
  { to: "/driver2", label: "Driver 2", icon: Bus, badge: "Bus" },
] as const;

export function MasterBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const generar = useKargo((s) => s.generarFlujoEjemplo);
  const reset = useKargo((s) => s.resetDemo);
  const total = useKargo((s) => s.ots.length);

  return (
    <div className="kargo-bar sticky top-0 z-50 flex h-12 items-center gap-1 overflow-x-auto px-3">
      <span className="mr-3 flex items-center gap-2 text-sm font-bold tracking-tight">
        <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground text-[11px]">K</span>
        KARGO <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/70">Master</span>
      </span>
      <div className="mx-2 h-5 w-px bg-white/15" />
      {ROLES.map((r) => {
        const active = pathname === r.to;
        const Icon = r.icon;
        return (
          <Link
            key={r.to}
            to={r.to}
            className={cn(
              "group inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] font-medium transition",
              active ? "bg-primary text-primary-foreground" : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon size={14} /> {r.label}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", active ? "bg-white/25" : "bg-white/10")}>{r.badge}</span>
          </Link>
        );
      })}
      <div className="ml-auto flex items-center gap-2 pl-3">
        <span className="hidden text-[11px] text-white/60 md:inline">{total} OTs activas</span>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 gap-1.5 text-xs"
          onClick={() => {
            generar();
            toast.success("Flujo de ejemplo iniciado", { description: "Verás la OT avanzar por todos los roles." });
          }}
        >
          <Wand2 size={13} /> Generar flujo
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          onClick={() => {
            reset();
            toast("Demo reiniciado");
          }}
        >
          <RotateCcw size={13} /> Reset
        </Button>
      </div>
    </div>
  );
}
