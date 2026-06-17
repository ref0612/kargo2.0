import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck, ScanLine, Bus, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { useKargo } from "@/lib/kargo/store";
import { PhoneFrame } from "@/components/kargo/PhoneFrame";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActivityLog } from "@/components/kargo/ActivityLog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_kargo/wh-loader")({
  head: () => ({
    meta: [
      { title: "Loader (WH1) — Cargador del bus · KARGO" },
      { name: "description", content: "App del cargador del bus: escaneo de bultos en WH1 y generación de manifiesto." },
    ],
  }),
  component: LoaderPage,
});

function LoaderPage() {
  const ot = useKargo((s) => s.ots.find((o) => o.estado === "wh1"));
  const scan = useKargo((s) => s.scanBultoLoader);
  const confirmar = useKargo((s) => s.confirmarCarga);

  const escaneados = ot?.bultosEscaneadosLoader ?? 0;
  const total = ot?.bultos ?? 0;
  const completo = total > 0 && escaneados >= total;

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <PhoneFrame title="Loader · Cargador de bus">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Loader</div>
              <div className="font-semibold">Andrea Pérez · WH1 Pajaritos</div>
            </div>
            <span className="rounded-full bg-bus/10 px-2 py-0.5 text-[10px] font-semibold text-bus">EN BODEGA</span>
          </div>

          {!ot && (
            <div className="rounded-2xl border-2 border-dashed p-8 text-center">
              <PackageCheck size={32} className="mx-auto text-muted-foreground" />
              <div className="mt-3 font-semibold">No hay OTs por cargar</div>
              <div className="text-xs text-muted-foreground">Espera a que el Driver 1 entregue carga en WH1.</div>
            </div>
          )}

          {ot && (
            <>
              <div className="rounded-2xl bg-gradient-to-br from-bus to-bus/70 p-4 text-bus-foreground">
                <div className="text-[10px] uppercase tracking-wider opacity-80">Cargar a bus</div>
                <div className="text-xl font-bold">{ot.id}</div>
                <div className="text-sm opacity-90">Destino: {ot.destino}</div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1"><Bus size={12} /> {ot.bus ?? "Bus sin asignar"}</span>
                  <span className="tabular-nums">{ot.bultos} bultos</span>
                </div>
              </div>

              {!ot.bus && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">
                  <AlertTriangle size={14} className="mt-0.5" />
                  Aún no se asigna bus. Puedes generar manifiesto, pero la OT pasará a tránsito recién cuando el Coordinador asigne bus & Driver 2.
                </div>
              )}

              <div className="rounded-xl border p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-semibold"><PackageCheck size={12} /> Cargados al bus</span>
                  <span className="tabular-nums font-semibold">{escaneados} / {total}</span>
                </div>
                <Progress value={(escaneados / Math.max(1, total)) * 100} className="h-2" />
                <Button className="mt-3 w-full gap-2" size="sm" onClick={() => scan(ot.id, 5)} disabled={completo}>
                  <ScanLine size={14} /> {completo ? "Carga completa" : "Escanear lote (5)"}
                </Button>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border bg-muted/30 p-2">
                {Array.from({ length: total }).map((_, i) => {
                  const done = i < escaneados;
                  return (
                    <div key={i} className={cn("flex items-center justify-between rounded-md px-2 py-1.5 text-[11px]", done && "bg-bus/10 text-bus")}>
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
                  confirmar(ot.id);
                  toast.success(`Manifiesto generado para ${ot.id}`);
                }}
              >
                <FileText size={14} /> Confirmar carga & generar manifiesto
              </Button>
            </>
          )}
        </div>
      </PhoneFrame>

      <div className="space-y-4">
        <div className="kargo-card p-5">
          <div className="text-sm font-semibold">El cargador del bus</div>
          <p className="mt-2 text-xs text-muted-foreground">
            El Loader es responsable de verificar cada bulto que sube al bus en WH1.
            Su confirmación genera el <span className="font-medium text-foreground">Manifiesto de Carga</span>,
            documento que viaja con el Driver 2 y queda disponible en el historial del Merchant.
          </p>
        </div>
        <ActivityLog limit={10} />
      </div>
    </div>
  );
}
