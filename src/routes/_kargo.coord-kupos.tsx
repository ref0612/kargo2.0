import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Globe2, ArrowRight, MapPinned, AlertTriangle, Bus, Zap,
  BarChart3, Package, TrendingUp, Wifi, WifiOff, Clock,
} from "lucide-react";
import { useKargo, useNetworkKpis } from "@/lib/kargo/store";
import { KpiCard } from "@/components/kargo/KpiCard";
import { StateBadge } from "@/components/kargo/StateBadge";
import { ActivityLog } from "@/components/kargo/ActivityLog";
import { GpsMap } from "@/components/kargo/GpsMap";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { OTEstado } from "@/lib/kargo/types";

export const Route = createFileRoute("/_kargo/coord-kupos")({
  head: () => ({
    meta: [
      { title: "Coordinador Global Kupos · KARGO" },
      { name: "description", content: "Control global de la red: operadores, enrutamiento, alertas y métricas." },
    ],
  }),
  component: KuposPage,
});

const KANBAN_COLS: { key: string; label: string; estados: OTEstado[]; color: string }[] = [
  { key: "sin-asignar",  label: "Sin asignar",   estados: ["creada"],                       color: "text-warning" },
  { key: "con-operador", label: "Con operador",   estados: ["recolectada", "asignada", "wh1"], color: "text-info" },
  { key: "en-transito",  label: "En tránsito",    estados: ["en-transito"],                  color: "text-primary" },
  { key: "finalizadas",  label: "Finalizadas",    estados: ["finalizada"],                   color: "text-success" },
  { key: "alertas",      label: "Con alerta",     estados: ["incidencia", "suspendida"],     color: "text-destructive" },
];

