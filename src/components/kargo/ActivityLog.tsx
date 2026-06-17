import { useKargo } from "@/lib/kargo/store";
import { Activity } from "lucide-react";
import { useEffect, useState } from "react";

export function ActivityLog({ limit = 12 }: { limit?: number }) {
  // Avoid hydration mismatch: render log entries only after mount.
  // On the server (and first client paint) we show a stable placeholder.
  const log = useKargo((s) => s.log).slice(0, limit);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="kargo-card flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold">
        <Activity size={16} className="text-primary" /> Eventos en vivo
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-xs">
        {mounted ? (
          log.map((e, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
              <span className="tabular-nums text-muted-foreground shrink-0">{e.time}</span>
              <span className={
                e.level === "error" ? "text-destructive" :
                e.level === "warn"  ? "text-warning" :
                "text-foreground"
              }>{e.msg}</span>
            </div>
          ))
        ) : (
          // Static placeholder during SSR / first paint — no timestamps
          <div className="px-2 py-1.5 text-muted-foreground">Cargando eventos…</div>
        )}
        {mounted && log.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">Sin eventos.</div>
        )}
      </div>
    </div>
  );
}