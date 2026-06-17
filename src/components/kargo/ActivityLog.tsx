import { useKargo } from "@/lib/kargo/store";
import { Activity } from "lucide-react";

export function ActivityLog({ limit = 12 }: { limit?: number }) {
  const log = useKargo((s) => s.log).slice(0, limit);
  return (
    <div className="kargo-card flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold">
        <Activity size={16} className="text-primary" /> Eventos en vivo
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-xs">
        {log.map((e, i) => (
          <div key={i} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
            <span className="tabular-nums text-muted-foreground">{e.time}</span>
            <span className="text-foreground">{e.msg}</span>
          </div>
        ))}
        {log.length === 0 && <div className="p-4 text-center text-muted-foreground">Sin eventos.</div>}
      </div>
    </div>
  );
}
