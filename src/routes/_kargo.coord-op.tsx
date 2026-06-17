import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, Bus, AlertTriangle, Layers, UserCheck } from "lucide-react";
import { useKargo } from "@/lib/kargo/store";
import { KpiCard } from "@/components/kargo/KpiCard";
import { StateBadge } from "@/components/kargo/StateBadge";
import { ActivityLog } from "@/components/kargo/ActivityLog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { OT, OTEstado } from "@/lib/kargo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_kargo/coord-op")({
  head: () => ({
    meta: [
      { title: "Coordinador Zonal · KARGO" },
      { name: "description", content: "Asignación de Driver 1, asignación de bus y Kanban zonal." },
    ],
  }),
  component: CoordOpPage,
});

const DRIVERS = ["Juan Martínez", "Carlos González", "Luis Gómez", "María Rojas"];
const DRIVERS2 = ["Pedro López", "Roberto Vera", "Andrés Soto"];
const BUSES = ["AB-CD-12", "EF-GH-23", "IJ-KL-34", "KL-MN-45"];

const COLS: { key: string; label: string; estados: OTEstado[]; tone: string }[] = [
  { key: "creada", label: "Por asignar", estados: ["creada"], tone: "text-info" },
  { key: "recoleccion", label: "Recolección", estados: ["recolectada", "asignada"], tone: "text-warning" },
  { key: "wh1", label: "Warehouse 1", estados: ["wh1"], tone: "text-bus" },
  { key: "transito", label: "En tránsito", estados: ["en-transito"], tone: "text-primary" },
  { key: "final", label: "Entregadas", estados: ["finalizada"], tone: "text-success" },
];

