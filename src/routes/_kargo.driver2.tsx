import { createFileRoute } from "@tanstack/react-router";
import { Bus, Route as RouteIcon, AlertTriangle, FileText, Gauge, Clock } from "lucide-react";
import { useKargo } from "@/lib/kargo/store";
import { PhoneFrame } from "@/components/kargo/PhoneFrame";
import { GpsMap } from "@/components/kargo/GpsMap";
import { Button } from "@/components/ui/button";
import { ActivityLog } from "@/components/kargo/ActivityLog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_kargo/driver2")({
  head: () => ({
    meta: [
      { title: "Driver 2 — Conductor del bus · KARGO" },
      { name: "description", content: "App del conductor del bus: viaje en vivo, manifiesto y reporte de incidentes." },
    ],
  }),
  component: Driver2Page,
});

function Driver2Page() {
  const ot = useKargo((s) => s.ots.find((o) => o.estado === "en-transito"));
  const reportar = useKargo((s) => s.reportarIncidencia);

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <PhoneFrame title="Driver 2 · Bus interurbano">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Conductor del bus</div>
              <div className="font-semibold">Pedro López · {ot?.bus ?? "Sin bus"}</div>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">EN RUTA</span>
          </div>

          {!ot && (
            <div className="rounded-2xl border-2 border-dashed p-8 text-center">
              <Bus size={32} className="mx-auto text-muted-foreground" />
              <div className="mt-3 font-semibold">Sin viajes activos</div>
              <div className="text-xs text-muted-foreground">Espera asignación de bus & OT.</div>
            </div>
          )}

          {ot && (
            <Tabs defaultValue="viaje">
              <TabsList className="w-full">
                <TabsTrigger value="viaje" className="flex-1 text-xs"><RouteIcon size={12} className="mr-1" />Viaje</TabsTrigger>
                <TabsTrigger value="manifesto" className="flex-1 text-xs"><FileText size={12} className="mr-1" />Manifiesto</TabsTrigger>
                <TabsTrigger value="incidente" className="flex-1 text-xs"><AlertTriangle size={12} className="mr-1" />Incidente</TabsTrigger>
              </TabsList>
              <TabsContent value="viaje" className="space-y-3 pt-3">
                <GpsMap origen={ot.origen} destino={ot.destino} progreso={ot.progreso} velocidad={85} className="h-44" />
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md border p-2"><div className="text-[10px] text-muted-foreground flex items-center gap-1"><Gauge size={10}/>Progreso</div><div className="font-semibold tabular-nums">{ot.progreso}%</div></div>
                  <div className="rounded-md border p-2"><div className="text-[10px] text-muted-foreground">Recorrido</div><div className="font-semibold tabular-nums">{Math.round((ot.progreso ?? 0) * 6.78)}/678 km</div></div>
                  <div className="rounded-md border p-2"><div className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10}/>ETA</div><div className="font-semibold">16/05 07:30</div></div>
                </div>
                <div className="rounded-md bg-primary/5 p-2.5 text-[11px] text-muted-foreground">
                  <div className="font-semibold text-foreground">{ot.id}</div>
                  Viaje {ot.origen} → {ot.destino}. Mantén GPS activo. La carga viaja sellada bajo manifiesto.
                </div>
              </TabsContent>
              <TabsContent value="manifesto" className="pt-3">
                <div className="rounded-xl border p-3 text-xs">
                  <div className="font-semibold">Bultos bajo custodia · {ot.bultos}</div>
                  <div className="mt-2 max-h-44 overflow-y-auto space-y-1">
                    {Array.from({ length: ot.bultos }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1">
                        <span className="font-mono">#{String(i + 1).padStart(3, "0")} KARGO-{ot.id.replace("OT-", "")}-{String(i + 1).padStart(3, "0")}</span>
                        <span className="text-success">✓</span>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" className="mt-3 w-full" onClick={() => toast.success("Manifiesto descargado")}>Descargar manifiesto</Button>
                </div>
              </TabsContent>
              <TabsContent value="incidente" className="pt-3">
                <div className="space-y-2">
                  {["Retraso por tránsito", "Pinchazo / mecánico", "Daño visible en carga"].map((m) => (
                    <Button
                      key={m}
                      variant="outline"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => { reportar(ot.id, m); toast.error(`Incidencia reportada: ${m}`); }}
                    >
                      <AlertTriangle size={12} className="text-destructive" /> {m}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </PhoneFrame>

      <div className="space-y-4">
        <div className="kargo-card p-5">
          <div className="text-sm font-semibold flex items-center gap-1.5"><Bus size={14} className="text-primary" /> Conductor del bus</div>
          <p className="mt-2 text-xs text-muted-foreground">
            El Driver 2 traslada físicamente la carga entre terminales. Su app prioriza
            <span className="font-medium text-foreground"> tracking GPS en vivo</span>,
            el manifiesto firmado por el Loader y un canal rápido para reportar incidencias.
          </p>
        </div>
        <ActivityLog limit={10} />
      </div>
    </div>
  );
}