function KuposPage() {
  const ots        = useKargo((s) => s.ots);
  const operadores = useKargo((s) => s.operadores);
  const derivar    = useKargo((s) => s.derivarOperador);
  const suspender  = useKargo((s) => s.suspenderOT);
  const kpis       = useNetworkKpis();
  const [sel, setSel] = useState<Record<string, string>>({});

  const sinDerivar = ots.filter((o) => o.estado === "creada" && !o.operador);
  const enTransito = ots.filter((o) => o.estado === "en-transito");

  // Capacidad por operador
  const capacidadOp = (opId: string) => {
    const op = operadores.find((o) => o.id === opId);
    if (!op) return { used: 0, max: 0, pct: 0 };
    const used = ots.filter((o) => o.operador === opId && o.estado !== "finalizada").length;
    const pct  = Math.round((used / op.capacidadMax) * 100);
    return { used, max: op.capacidadMax, pct };
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1440px] space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Globe2 size={12} /> Coordinador Global · Kupos
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Centro de control — Red Kargo</h1>
          <p className="text-sm text-muted-foreground">
            Visión global de todos los operadores y OTs activas en la red.
          </p>
        </div>
        {kpis.conAlerta > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            <AlertTriangle size={15} /> {kpis.conAlerta} alerta(s) crítica(s) en la red
          </div>
        )}
      </div>

      {/* KPIs red */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="OTs sin asignar"    value={kpis.sinAsignar}    tone="warning"     icon={<Package />} />
        <KpiCard label="En operación"        value={kpis.enOperacion}   tone="primary"     icon={<Zap />} />
        <KpiCard label="En tránsito"         value={kpis.enTransito}    tone="primary"     icon={<Bus />} />
        <KpiCard label="Finalizadas hoy"     value={kpis.finalizadas}   tone="success"     icon={<TrendingUp />} />
        <KpiCard label="Con alerta"          value={kpis.conAlerta}     tone="destructive" icon={<AlertTriangle />} />
      </div>

      {/* Flujo conceptual */}
      <div className="kargo-card p-4">
        <div className="mb-3 text-sm font-semibold">Flujo de asignación Kupos → Operadores</div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { label: "Merchant crea OT",             color: "bg-info/10 text-info border-info/20" },
            { label: "Kupos recibe y clasifica",      color: "bg-primary/10 text-primary border-primary/20" },
            { label: "Asigna a Operador regional",    color: "bg-bus/10 text-bus border-bus/20" },
            { label: "Operador asigna Driver 1",      color: "bg-warning/10 text-warning border-warning/20" },
            { label: "Recolección + WH1",             color: "bg-warning/10 text-warning border-warning/20" },
            { label: "Driver 2 + transporte",         color: "bg-primary/10 text-primary border-primary/20" },
            { label: "Entrega final",                 color: "bg-success/10 text-success border-success/20" },
          ].map((n, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <span className={cn("rounded-md border px-3 py-1.5 font-medium", n.color)}>{n.label}</span>
              {i < arr.length - 1 && <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="enrutamiento">
        <TabsList>
          <TabsTrigger value="enrutamiento">Asignar a operadores</TabsTrigger>
          <TabsTrigger value="operadores">Estado operadores</TabsTrigger>
          <TabsTrigger value="kanban">Kanban global</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="mapa">Mapa operacional</TabsTrigger>
          <TabsTrigger value="metricas">Métricas red</TabsTrigger>
        </TabsList>

        {/* ── ENRUTAMIENTO ─────────────────────────────────────── */}
        <TabsContent value="enrutamiento" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="kargo-card lg:col-span-2">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <div className="text-sm font-semibold">OTs pendientes de asignación ({sinDerivar.length})</div>
                <span className="text-xs text-muted-foreground">Selecciona operador y deriva</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-2 text-left">OT</th>
                      <th className="px-5 py-2 text-left">Merchant</th>
                      <th className="px-5 py-2 text-left">Origen</th>
                      <th className="px-5 py-2 text-left">Destino</th>
                      <th className="px-5 py-2 text-right">Bultos</th>
                      <th className="px-5 py-2 text-left">Prioridad</th>
                      <th className="px-5 py-2 text-left">Operador</th>
                      <th className="px-5 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sinDerivar.map((o, idx) => (
                      <tr key={o.id} className="hover:bg-muted/30">
                        <td className="px-5 py-2 font-mono text-xs font-semibold text-primary">{o.id}</td>
                        <td className="px-5 py-2">{o.merchant}</td>
                        <td className="px-5 py-2">{o.origen}</td>
                        <td className="px-5 py-2">{o.destino}</td>
                        <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                        <td className="px-5 py-2">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            idx === 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                          )}>
                            {idx === 0 ? "⚠ Alta" : "Media"}
                          </span>
                        </td>
                        <td className="px-5 py-2">
                          <Select value={sel[o.id] ?? ""} onValueChange={(v) => setSel({ ...sel, [o.id]: v })}>
                            <SelectTrigger className="h-8 w-48 text-xs">
                              <SelectValue placeholder="Seleccionar operador…" />
                            </SelectTrigger>
                            <SelectContent>
                              {operadores.map((op) => {
                                const cap = capacidadOp(op.id);
                                return (
                                  <SelectItem key={op.id} value={op.id}>
                                    {op.nombre} — {cap.pct}% cap.
                                    {cap.pct >= 90 && " ⚠"}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-5 py-2 text-right">
                          <Button
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            disabled={!sel[o.id]}
                            onClick={() => {
                              const op = operadores.find((x) => x.id === sel[o.id]);
                              derivar(o.id, sel[o.id]);
                              toast.success(`${o.id} derivada`, { description: op?.nombre });
                            }}
                          >
                            Derivar <ArrowRight size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!sinDerivar.length && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          ✓ Todas las OTs están enrutadas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel operadores lateral */}
            <div className="space-y-3">
              <div className="kargo-card p-4">
                <div className="mb-3 text-sm font-semibold flex items-center gap-1.5">
                  <MapPinned size={14} /> Operadores disponibles
                </div>
                <div className="space-y-3">
                  {operadores.map((op) => {
                    const cap = capacidadOp(op.id);
                    return (
                      <div key={op.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{op.nombre}</span>
                          <span className={cn(
                            "tabular-nums font-semibold",
                            cap.pct >= 90 ? "text-destructive" : cap.pct >= 70 ? "text-warning" : "text-success"
                          )}>
                            {cap.used}/{op.capacidadMax} OTs
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700",
                              cap.pct >= 90 ? "bg-destructive" : cap.pct >= 70 ? "bg-warning" : "bg-success"
                            )}
                            style={{ width: `${cap.pct}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground">{op.region} · {op.drivers} drivers · OTIF {op.otif}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Derivadas recientes */}
              <div className="kargo-card p-4">
                <div className="mb-3 text-sm font-semibold">Últimas OTs derivadas</div>
                <div className="space-y-1.5">
                  {ots.filter((o) => o.operador).slice(0, 6).map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-primary">{o.id}</span>
                      <StateBadge estado={o.estado} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── OPERADORES ───────────────────────────────────────── */}
        <TabsContent value="operadores" className="mt-4">
          <div className="kargo-card overflow-x-auto">
            <div className="border-b px-5 py-3 text-sm font-semibold">Estado de operadores de la red</div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 text-left">Operador</th>
                  <th className="px-5 py-2 text-left">Región</th>
                  <th className="px-5 py-2 text-right">OTs asignadas</th>
                  <th className="px-5 py-2 text-right">En recolección</th>
                  <th className="px-5 py-2 text-right">En tránsito</th>
                  <th className="px-5 py-2 text-right">Alertas</th>
                  <th className="px-5 py-2 text-left">Capacidad</th>
                  <th className="px-5 py-2 text-right">OTIF</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {operadores.map((op) => {
                  const opOTs   = ots.filter((o) => o.operador === op.id);
                  const recol   = opOTs.filter((o) => ["recolectada", "asignada"].includes(o.estado)).length;
                  const transito = opOTs.filter((o) => o.estado === "en-transito").length;
                  const alertas  = opOTs.filter((o) => ["incidencia", "suspendida"].includes(o.estado)).length;
                  const cap      = capacidadOp(op.id);
                  return (
                    <tr key={op.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3 font-semibold">{op.nombre}</td>
                      <td className="px-5 py-3 text-muted-foreground">{op.region}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold">{opOTs.length}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{recol}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{transito}</td>
                      <td className="px-5 py-3 text-right">
                        {alertas > 0
                          ? <span className="font-semibold text-destructive">{alertas}</span>
                          : <span className="text-success">0</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full",
                                cap.pct >= 90 ? "bg-destructive" : cap.pct >= 70 ? "bg-warning" : "bg-success"
                              )}
                              style={{ width: `${cap.pct}%` }}
                            />
                          </div>
                          <span className={cn("text-xs tabular-nums font-medium",
                            cap.pct >= 90 ? "text-destructive" : cap.pct >= 70 ? "text-warning" : "text-success"
                          )}>
                            {cap.pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={cn("font-semibold tabular-nums",
                          op.otif >= 97 ? "text-success" : op.otif >= 94 ? "text-warning" : "text-destructive"
                        )}>
                          {op.otif}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── KANBAN GLOBAL ────────────────────────────────────── */}
        <TabsContent value="kanban" className="mt-4">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {KANBAN_COLS.map((col) => {
              const items = ots.filter((o) => col.estados.includes(o.estado));
              return (
                <div key={col.key} className="kargo-card flex min-h-[360px] flex-col">
                  <div className="flex items-center justify-between border-b px-3 py-2.5">
                    <div className={cn("text-xs font-semibold uppercase tracking-wider", col.color)}>
                      {col.label}
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    {items.map((o) => {
                      const op = o.operador ? operadores.find((x) => x.id === o.operador) : null;
                      return (
                        <div
                          key={o.id}
                          className={cn(
                            "rounded-md border bg-surface p-2.5 text-xs shadow-sm hover:border-primary",
                            ["incidencia","suspendida"].includes(o.estado) && "border-l-2 border-l-destructive"
                          )}
                        >
                          <div className="font-mono font-semibold text-primary">{o.id}</div>
                          <div className="mt-0.5 text-muted-foreground">{o.merchant} · {o.destino}</div>
                          {op && <div className="mt-0.5 text-[10px] text-muted-foreground">{op.nombre}</div>}
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
                      );
                    })}
                    {!items.length && (
                      <div className="py-8 text-center text-xs text-muted-foreground">vacío</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── ALERTAS ──────────────────────────────────────────── */}
        <TabsContent value="alertas" className="mt-4">
          <div className="space-y-3">
            {/* Alertas críticas ficticias + las reales del store */}
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <WifiOff size={18} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold">OT-00219 · SurCarga — PARADA_NO_PROGRAMADA</div>
                <div className="mt-0.5 text-xs opacity-80">Bus detenido 25 min en Ruta 7 Sur km 142. Driver 2 no responde.</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-destructive/40 text-xs text-destructive hover:bg-destructive/10"
                onClick={() => { suspender("OT-00129", "PARADA_NO_PROGRAMADA > 25 min"); toast.error("OT suspendida"); }}
              >
                Suspender OT
              </Button>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <Wifi size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold">OT-00233 · LogiExpress — GPS sin señal 12 min</div>
                <div className="mt-0.5 text-xs opacity-80">Bus en zona sin cobertura. Driver notificado por push.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold">SurCarga S.A. — Saturación de capacidad 92%</div>
                <div className="mt-0.5 text-xs opacity-80">
                  Redirigir nuevas OTs de Biobío a Cargo Norte o ExpressRM.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              <Clock size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold">OT-00226 · Cargo Norte — Sin bus disponible para ruta Antofagasta</div>
                <div className="mt-0.5 text-xs opacity-80">Carga en WH1. Merchant debe ser notificado de reprogramación.</div>
              </div>
            </div>

            {/* OTs con alerta real */}
            {ots.filter((o) => ["incidencia", "suspendida"].includes(o.estado)).map((o) => (
              <div key={o.id} className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">{o.id} — {o.estado.toUpperCase()}</div>
                  <div className="mt-0.5 text-xs opacity-80">{o.incidencia ?? "Incidencia registrada"}</div>
                </div>
                <StateBadge estado={o.estado} className="ml-auto" />
              </div>
            ))}

            {kpis.conAlerta === 0 && (
              <div className="rounded-lg border p-8 text-center text-muted-foreground">
                ✓ Sin alertas críticas activas.
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── MAPA ─────────────────────────────────────────────── */}
        <TabsContent value="mapa" className="mt-4">
          <div className="space-y-4">
            <div className="kargo-card overflow-hidden">
              <div className="border-b px-5 py-3 text-sm font-semibold">Mapa operacional global</div>
              {enTransito.length > 0 ? (
                <div className="divide-y">
                  {enTransito.map((o) => {
                    const op = o.operador ? operadores.find((x) => x.id === o.operador) : null;
                    return (
                      <div key={o.id} className="grid grid-cols-[1fr_auto] gap-4 p-4">
                        <GpsMap
                          origen={o.origen}
                          destino={o.destino}
                          progreso={o.progreso}
                          velocidad={85}
                          className="h-32"
                        />
                        <div className="min-w-[180px] space-y-1.5 text-xs">
                          <div className="font-mono font-semibold text-primary">{o.id}</div>
                          <div className="text-muted-foreground">{o.merchant}</div>
                          {op && <div className="text-muted-foreground">{op.nombre}</div>}
                          <StateBadge estado={o.estado} />
                          <div className="tabular-nums font-medium text-primary">{o.progreso}% completado</div>
                          {o.bus && <div className="text-muted-foreground">Bus: {o.bus}</div>}
                          {o.driver2 && <div className="text-muted-foreground">Driver 2: {o.driver2}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">Sin OTs en tránsito.</div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── MÉTRICAS RED ─────────────────────────────────────── */}
        <TabsContent value="metricas" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="kargo-card p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <BarChart3 size={14} className="text-primary" /> OTIF por operador
              </div>
              <div className="space-y-3">
                {[...operadores].sort((a, b) => b.otif - a.otif).map((op) => (
                  <div key={op.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>{op.nombre}</span>
                      <span className={cn(
                        "font-semibold tabular-nums",
                        op.otif >= 97 ? "text-success" : op.otif >= 94 ? "text-warning" : "text-destructive"
                      )}>
                        {op.otif}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700",
                          op.otif >= 97 ? "bg-success" : op.otif >= 94 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${op.otif}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="kargo-card p-5">
              <div className="mb-4 text-sm font-semibold">Resumen de red (mes actual)</div>
              <div className="space-y-2">
                {[
                  { label: "OTs creadas",      val: "1.311" },
                  { label: "OTs entregadas",    val: String(kpis.finalizadas + 1204) },
                  { label: "OTIF global",        val: "97,4%",  color: "text-success" },
                  { label: "Tiempo prom. entrega", val: "27,4 h" },
                  { label: "Incidencias",        val: "23",     color: "text-warning" },
                  { label: "Operadores activos", val: String(operadores.filter((o) => o.activo).length) },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between border-b py-1.5 text-sm last:border-0">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className={cn("font-semibold tabular-nums", r.color)}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ActivityLog limit={8} />
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}