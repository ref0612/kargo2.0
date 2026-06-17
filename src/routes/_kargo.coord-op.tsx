import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Truck, Bus, AlertTriangle, Layers, UserCheck, PackageCheck,
  ScanLine, MapPin, CheckCircle2, XCircle, Clock, FileText, RouteIcon,
} from "lucide-react";
import { useKargo } from "@/lib/kargo/store";
import { KpiCard } from "@/components/kargo/KpiCard";
import { StateBadge } from "@/components/kargo/StateBadge";
import { ActivityLog } from "@/components/kargo/ActivityLog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { OT, OTEstado } from "@/lib/kargo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_kargo/coord-op")({
  head: () => ({
    meta: [
      { title: "Coordinador Operador · KARGO" },
      { name: "description", content: "Gestión operativa: asignación D1, picking WH1, buses y despacho en destino." },
    ],
  }),
  component: CoordOpPage,
});

const DRIVERS1 = ["Juan Martínez", "Carlos González", "Luis Gómez", "Ana Fuentes", "Roberto Vega"];
const DRIVERS2 = ["Pedro López", "Roberto Vera", "Andrés Soto"];
const BUSES    = ["AB-CD-12 · Turbus · Stgo→Temuco", "EF-GH-23 · Pullman · Stgo→Concepción", "IJ-KL-34 · Turbus · Stgo→Valparaíso", "KL-MN-45 · Tur Bus · Stgo→Arica"];
const BUSES_ID = ["AB-CD-12", "EF-GH-23", "IJ-KL-34", "KL-MN-45"];

const KANBAN_COLS: { key: string; label: string; estados: OTEstado[]; color: string }[] = [
  { key: "sin-driver",   label: "Sin Driver",    estados: ["creada"],                        color: "text-warning" },
  { key: "recoleccion",  label: "Recolección",   estados: ["recolectada", "asignada"],       color: "text-info" },
  { key: "wh1",          label: "WH1 / Picking", estados: ["wh1"],                           color: "text-bus" },
  { key: "transito",     label: "En tránsito",   estados: ["en-transito"],                   color: "text-primary" },
  { key: "finalizadas",  label: "Entregadas",    estados: ["finalizada"],                    color: "text-success" },
];

