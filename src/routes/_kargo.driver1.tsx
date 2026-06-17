import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, Package, ScanLine, PenTool, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { useKargo } from "@/lib/kargo/store";
import { PhoneFrame } from "@/components/kargo/PhoneFrame";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActivityLog } from "@/components/kargo/ActivityLog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_kargo/driver1")({
  head: () => ({
    meta: [
      { title: "Driver 1 — Recolección · KARGO" },
      { name: "description", content: "App del conductor de recolección: escaneo y firma de bultos en origen." },
    ],
  }),
  component: Driver1Page,
});

function Driver1Page() {
  const ot = useKargo((s) => s.ots.find((o) => o.estado === "recolectada" || o.estado === "asignada"));
  const scan = useKargo((s) => s.scanBultoD1);
  const firmar = useKargo((s) => s.firmarRecoleccion);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!ot) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [ot?.id]);

  const escaneados = ot?.bultosEscaneadosD1 ?? 0;
  const total = ot?.bultos ?? 0;
  const completo = total > 0 && escaneados >= total;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <PhoneFrame title="Driver 1 · Pickup">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hola</div>
              <div className="font-semibold">Carlos González</div>
            </div>
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">EN RUTA</span>
          </div>

          {!ot && (
            <div className="rounded-2xl border-2 border-dashed p-8 text-center">
              <Truck size={32} className="mx-auto text-muted-foreground" />
              <div className="mt-3 font-semibold">Sin tareas asignadas</div>
              <div className="text-xs text-muted-foreground">Espera la asignación del Coordinador.</div>
            </div>
          )}

          {ot && (
            <>
              <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-4 text-primary-foreground">
                <div className="text-[10px] uppercase tracking-wider opacity-80">Tarea activa</div>
                <div className="text-xl font-bold">{ot.id}</div>
                <div className="text-sm opacity-90">{ot.merchant}</div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {ot.origen}</span>
                  <span className="tabular-nums">⏱ {mm}:{ss}</span>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-semibold"><Package size={12} /> Bultos escaneados</span>
                  <span className="tabular-nums font-semibold">{escaneados} / {total}</span>
                </div>
                <Progress value={(escaneados / Math.max(1, total)) * 100} className="h-2" />
                <Button className="mt-3 w-full gap-2" size="sm" onClick={() => { scan(ot.id, 5); if (escaneados + 5 >= total) toast.success("Todos los bultos escaneados"); }} disabled={completo}>
                  <ScanLine size={14} /> {completo ? "Escaneo completo" : "Escanear lote (5)"}
                </Button>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border bg-muted/30 p-2">
                {Array.from({ length: total }).map((_, i) => {
                  const done = i < escaneados;
                  return (
                    <div key={i} className={cn("flex items-center justify-between rounded-md px-2 py-1.5 text-[11px]", done && "bg-success/10 text-success")}>
                      <span className="font-mono">KARGO-{ot.id.replace("OT-", "")}-{String(i + 1).padStart(3, "0")}</span>
                      {done ? <CheckCircle2 size={12} /> : <span className="text-muted-foreground">○</span>}
                    </div>
                  );
                })}
              </div>

              <Button
                className="w-full gap-2"
                disabled={!completo}
                onClick={() => {
                  firmar(ot.id);
                  toast.success(`Firma capturada · ${ot.id} → WH1`);
                }}
              >
                <PenTool size={14} /> Solicitar firma y cerrar <ArrowRight size={14} />
              </Button>
            </>
          )}
        </div>
      </PhoneFrame>

      <div className="space-y-4">
        <div className="kargo-card p-5">
          <div className="text-sm font-semibold">Flujo del Driver 1</div>
          <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li>1. Recibe asignación del Coordinador zonal.</li>
            <li>2. Llega a origen y escanea bulto por bulto.</li>
            <li>3. Captura firma del Merchant.</li>
            <li>4. La OT pasa automáticamente a <span className="font-medium text-bus">WH1</span>.</li>
          </ol>
        </div>
        <ActivityLog limit={10} />
      </div>
    </div>
  );
}