function CoordOpPage() {
  const ots = useKargo((s) => s.ots);
  const asignarD1 = useKargo((s) => s.asignarDriver1);
  const asignarBus = useKargo((s) => s.asignarBus);
  const [busFor, setBusFor] = useState<OT | null>(null);
  const [bus, setBus] = useState(BUSES[0]);
  const [d2, setD2] = useState(DRIVERS2[0]);
  const [selOt, setSelOt] = useState<string | null>(null);
  const [selDriver, setSelDriver] = useState<string | null>(null);

  const kpis = {
    porAsignar: ots.filter((o) => o.estado === "creada").length,
    recol: ots.filter((o) => o.estado === "recolectada").length,
    wh1: ots.filter((o) => o.estado === "wh1").length,
    transito: ots.filter((o) => o.estado === "en-transito").length,
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Coordinador Zonal · Op. RM Centro</div>
        <h1 className="text-2xl font-semibold tracking-tight">Operaciones Zonales</h1>
      </div>

      {/* alerts */}
      {kpis.porAsignar > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
          <AlertTriangle size={16} /> {kpis.porAsignar} OT(s) derivadas requieren Driver 1.
        </div>
      )}
      {kpis.wh1 > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-bus/30 bg-bus/10 px-4 py-2.5 text-sm text-bus">
          <Bus size={16} /> {kpis.wh1} OT(s) en WH1 esperando bus y Driver 2.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Por asignar D1" value={kpis.porAsignar} icon={<Truck />} tone="warning" />
        <KpiCard label="En recolección" value={kpis.recol} icon={<Truck />} tone="warning" />
        <KpiCard label="En WH1" value={kpis.wh1} icon={<Layers />} tone="bus" />
        <KpiCard label="En tránsito" value={kpis.transito} icon={<Bus />} tone="primary" />
      </div>

      <Tabs defaultValue="asignacion">
        <TabsList>
          <TabsTrigger value="asignacion">Asignación D1</TabsTrigger>
          <TabsTrigger value="bus">Asignación de Bus</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="asignacion" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="kargo-card lg:col-span-2">
              <div className="border-b px-5 py-3 text-sm font-semibold">OTs derivadas — seleccionar Driver 1</div>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-5 py-2 text-left">OT</th><th className="px-5 py-2 text-left">Merchant</th><th className="px-5 py-2 text-left">Origen</th><th className="px-5 py-2 text-right">Bultos</th><th></th></tr>
                </thead>
                <tbody className="divide-y">
                  {ots.filter((o) => o.estado === "creada").map((o) => (
                    <tr key={o.id} className={cn("hover:bg-muted/30", selOt === o.id && "bg-primary/5")}>
                      <td className="px-5 py-2 font-mono text-xs font-semibold text-primary">{o.id}</td>
                      <td className="px-5 py-2">{o.merchant}</td>
                      <td className="px-5 py-2">{o.origen}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                      <td className="px-5 py-2 text-right">
                        <Button size="sm" variant={selOt === o.id ? "default" : "outline"} className="h-7 text-xs" onClick={() => setSelOt(o.id)}>
                          {selOt === o.id ? "Seleccionada" : "Seleccionar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!ots.some((o) => o.estado === "creada") && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay OTs por asignar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={cn("kargo-card p-5 transition", !selOt && "opacity-60")}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><UserCheck size={14} /> Drivers disponibles</div>
              <div className="text-xs text-muted-foreground mb-3">{selOt ? `Asignar a ${selOt}` : "Selecciona una OT"}</div>
              <div className="space-y-2">
                {DRIVERS.map((d) => (
                  <button
                    key={d}
                    disabled={!selOt}
                    onClick={() => setSelDriver(d)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition",
                      selDriver === d ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{d.split(" ").map((n) => n[0]).join("")}</span>
                    {d}
                  </button>
                ))}
              </div>
              <Button
                className="mt-4 w-full"
                disabled={!selOt || !selDriver}
                onClick={() => {
                  if (selOt && selDriver) {
                    asignarD1(selOt, selDriver);
                    toast.success(`${selOt} asignada a ${selDriver}`);
                    setSelOt(null);
                    setSelDriver(null);
                  }
                }}
              >Confirmar asignación</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bus" className="mt-4">
          <div className="kargo-card">
            <div className="border-b px-5 py-3 text-sm font-semibold">OTs en WH1 — asignar bus & Driver 2</div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-2 text-left">OT</th><th className="px-5 py-2 text-left">Merchant</th><th className="px-5 py-2 text-left">Destino</th><th className="px-5 py-2 text-right">Bultos</th><th className="px-5 py-2 text-left">Estado</th><th></th></tr>
              </thead>
              <tbody className="divide-y">
                {ots.filter((o) => o.estado === "wh1").map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-5 py-2 font-mono text-xs font-semibold text-bus">{o.id}</td>
                    <td className="px-5 py-2">{o.merchant}</td>
                    <td className="px-5 py-2">{o.destino}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                    <td className="px-5 py-2"><StateBadge estado={o.estado} /></td>
                    <td className="px-5 py-2 text-right">
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setBusFor(o)}>
                        <Bus size={12} /> Asignar bus
                      </Button>
                    </td>
                  </tr>
                ))}
                {!ots.some((o) => o.estado === "wh1") && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay OTs en WH1.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Dialog open={!!busFor} onOpenChange={(o) => !o && setBusFor(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Asignar bus a {busFor?.id}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Bus / patente</div>
                  <Select value={bus} onValueChange={setBus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BUSES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Driver 2 (conductor del bus)</div>
                  <Select value={d2} onValueChange={setD2}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DRIVERS2.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="rounded-md bg-bus/10 p-3 text-xs text-bus">
                  Si el Loader ya generó el manifiesto, la OT pasará automáticamente a "En tránsito".
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  if (busFor) {
                    asignarBus(busFor.id, bus, d2);
                    toast.success(`Bus ${bus} asignado a ${busFor.id}`);
                    setBusFor(null);
                  }
                }}>Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {COLS.map((c) => {
              const items = ots.filter((o) => c.estados.includes(o.estado));
              return (
                <div key={c.key} className="kargo-card flex min-h-[400px] flex-col">
                  <div className="flex items-center justify-between border-b px-3 py-2.5">
                    <div className={cn("text-xs font-semibold uppercase tracking-wider", c.tone)}>{c.label}</div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">{items.length}</span>
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    {items.map((o) => (
                      <div key={o.id} className="rounded-md border bg-surface p-2.5 text-xs shadow-sm hover:border-primary">
                        <div className="font-mono font-semibold text-primary">{o.id}</div>
                        <div className="mt-0.5 text-muted-foreground">{o.merchant} · {o.destino}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {o.driver1 && <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">D1: {o.driver1.split(" ")[0]}</span>}
                          {o.bus && <span className="rounded-full bg-bus/10 px-1.5 py-0.5 text-[10px] text-bus">{o.bus}</span>}
                          {o.estado === "en-transito" && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{o.progreso}%</span>}
                        </div>
                      </div>
                    ))}
                    {!items.length && <div className="py-6 text-center text-xs text-muted-foreground">vacío</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <ActivityLog limit={8} />
    </div>
  );
}