function CoordOpPage() {
  const ots        = useKargo((s) => s.ots);
  const operadores = useKargo((s) => s.operadores);
  const asignarD1  = useKargo((s) => s.asignarDriver1);
  const asignarBus = useKargo((s) => s.asignarBus);
  const scanLoader  = useKargo((s) => s.scanBultoLoader);
  const confirmar   = useKargo((s) => s.confirmarCarga);
  const reportar    = useKargo((s) => s.reportarIncidencia);

  // Operador activo simulado: op-rm
  const MI_OPERADOR = "op-rm";
  const miNombre    = operadores.find((o) => o.id === MI_OPERADOR)?.nombre ?? "Transportes Sur Ltda.";

  // OTs de este operador (las asignadas por Kupos)
  const misOTs     = ots.filter((o) => o.operador === MI_OPERADOR);
  const sinDriver  = misOTs.filter((o) => o.estado === "creada");
  const enRecol    = misOTs.filter((o) => ["recolectada", "asignada"].includes(o.estado));
  const enWh1      = misOTs.filter((o) => o.estado === "wh1");
  const enTransito = misOTs.filter((o) => o.estado === "en-transito");

  // Asignación D1
  const [selOt, setSelOt]         = useState<string | null>(null);
  const [selDriver, setSelDriver] = useState<string | null>(null);

  // Asignación Bus
  const [busFor, setBusFor]       = useState<OT | null>(null);
  const [busIdx, setBusIdx]       = useState(0);
  const [d2, setD2]               = useState(DRIVERS2[0]);

  // Despacho destino
  type DespachoModal = { ot: OT; tipo: "A" | "B" } | null;
  const [despacho, setDespacho]   = useState<DespachoModal>(null);

  const kpis = {
    total:       misOTs.length,
    sinDriver:   sinDriver.length,
    recol:       enRecol.length,
    wh1:         enWh1.length,
    transito:    enTransito.length,
    alertas:     misOTs.filter((o) => ["incidencia","suspendida"].includes(o.estado)).length,
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1440px] space-y-5 p-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Coordinador Operador · {miNombre}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Operaciones zonales</h1>
        <p className="text-sm text-muted-foreground">
          OTs asignadas por Kupos. Tu responsabilidad: Driver 1, picking WH1, bus y despacho final.
        </p>
      </div>

      {/* Alertas operacionales */}
      {kpis.sinDriver > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
          <AlertTriangle size={16} />
          {kpis.sinDriver} OT(s) recibidas de Kupos sin Driver 1 asignado. Asigna ahora.
        </div>
      )}
      {kpis.wh1 > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-bus/30 bg-bus/10 px-4 py-2.5 text-sm text-bus">
          <Bus size={16} />
          {kpis.wh1} OT(s) en WH1 esperando bus y Driver 2.
        </div>
      )}
      {kpis.alertas > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle size={16} />
          {kpis.alertas} OT(s) con incidencia activa. Revisar pestaña Incidencias.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="OTs recibidas de Kupos" value={kpis.total}     tone="default" />
        <KpiCard label="Sin Driver asignado"     value={kpis.sinDriver} tone="warning" icon={<Truck />} />
        <KpiCard label="En WH1 / picking"        value={kpis.wh1}       tone="bus"     icon={<Layers />} />
        <KpiCard label="En tránsito"             value={kpis.transito}  tone="primary" icon={<Bus />} />
        <KpiCard label="Alertas"                 value={kpis.alertas}   tone="destructive" icon={<AlertTriangle />} />
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="asignacion-d1">Asignación D1</TabsTrigger>
          <TabsTrigger value="picking">Picking WH1</TabsTrigger>
          <TabsTrigger value="bus">Asignación Bus</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="drivers">Mis Drivers</TabsTrigger>
          <TabsTrigger value="despacho">Despacho destino</TabsTrigger>
          <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
        </TabsList>

        {/* ── DASHBOARD ─────────────────────────────────────────── */}
        <TabsContent value="dashboard" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="kargo-card lg:col-span-2">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <div className="text-sm font-semibold">OTs activas del operador</div>
                <StateBadge estado="en-transito" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-2 text-left">OT</th>
                      <th className="px-5 py-2 text-left">Merchant</th>
                      <th className="px-5 py-2 text-left">Destino</th>
                      <th className="px-5 py-2 text-right">Bultos</th>
                      <th className="px-5 py-2 text-left">Estado</th>
                      <th className="px-5 py-2 text-left">Driver 1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {misOTs.slice(0, 8).map((o) => (
                      <tr key={o.id} className="hover:bg-muted/30">
                        <td className="px-5 py-2 font-mono text-xs font-semibold text-primary">{o.id}</td>
                        <td className="px-5 py-2">{o.merchant}</td>
                        <td className="px-5 py-2">{o.destino}</td>
                        <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                        <td className="px-5 py-2"><StateBadge estado={o.estado} /></td>
                        <td className="px-5 py-2 text-muted-foreground">{o.driver1 ?? "—"}</td>
                      </tr>
                    ))}
                    {!misOTs.length && (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay OTs asignadas aún.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              {/* Drivers disponibles */}
              <div className="kargo-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <UserCheck size={14} /> Drivers disponibles
                </div>
                <div className="space-y-2">
                  {DRIVERS1.map((d) => {
                    const ocupado = misOTs.find((o) => o.driver1 === d && o.estado !== "finalizada");
                    return (
                      <div key={d} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {d.split(" ").map((n) => n[0]).join("")}
                          </span>
                          {d}
                        </div>
                        <span className={ocupado ? "text-warning" : "text-success"}>
                          {ocupado ? `● OT ${ocupado.id}` : "● Libre"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <ActivityLog limit={8} />
            </div>
          </div>
        </TabsContent>

        {/* ── ASIGNACIÓN D1 ─────────────────────────────────────── */}
        <TabsContent value="asignacion-d1" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="kargo-card lg:col-span-2">
              <div className="border-b px-5 py-3 text-sm font-semibold">
                OTs recibidas de Kupos — asignar Driver 1
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 text-left">OT</th>
                    <th className="px-5 py-2 text-left">Merchant</th>
                    <th className="px-5 py-2 text-left">Dirección recolección</th>
                    <th className="px-5 py-2 text-right">Bultos</th>
                    <th className="px-5 py-2 text-left">Espera</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sinDriver.map((o, idx) => (
                    <tr
                      key={o.id}
                      className={cn("hover:bg-muted/30 cursor-pointer", selOt === o.id && "bg-primary/5")}
                      onClick={() => setSelOt(o.id)}
                    >
                      <td className="px-5 py-2 font-mono text-xs font-semibold text-primary">{o.id}</td>
                      <td className="px-5 py-2">{o.merchant}</td>
                      <td className="px-5 py-2 text-xs text-muted-foreground">{o.origen}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                      <td className="px-5 py-2">
                        <span className={cn("text-xs font-medium", idx === 0 ? "text-destructive" : "text-warning")}>
                          {idx === 0 ? "42 min" : idx === 1 ? "18 min" : "8 min"}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-right">
                        <Button
                          size="sm"
                          variant={selOt === o.id ? "default" : "outline"}
                          className="h-7 text-xs"
                          onClick={(e) => { e.stopPropagation(); setSelOt(o.id); }}
                        >
                          {selOt === o.id ? "✓ Seleccionada" : "Seleccionar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!sinDriver.length && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay OTs por asignar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={cn("kargo-card p-5 transition", !selOt && "opacity-60")}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <UserCheck size={14} /> Drivers disponibles
              </div>
              <div className="mb-3 text-xs text-muted-foreground">
                {selOt ? `Asignando Driver 1 a ${selOt}` : "Selecciona una OT primero"}
              </div>
              <div className="space-y-2">
                {DRIVERS1.map((d) => {
                  const ocupado = misOTs.find((o) => o.driver1 === d && !["finalizada","creada"].includes(o.estado));
                  return (
                    <button
                      key={d}
                      disabled={!selOt || !!ocupado}
                      onClick={() => setSelDriver(d)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition",
                        selDriver === d ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted",
                        ocupado && "opacity-40"
                      )}
                    >
                      <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {d.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <div>
                        <div className="font-medium">{d}</div>
                        {ocupado
                          ? <div className="text-[10px] text-warning">● Ocupado · {ocupado.id}</div>
                          : <div className="text-[10px] text-success">● Disponible</div>
                        }
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button
                className="mt-4 w-full"
                disabled={!selOt || !selDriver}
                onClick={() => {
                  if (selOt && selDriver) {
                    asignarD1(selOt, selDriver);
                    toast.success(`${selOt} asignada a ${selDriver}`, {
                      description: "Driver notificado por push. Estado → Recolección.",
                    });
                    setSelOt(null);
                    setSelDriver(null);
                  }
                }}
              >
                Confirmar asignación
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── PICKING WH1 ───────────────────────────────────────── */}
        <TabsContent value="picking" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* OTs en WH1 */}
            <div className="kargo-card">
              <div className="border-b px-5 py-3 text-sm font-semibold">
                OTs en Warehouse 1 — Control de picking
              </div>
              <div className="divide-y">
                {enWh1.map((o) => {
                  const esc = o.bultosEscaneadosLoader ?? 0;
                  const diff = o.bultos - esc;
                  const conforme = esc >= o.bultos && o.manifiestoGenerado;
                  return (
                    <div key={o.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs font-semibold text-bus">{o.id}</span>
                          <span className="ml-2 text-sm text-muted-foreground">{o.merchant} · {o.destino}</span>
                        </div>
                        {conforme
                          ? <span className="flex items-center gap-1 text-xs font-medium text-success"><CheckCircle2 size={13}/> Conforme</span>
                          : diff > 0
                            ? <span className="flex items-center gap-1 text-xs font-medium text-destructive"><XCircle size={13}/> -{diff} bultos</span>
                            : <span className="text-xs text-muted-foreground">Pendiente</span>
                        }
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Declarados: <strong>{o.bultos}</strong></span>
                        <span>·</span>
                        <span>Escaneados: <strong className={esc < o.bultos ? "text-warning" : "text-success"}>{esc}</strong></span>
                        {o.bus && <span className="ml-auto text-bus">Bus: {o.bus}</span>}
                      </div>
                      <Progress value={(esc / Math.max(1, o.bultos)) * 100} className="h-1.5" />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          disabled={esc >= o.bultos}
                          onClick={() => { scanLoader(o.id, 5); toast("Bultos escaneados"); }}
                        >
                          <ScanLine size={12} /> Escanear lote
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          disabled={esc < o.bultos || !!o.manifiestoGenerado}
                          onClick={() => {
                            confirmar(o.id);
                            toast.success(`Manifiesto generado · ${o.id}`);
                          }}
                        >
                          <FileText size={12} /> {o.manifiestoGenerado ? "Manifiesto OK ✓" : "Generar manifiesto"}
                        </Button>
                        {diff > 0 && esc > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => { reportar(o.id, `INCIDENCIA_WH1: ${diff} bulto(s) faltante(s)`); toast.error("Incidencia WH1 registrada"); }}
                          >
                            <AlertTriangle size={12} /> Incidencia WH1
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!enWh1.length && (
                  <div className="p-8 text-center text-muted-foreground">No hay OTs en WH1.</div>
                )}
              </div>
            </div>

            {/* Checklist QA */}
            <div className="kargo-card p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <PackageCheck size={14} /> Checklist QA — Loader 1
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { ok: true,  label: "Cantidad de bultos verificada" },
                  { ok: true,  label: "Estado físico de bultos" },
                  { ok: true,  label: "Etiquetas escaneadas correctamente" },
                  { ok: enWh1.every((o) => (o.bultosEscaneadosLoader ?? 0) >= o.bultos), label: "Sin diferencias de bultos" },
                  { ok: enWh1.every((o) => o.manifiestoGenerado),  label: "Manifiesto(s) generado(s)" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2",
                      item.ok ? "bg-success/10" : "bg-destructive/10"
                    )}
                  >
                    <span className={item.ok ? "text-success" : "text-destructive"}>{item.label}</span>
                    {item.ok
                      ? <CheckCircle2 size={14} className="text-success" />
                      : <XCircle size={14} className="text-destructive" />
                    }
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                <div className="font-semibold mb-1">Corner case — INCIDENCIA_WH1</div>
                Si la cantidad escaneada no coincide con los declarados, la OT se bloquea
                y se notifica al Merchant y a Kupos automáticamente.
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── ASIGNACIÓN BUS ────────────────────────────────────── */}
        <TabsContent value="bus" className="mt-4">
          <div className="kargo-card">
            <div className="border-b px-5 py-3 text-sm font-semibold">
              OTs en WH1 — asignar bus & Driver 2
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 text-left">OT</th>
                  <th className="px-5 py-2 text-left">Merchant</th>
                  <th className="px-5 py-2 text-left">Destino</th>
                  <th className="px-5 py-2 text-right">Bultos</th>
                  <th className="px-5 py-2 text-left">Manifiesto</th>
                  <th className="px-5 py-2 text-left">Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y">
                {enWh1.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-5 py-2 font-mono text-xs font-semibold text-bus">{o.id}</td>
                    <td className="px-5 py-2">{o.merchant}</td>
                    <td className="px-5 py-2">{o.destino}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                    <td className="px-5 py-2">
                      {o.manifiestoGenerado
                        ? <span className="text-xs text-success font-medium">✓ Generado</span>
                        : <span className="text-xs text-warning">Pendiente Loader</span>
                      }
                    </td>
                    <td className="px-5 py-2"><StateBadge estado={o.estado} /></td>
                    <td className="px-5 py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        onClick={() => setBusFor(o)}
                      >
                        <Bus size={12} /> Asignar bus
                      </Button>
                    </td>
                  </tr>
                ))}
                {!enWh1.length && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay OTs en WH1.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Dialog open={!!busFor} onOpenChange={(o) => !o && setBusFor(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Asignar bus — {busFor?.id}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Bus / patente</div>
                  <Select value={String(busIdx)} onValueChange={(v) => setBusIdx(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUSES.map((b, i) => <SelectItem key={b} value={String(i)}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Driver 2 (conductor)</div>
                  <Select value={d2} onValueChange={setD2}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DRIVERS2.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {!busFor?.manifiestoGenerado && (
                  <div className="rounded-md bg-warning/10 p-3 text-xs text-warning">
                    ⚠ El Loader aún no generó el manifiesto. La OT quedará en WH1 hasta que se complete.
                  </div>
                )}
                {busFor?.manifiestoGenerado && (
                  <div className="rounded-md bg-success/10 p-3 text-xs text-success">
                    ✓ Manifiesto listo. La OT pasará automáticamente a "En tránsito".
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  if (busFor) {
                    asignarBus(busFor.id, BUSES_ID[busIdx], d2);
                    toast.success(`Bus ${BUSES_ID[busIdx]} asignado a ${busFor.id}`);
                    setBusFor(null);
                  }
                }}>
                  Confirmar asignación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── KANBAN OPERATIVO ──────────────────────────────────── */}
        <TabsContent value="kanban" className="mt-4">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {KANBAN_COLS.map((col) => {
              const items = misOTs.filter((o) => col.estados.includes(o.estado));
              return (
                <div key={col.key} className="kargo-card flex min-h-[380px] flex-col">
                  <div className="flex items-center justify-between border-b px-3 py-2.5">
                    <div className={cn("text-xs font-semibold uppercase tracking-wider", col.color)}>
                      {col.label}
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    {items.map((o) => (
                      <div
                        key={o.id}
                        className={cn(
                          "rounded-md border bg-surface p-2.5 text-xs shadow-sm hover:border-primary",
                          ["incidencia","suspendida"].includes(o.estado) && "border-l-2 border-l-destructive"
                        )}
                      >
                        <div className="font-mono font-semibold text-primary">{o.id}</div>
                        <div className="mt-0.5 text-muted-foreground">{o.merchant} · {o.destino}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {o.driver1 && (
                            <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">
                              D1: {o.driver1.split(" ")[0]}
                            </span>
                          )}
                          {o.bus && (
                            <span className="rounded-full bg-bus/10 px-1.5 py-0.5 text-[10px] text-bus">
                              {o.bus}
                            </span>
                          )}
                          {o.estado === "en-transito" && (
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                              {o.progreso}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {!items.length && (
                      <div className="py-8 text-center text-xs text-muted-foreground">vacío</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── DRIVERS ───────────────────────────────────────────── */}
        <TabsContent value="drivers" className="mt-4">
          <div className="kargo-card overflow-x-auto">
            <div className="border-b px-5 py-3 text-sm font-semibold">Drivers del operador</div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 text-left">Driver</th>
                  <th className="px-5 py-2 text-left">Tipo</th>
                  <th className="px-5 py-2 text-left">Estado</th>
                  <th className="px-5 py-2 text-left">OT actual</th>
                  <th className="px-5 py-2 text-left">GPS</th>
                  <th className="px-5 py-2 text-left">Última acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {DRIVERS1.map((d) => {
                  const ot = misOTs.find((o) => o.driver1 === d && !["finalizada","creada"].includes(o.estado));
                  return (
                    <tr key={d} className="hover:bg-muted/30">
                      <td className="px-5 py-2 font-medium">{d}</td>
                      <td className="px-5 py-2 text-muted-foreground">Driver 1</td>
                      <td className="px-5 py-2">
                        {ot
                          ? <span className="text-warning font-medium">● En recolección</span>
                          : <span className="text-success font-medium">● Disponible</span>
                        }
                      </td>
                      <td className="px-5 py-2 font-mono text-xs text-primary">{ot?.id ?? "—"}</td>
                      <td className="px-5 py-2">
                        <span className="text-xs text-success">● OK</span>
                      </td>
                      <td className="px-5 py-2 text-xs text-muted-foreground">hace {Math.floor(Math.random() * 12) + 1} min</td>
                    </tr>
                  );
                })}
                {DRIVERS2.map((d) => {
                  const ot = misOTs.find((o) => o.driver2 === d && o.estado === "en-transito");
                  return (
                    <tr key={d} className="hover:bg-muted/30">
                      <td className="px-5 py-2 font-medium">{d}</td>
                      <td className="px-5 py-2 text-muted-foreground">Driver 2</td>
                      <td className="px-5 py-2">
                        {ot
                          ? <span className="text-primary font-medium">● En tránsito</span>
                          : <span className="text-success font-medium">● Disponible</span>
                        }
                      </td>
                      <td className="px-5 py-2 font-mono text-xs text-primary">{ot?.id ?? "—"}</td>
                      <td className="px-5 py-2">
                        <span className="text-xs text-success">● OK</span>
                      </td>
                      <td className="px-5 py-2 text-xs text-muted-foreground">hace {Math.floor(Math.random() * 5) + 1} min</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── DESPACHO EN DESTINO ───────────────────────────────── */}
        <TabsContent value="despacho" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="kargo-card">
              <div className="border-b px-5 py-3 text-sm font-semibold">
                OTs en Terminal Destino (WH2) — Entrega final
              </div>
              <div className="divide-y">
                {[...misOTs.filter((o) => o.estado === "finalizada"), ...enTransito.slice(0, 2)].map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-mono text-xs font-semibold text-primary">{o.id}</div>
                      <div className="text-sm text-muted-foreground">{o.merchant} · {o.destino}</div>
                      <span className={cn(
                        "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                        o.modalidad === "B"
                          ? "bg-bus/10 text-bus"
                          : "bg-info/10 text-info"
                      )}>
                        {o.modalidad === "B" ? "B — Entrega en bodega" : "A — Retiro WH2"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {o.estado === "finalizada"
                        ? <span className="text-xs text-success font-medium">✓ Entregada</span>
                        : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() => setDespacho({ ot: o, tipo: o.modalidad ?? "A" })}
                          >
                            <RouteIcon size={12} /> Despachar
                          </Button>
                        )
                      }
                    </div>
                  </div>
                ))}
                {misOTs.filter((o) => ["finalizada","en-transito"].includes(o.estado)).length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">No hay OTs en destino.</div>
                )}
              </div>
            </div>

            {/* Reglas de entrega */}
            <div className="kargo-card p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <MapPin size={14} /> Reglas de entrega final (§3.5)
              </div>
              <div className="space-y-3 text-xs">
                <div className="rounded-md bg-info/10 p-3 border border-info/20 text-info">
                  <div className="font-semibold mb-1">Opción A — Retiro en Warehouse 2</div>
                  <ul className="space-y-1 list-disc list-inside text-info/80">
                    <li>Cliente retira carga en terminal destino.</li>
                    <li>Cargo por almacenamiento desde día N+1.</li>
                    <li>RUT receptor debe coincidir con el registrado.</li>
                  </ul>
                </div>
                <div className="rounded-md bg-bus/10 p-3 border border-bus/20 text-bus">
                  <div className="font-semibold mb-1">Opción B — Entrega en bodega cliente</div>
                  <ul className="space-y-1 list-disc list-inside text-bus/80">
                    <li>Driver 3 lleva la carga hasta la bodega del receptor.</li>
                    <li>Si receptor no está → dejar con vecino, reagendar o retornar a WH2.</li>
                    <li>Máximo 2 intentos antes de generar devolución.</li>
                  </ul>
                </div>
                <div className="rounded-md bg-warning/10 p-3 border border-warning/20 text-warning">
                  <div className="font-semibold mb-1">Corner cases</div>
                  <ul className="space-y-1 list-disc list-inside text-warning/80">
                    <li>RUT receptor no coincide → bloquear entrega, notificar Merchant.</li>
                    <li>Bultos con daño visible → foto obligatoria + incidencia.</li>
                    <li>Plazo WH2 vencido (3 días) → devolución automática.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Modal despacho */}
          <Dialog open={!!despacho} onOpenChange={(o) => !o && setDespacho(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar despacho — {despacho?.ot.id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="rounded-md bg-muted p-3">
                  <div><strong>Merchant:</strong> {despacho?.ot.merchant}</div>
                  <div><strong>Destino:</strong> {despacho?.ot.destino}</div>
                  <div><strong>Bultos:</strong> {despacho?.ot.bultos}</div>
                  <div><strong>Modalidad:</strong> {despacho?.tipo === "B" ? "B — Entrega en bodega" : "A — Retiro WH2"}</div>
                </div>
                <div className="rounded-md bg-success/10 p-3 text-xs text-success">
                  Al confirmar, la OT pasa a estado FINALIZADA y el Merchant es notificado.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDespacho(null)}>Cancelar</Button>
                <Button onClick={() => {
                  toast.success(`OT ${despacho?.ot.id} entregada`, {
                    description: despacho?.tipo === "B" ? "Entrega en bodega cliente confirmada." : "Retiro en WH2 confirmado.",
                  });
                  setDespacho(null);
                }}>
                  Confirmar entrega
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── INCIDENCIAS ───────────────────────────────────────── */}
        <TabsContent value="incidencias" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="kargo-card">
              <div className="border-b px-5 py-3 text-sm font-semibold">Incidencias activas</div>
              <div className="divide-y">
                {misOTs.filter((o) => ["incidencia","suspendida"].includes(o.estado)).map((o) => (
                  <div key={o.id} className="flex items-start gap-3 p-4">
                    <AlertTriangle size={16} className="mt-0.5 text-destructive flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-mono text-xs font-semibold text-primary">{o.id}</div>
                      <div className="text-sm text-muted-foreground">{o.incidencia ?? "Incidencia registrada"}</div>
                      <div className="mt-1 flex gap-2">
                        <StateBadge estado={o.estado} />
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={10} /> Reportada hace 25 min
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => { toast.success(`Escalando ${o.id} a Kupos`); }}
                    >
                      Escalar a Kupos
                    </Button>
                  </div>
                ))}
                {/* Incidencia WH1 estática de ejemplo */}
                {enWh1.some((o) => (o.bultosEscaneadosLoader ?? 0) < o.bultos) && (
                  <div className="flex items-start gap-3 p-4">
                    <AlertTriangle size={16} className="mt-0.5 text-warning flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-mono text-xs font-semibold text-primary">INCIDENCIA_WH1</div>
                      <div className="text-sm text-muted-foreground">Diferencia en recepción WH1. Bultos faltantes detectados.</div>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-warning">
                        <Clock size={10} /> Pendiente investigación
                      </span>
                    </div>
                  </div>
                )}
                {!misOTs.some((o) => ["incidencia","suspendida"].includes(o.estado)) && !enWh1.some((o) => (o.bultosEscaneadosLoader ?? 0) < o.bultos) && (
                  <div className="p-8 text-center text-muted-foreground">✓ Sin incidencias activas.</div>
                )}
              </div>
            </div>

            <div className="kargo-card p-5">
              <div className="mb-3 text-sm font-semibold">Tipos de incidencia (Tech Doc §3.4)</div>
              <div className="space-y-2 text-xs">
                {[
                  { flag: "INCIDENCIA_WH1",        desc: "Diferencia de bultos en recepción Warehouse 1", nivel: "Medio" },
                  { flag: "PARADA_NO_PROGRAMADA",   desc: "Bus detenido >20 min fuera de terminal",         nivel: "Alto" },
                  { flag: "GPS_SIN_SEÑAL",           desc: "Sin puntos GPS >10 min en ruta activa",          nivel: "Medio" },
                  { flag: "DAÑO_PREVIO",             desc: "Daño visible en bulto al momento de recolección", nivel: "Bajo" },
                  { flag: "HOLD_COORDINACION",       desc: "OT congelada manualmente por Kupos/Operador",    nivel: "—" },
                  { flag: "SUSPENDIDA",              desc: "Accidente o falla grave. OT requiere resolución", nivel: "Crítico" },
                ].map((inc) => (
                  <div key={inc.flag} className="rounded-md border p-2.5">
                    <div className="flex items-center justify-between">
                      <code className="font-semibold text-bus">{inc.flag}</code>
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        inc.nivel === "Crítico" ? "bg-destructive/10 text-destructive" :
                        inc.nivel === "Alto"    ? "bg-destructive/10 text-destructive" :
                        inc.nivel === "Medio"   ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {inc.nivel}
                      </span>
                    </div>
                    <div className="mt-0.5 text-muted-foreground">{inc.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ActivityLog limit={8} />
    </div>
    </div>
  );
}