import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell, Plus, Search, Package, Truck, AlertTriangle, FileText, Download,
  Filter, TrendingUp, MapPin, Clock, Gauge, Bus, ArrowUpRight, ShieldCheck,
  LayoutDashboard, RotateCcw, Receipt, ChevronRight,
} from "lucide-react";
import { useKargo } from "@/lib/kargo/store";
import { StateBadge } from "@/components/kargo/StateBadge";
import { KpiCard } from "@/components/kargo/KpiCard";
import { GpsMap } from "@/components/kargo/GpsMap";
import { ActivityLog } from "@/components/kargo/ActivityLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { OT } from "@/lib/kargo/types";

export const Route = createFileRoute("/_kargo/merchant")({
  head: () => ({
    meta: [
      { title: "Merchant — KARGO" },
      { name: "description", content: "Panel del Merchant: crear OTs, tracking GPS en vivo y manifiesto." },
    ],
  }),
  component: MerchantPage,
});

type Section = "dashboard" | "ordenes" | "seguimiento" | "documentos" | "reportes" | "incidencias" | "devoluciones" | "facturacion";

const NAV: { id: Section; label: string; icon: React.ReactNode; badge?: (n: number) => number | null }[] = [
  { id: "dashboard",    label: "Dashboard",       icon: <LayoutDashboard size={15} /> },
  { id: "ordenes",      label: "Órdenes",          icon: <Truck size={15} /> },
  { id: "seguimiento",  label: "Seguimiento",      icon: <MapPin size={15} /> },
  { id: "documentos",   label: "Documentos",       icon: <FileText size={15} /> },
  { id: "reportes",     label: "Reportes",         icon: <TrendingUp size={15} /> },
  { id: "incidencias",  label: "Incidencias",      icon: <AlertTriangle size={15} />, badge: (n) => n || null },
  { id: "devoluciones", label: "Devoluciones",     icon: <RotateCcw size={15} /> },
  { id: "facturacion",  label: "Facturación",      icon: <Receipt size={15} /> },
];

function MerchantPage() {
  const ots       = useKargo((s) => s.ots);
  const createOT  = useKargo((s) => s.createOT);
  const [section, setSection]     = useState<Section>("dashboard");
  const [search, setSearch]       = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  const kpis = useMemo(() => ({
    activas:    ots.filter((o) => o.estado !== "finalizada" && o.estado !== "incidencia").length,
    recol:      ots.filter((o) => o.estado === "recolectada" || o.estado === "asignada").length,
    transito:   ots.filter((o) => o.estado === "en-transito").length,
    incidencias:ots.filter((o) => o.estado === "incidencia").length,
    entregadas: ots.filter((o) => o.estado === "finalizada").length,
    total:      ots.length,
  }), [ots]);

  const filtered = ots.filter(
    (o) => !search || `${o.id} ${o.destino} ${o.origen}`.toLowerCase().includes(search.toLowerCase())
  );

  const selected = ots.find((o) => o.id === selectedId)
    ?? ots.find((o) => o.estado === "en-transito")
    ?? ots[0];

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden">
      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="flex w-52 flex-shrink-0 flex-col border-r bg-surface">
        {/* Create button */}
        <div className="p-3">
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full gap-1.5 justify-center">
                <Plus size={13} /> Nueva OT
              </Button>
            </DialogTrigger>
            <CrearOTDialog onCreate={(data) => {
              const ot = createOT(data);
              setOpenCreate(false);
              toast.success(`OT ${ot.id} creada`, { description: "Enrutada a Coordinador Kupos." });
            }} />
          </Dialog>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 px-2 pb-4">
          {NAV.map((item) => {
            const badgeVal = item.badge?.(kpis.incidencias);
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className={active ? "text-primary" : "text-muted-foreground"}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {badgeVal != null && (
                  <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                    {badgeVal}
                  </span>
                )}
                {active && <ChevronRight size={12} className="text-primary" />}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t px-3 py-3 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">Falabella Retail</div>
          <div>Merchant · Plan Pro</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-background p-6">

        {/* DASHBOARD */}
        {section === "dashboard" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">Merchant · Falabella</div>
                <h1 className="text-2xl font-semibold tracking-tight">Centro de Operaciones</h1>
                <p className="text-sm text-muted-foreground">Gestiona órdenes, monitorea entregas en vivo.</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Bell size={14} /> Alertas
                <span className="ml-1 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">3</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <KpiCard label="OTs activas"    value={kpis.activas}     icon={<Package />}      tone="primary"     hint={`${kpis.total} totales`} />
              <KpiCard label="Recolección"    value={kpis.recol}       icon={<Truck />}        tone="warning" />
              <KpiCard label="En tránsito"    value={kpis.transito}    icon={<Bus />}          tone="primary"     hint="Bus interurbano" />
              <KpiCard label="Entregadas"     value={kpis.entregadas}  icon={<ShieldCheck />}  tone="success" />
              <KpiCard label="Incidencias"    value={kpis.incidencias} icon={<AlertTriangle />} tone="destructive" />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {selected && (
                  <div className="kargo-card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{selected.id}</span>
                        <StateBadge estado={selected.estado} />
                        <span className="text-sm text-muted-foreground">{selected.merchant} · {selected.bultos} bultos</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Gauge size={14} className="text-primary" /> {selected.progreso}% completado
                      </div>
                    </div>
                    <GpsMap origen={selected.origen} destino={selected.destino} progreso={selected.progreso} velocidad={selected.estado === "en-transito" ? 85 : undefined} className="h-[220px]" />
                    <div className="grid grid-cols-2 gap-px bg-border text-xs sm:grid-cols-4">
                      {[
                        { i: <MapPin size={13} />, l: "Origen",  v: selected.origen },
                        { i: <MapPin size={13} />, l: "Destino", v: selected.destino },
                        { i: <Bus size={13} />,    l: "Bus",     v: selected.bus ?? "—" },
                        { i: <Clock size={13} />,  l: "ETA",     v: selected.estado === "en-transito" ? "16/05 07:30" : "—" },
                      ].map((c) => (
                        <div key={c.l} className="flex items-center gap-2 bg-surface px-4 py-2.5">
                          <span className="text-muted-foreground">{c.i}</span>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.l}</div>
                            <div className="font-medium">{c.v}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Stepper estado={selected.estado} />
                  </div>
                )}

                <div className="kargo-card">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
                    <div className="text-sm font-semibold">Últimas órdenes</div>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setSection("ordenes")}>
                      Ver todas <ArrowUpRight size={12} />
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-5 py-2 text-left">OT</th>
                          <th className="px-5 py-2 text-left">Destino</th>
                          <th className="px-5 py-2 text-left">Estado</th>
                          <th className="px-5 py-2 text-left">Creada</th>
                          <th className="px-5 py-2 text-right">Bultos</th>
                          <th className="px-5 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {ots.slice(0, 5).map((o) => (
                          <tr key={o.id} className="cursor-pointer hover:bg-muted/30"
                            onClick={() => { setSelectedId(o.id); setSection("seguimiento"); }}>
                            <td className="px-5 py-2 font-mono text-xs font-semibold text-primary">{o.id}</td>
                            <td className="px-5 py-2">{o.destino}</td>
                            <td className="px-5 py-2"><StateBadge estado={o.estado} /></td>
                            <td className="px-5 py-2 text-muted-foreground">{o.creada}</td>
                            <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                            <td className="px-5 py-2 text-right">
                              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">Ver <ArrowUpRight size={12} /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="kargo-card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold">Distribución</div>
                    <TrendingUp size={14} className="text-success" />
                  </div>
                  <Donut entregadas={kpis.entregadas} transito={kpis.transito} recol={kpis.recol} total={kpis.total} />
                </div>
                {selected && (
                  <div className="kargo-card p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold flex items-center gap-1.5"><FileText size={14} /> Manifiesto {selected.id}</div>
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => downloadManifesto(selected)}>
                        <Download size={12} /> PDF
                      </Button>
                    </div>
                    {selected.manifiestoGenerado ? (
                      <div className="space-y-1.5">
                        {Array.from({ length: Math.min(4, selected.bultos) }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-xs">
                            <span className="font-mono">KARGO-{selected.id.replace("OT-", "")}-{String(i + 1).padStart(3, "0")}</span>
                            <ShieldCheck size={12} className="text-success" />
                          </div>
                        ))}
                        <div className="pt-1 text-center text-xs text-muted-foreground">
                          +{Math.max(0, selected.bultos - 4)} bultos · Total {selected.bultos}/{selected.bultos} ✓
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md bg-warning/10 p-3 text-xs text-warning">
                        Manifiesto disponible cuando el Loader confirme la carga en WH1.
                      </div>
                    )}
                  </div>
                )}
                <ActivityLog limit={8} />
              </div>
            </div>
          </div>
        )}

        {/* ÓRDENES */}
        {section === "ordenes" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Órdenes de Transporte</h1>
                <p className="text-sm text-muted-foreground">Todas tus órdenes activas e históricas.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar OT, destino…" className="h-8 w-52 pl-8 text-xs" />
                </div>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"><Filter size={13} /> Filtrar</Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"><Download size={13} /> Exportar</Button>
              </div>
            </div>
            <div className="kargo-card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 text-left">OT</th>
                    <th className="px-5 py-2 text-left">Merchant</th>
                    <th className="px-5 py-2 text-left">Origen</th>
                    <th className="px-5 py-2 text-left">Destino</th>
                    <th className="px-5 py-2 text-left">Estado</th>
                    <th className="px-5 py-2 text-left">Creada</th>
                    <th className="px-5 py-2 text-right">Bultos</th>
                    <th className="px-5 py-2 text-right">Peso</th>
                    <th className="px-5 py-2 text-left">Modalidad</th>
                    <th className="px-5 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((o) => (
                    <tr key={o.id} className="cursor-pointer hover:bg-muted/30"
                      onClick={() => { setSelectedId(o.id); setSection("seguimiento"); }}>
                      <td className="px-5 py-2 font-mono text-xs font-semibold text-primary">{o.id}</td>
                      <td className="px-5 py-2">{o.merchant}</td>
                      <td className="px-5 py-2">{o.origen}</td>
                      <td className="px-5 py-2">{o.destino}</td>
                      <td className="px-5 py-2"><StateBadge estado={o.estado} /></td>
                      <td className="px-5 py-2 text-muted-foreground">{o.creada}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{o.peso ? `${o.peso} kg` : "—"}</td>
                      <td className="px-5 py-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium",
                          o.modalidad === "B" ? "bg-bus/10 text-bus" : "bg-info/10 text-info"
                        )}>
                          {o.modalidad === "B" ? "B — Bodega" : "A — WH2"}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-right">
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">Ver <ArrowUpRight size={12} /></Button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Sin órdenes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEGUIMIENTO */}
        {section === "seguimiento" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Seguimiento</h1>
              <p className="text-sm text-muted-foreground">Monitoreo en tiempo real de tus envíos.</p>
            </div>

            {/* OT selector chips */}
            <div className="flex flex-wrap gap-2">
              {ots.filter((o) => o.estado !== "finalizada").map((o) => (
                <button key={o.id} onClick={() => setSelectedId(o.id)}
                  className={cn("rounded-full border px-3 py-1 text-xs font-medium transition",
                    selectedId === o.id || (!selectedId && o === selected)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface hover:border-primary/50"
                  )}>
                  {o.id}
                </button>
              ))}
            </div>

            {selected && (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <div className="kargo-card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{selected.id}</span>
                        <StateBadge estado={selected.estado} />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Gauge size={14} className="text-primary" /> {selected.progreso}% completado
                      </div>
                    </div>
                    <GpsMap origen={selected.origen} destino={selected.destino} progreso={selected.progreso}
                      velocidad={selected.estado === "en-transito" ? 85 : undefined} className="h-[280px]" />
                    <div className="grid grid-cols-2 gap-px bg-border text-xs sm:grid-cols-4">
                      {[
                        { i: <MapPin size={13} />, l: "Origen",  v: selected.origen },
                        { i: <MapPin size={13} />, l: "Destino", v: selected.destino },
                        { i: <Bus size={13} />,    l: "Bus",     v: selected.bus ?? "—" },
                        { i: <Clock size={13} />,  l: "ETA",     v: selected.estado === "en-transito" ? "16/05 07:30" : "—" },
                      ].map((c) => (
                        <div key={c.l} className="flex items-center gap-2 bg-surface px-4 py-2.5">
                          <span className="text-muted-foreground">{c.i}</span>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.l}</div>
                            <div className="font-medium">{c.v}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Stepper estado={selected.estado} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="kargo-card p-5">
                    <div className="mb-3 text-sm font-semibold">Detalle de la OT</div>
                    {[
                      ["Merchant",  selected.merchant],
                      ["Driver 1",  selected.driver1 ?? "—"],
                      ["Driver 2",  selected.driver2 ?? "—"],
                      ["Bus",       selected.bus ?? "—"],
                      ["Bultos",    String(selected.bultos)],
                      ["Peso",      selected.peso ? `${selected.peso} kg` : "—"],
                      ["Modalidad", selected.modalidad === "B" ? "B — Entrega en bodega" : "A — Retiro WH2"],
                      ["Creada",    selected.creada],
                    ].map(([l, v]) => (
                      <div key={l} className="flex items-center justify-between border-b py-1.5 text-xs last:border-0">
                        <span className="text-muted-foreground">{l}</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="mt-3 w-full gap-1.5 text-xs"
                      onClick={() => downloadManifesto(selected)}>
                      <Download size={12} /> Descargar manifiesto
                    </Button>
                  </div>
                  <ActivityLog limit={8} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTOS */}
        {section === "documentos" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Documentos y Custodia</h1>
              <p className="text-sm text-muted-foreground">Cadena de custodia completa por OT.</p>
            </div>
            {ots.slice(0, 4).map((o) => (
              <div key={o.id} className="kargo-card">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">{o.id}</span>
                    <StateBadge estado={o.estado} />
                  </div>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => downloadManifesto(o)}>
                    <Download size={12} /> PDF
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="pb-1 text-left">Documento</th>
                        <th className="pb-1 text-left">Actor</th>
                        <th className="pb-1 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { doc: "Orden de Transporte (OT)",     actor: "Sistema",  done: true },
                        { doc: "Firma Merchant (recolección)",  actor: "Driver 1", done: !!o.driver1 },
                        { doc: "Recepción WH1 (Loader)",        actor: "Loader 1", done: !!o.manifiestoGenerado },
                        { doc: "Manifiesto de carga al bus",    actor: "Loader 1", done: !!o.manifiestoGenerado },
                        { doc: "Registro GPS (KML)",            actor: "Sistema",  done: o.estado === "en-transito" || o.estado === "finalizada" },
                        { doc: "Firma entrega final",           actor: "Driver 3", done: o.estado === "finalizada" },
                      ].map((r) => (
                        <tr key={r.doc}>
                          <td className="py-1.5">{r.doc}</td>
                          <td className="py-1.5 text-muted-foreground">{r.actor}</td>
                          <td className="py-1.5">
                            {r.done
                              ? <span className="text-success font-medium">✓ Completado</span>
                              : <span className="text-muted-foreground">Pendiente</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REPORTES */}
        {section === "reportes" && (
          <div className="space-y-5">
            <h1 className="text-2xl font-semibold tracking-tight">Reportes de desempeño</h1>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard label="OTs creadas"    value={kpis.total}                                         tone="default" />
              <KpiCard label="Entregadas"     value={kpis.entregadas}                                   tone="success" />
              <KpiCard label="OTIF"           value={kpis.total ? `${Math.round((kpis.entregadas / kpis.total) * 100)}%` : "—"} tone="success" />
              <KpiCard label="Nivel servicio" value="4,8/5"                                              tone="primary" />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="kargo-card p-5">
                <div className="mb-4 text-sm font-semibold">Distribución por estado</div>
                <Donut entregadas={kpis.entregadas} transito={kpis.transito} recol={kpis.recol} total={kpis.total} />
              </div>
              <div className="kargo-card p-5">
                <div className="mb-4 text-sm font-semibold">Métricas del período</div>
                {[
                  ["Órdenes activas",            String(kpis.activas)],
                  ["En tránsito",                String(kpis.transito)],
                  ["En recolección",             String(kpis.recol)],
                  ["Incidencias abiertas",       String(kpis.incidencias)],
                  ["Tiempo promedio entrega",    "27,4 h"],
                  ["Costo promedio por envío",   "$18.450"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between border-b py-1.5 text-sm last:border-0">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-semibold tabular-nums">{v}</span>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="mt-4 gap-1.5 text-xs"><Download size={12} /> Exportar Excel</Button>
              </div>
            </div>
          </div>
        )}

        {/* INCIDENCIAS */}
        {section === "incidencias" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Incidencias</h1>
              <p className="text-sm text-muted-foreground">Monitoreo de incidencias en tus envíos.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard label="Total"      value={kpis.incidencias} tone="destructive" />
              <KpiCard label="Abiertas"   value={kpis.incidencias} tone="warning" />
              <KpiCard label="Resueltas"  value={0}                tone="success" />
              <KpiCard label="Escaladas"  value={0}                tone="default" />
            </div>
            <div className="kargo-card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 text-left">OT</th>
                    <th className="px-5 py-2 text-left">Tipo</th>
                    <th className="px-5 py-2 text-left">Estado</th>
                    <th className="px-5 py-2 text-left">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ots.filter((o) => ["incidencia","suspendida"].includes(o.estado)).map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <td className="px-5 py-2 font-mono text-xs font-semibold text-primary">{o.id}</td>
                      <td className="px-5 py-2">Incidencia en ruta</td>
                      <td className="px-5 py-2"><StateBadge estado={o.estado} /></td>
                      <td className="px-5 py-2 text-muted-foreground">{o.incidencia ?? "—"}</td>
                    </tr>
                  ))}
                  {!ots.some((o) => ["incidencia","suspendida"].includes(o.estado)) && (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">✓ Sin incidencias activas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEVOLUCIONES */}
        {section === "devoluciones" && (
          <div className="space-y-5">
            <h1 className="text-2xl font-semibold tracking-tight">Devoluciones</h1>
            <div className="kargo-card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 text-left">N° Dev.</th>
                    <th className="px-5 py-2 text-left">OT Original</th>
                    <th className="px-5 py-2 text-left">Tipo</th>
                    <th className="px-5 py-2 text-left">Motivo</th>
                    <th className="px-5 py-2 text-left">Estado</th>
                    <th className="px-5 py-2 text-right">Cargo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/30">
                    <td className="px-5 py-2 font-mono text-xs text-primary">DEV-001</td>
                    <td className="px-5 py-2 font-mono text-xs text-primary">OT-00115</td>
                    <td className="px-5 py-2">Total</td>
                    <td className="px-5 py-2 text-muted-foreground">Cliente rechaza</td>
                    <td className="px-5 py-2"><StateBadge estado="recolectada" /></td>
                    <td className="px-5 py-2 text-right text-muted-foreground">Sin cargo</td>
                  </tr>
                  <tr className="hover:bg-muted/30">
                    <td className="px-5 py-2 font-mono text-xs text-primary">DEV-002</td>
                    <td className="px-5 py-2 font-mono text-xs text-primary">OT-00108</td>
                    <td className="px-5 py-2">Parcial (3/12)</td>
                    <td className="px-5 py-2 text-muted-foreground">Bultos dañados</td>
                    <td className="px-5 py-2"><StateBadge estado="en-transito" /></td>
                    <td className="px-5 py-2 text-right text-muted-foreground">Sin cargo</td>
                  </tr>
                  <tr className="hover:bg-muted/30">
                    <td className="px-5 py-2 font-mono text-xs text-primary">DEV-003</td>
                    <td className="px-5 py-2 font-mono text-xs text-primary">OT-00099</td>
                    <td className="px-5 py-2">No retiro (A)</td>
                    <td className="px-5 py-2 text-muted-foreground">Expiró plazo WH2</td>
                    <td className="px-5 py-2"><StateBadge estado="creada" /></td>
                    <td className="px-5 py-2 text-right text-destructive font-medium">$12.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FACTURACIÓN */}
        {section === "facturacion" && (
          <div className="space-y-5">
            <h1 className="text-2xl font-semibold tracking-tight">Facturación — Mayo 2024</h1>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard label="OTs facturables"  value={kpis.entregadas}      tone="default" />
              <KpiCard label="Total neto"        value="$3.849.580"           tone="success" />
              <KpiCard label="IVA (19%)"         value="$731.420"             tone="default" />
              <KpiCard label="Total a facturar"  value="$4.580.000"           tone="primary" />
            </div>
            <div className="kargo-card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 text-left">OT</th>
                    <th className="px-5 py-2 text-left">Destino</th>
                    <th className="px-5 py-2 text-right">Bultos</th>
                    <th className="px-5 py-2 text-right">Peso</th>
                    <th className="px-5 py-2 text-left">Modalidad</th>
                    <th className="px-5 py-2 text-right">Neto</th>
                    <th className="px-5 py-2 text-right">IVA</th>
                    <th className="px-5 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ots.filter((o) => o.estado === "finalizada").map((o) => {
                    const base = 10000 + o.bultos * 200 + (o.peso ?? 0) * 20;
                    const neto = o.modalidad === "B" ? Math.round(base * 1.15) : base;
                    const iva  = Math.round(neto * 0.19);
                    return (
                      <tr key={o.id} className="hover:bg-muted/30">
                        <td className="px-5 py-2 font-mono text-xs font-semibold text-primary">{o.id}</td>
                        <td className="px-5 py-2">{o.destino}</td>
                        <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                        <td className="px-5 py-2 text-right tabular-nums">{o.peso ? `${o.peso} kg` : "—"}</td>
                        <td className="px-5 py-2">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                            {o.modalidad === "B" ? "B" : "A"}
                          </span>
                        </td>
                        <td className="px-5 py-2 text-right tabular-nums">${neto.toLocaleString("es-CL")}</td>
                        <td className="px-5 py-2 text-right tabular-nums">${iva.toLocaleString("es-CL")}</td>
                        <td className="px-5 py-2 text-right tabular-nums font-semibold">${(neto + iva).toLocaleString("es-CL")}</td>
                      </tr>
                    );
                  })}
                  {!ots.some((o) => o.estado === "finalizada") && (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Sin OTs facturables.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Download size={12} /> Exportar Excel</Button>
          </div>
        )}

      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function Stepper({ estado }: { estado: OT["estado"] }) {
  const steps = [
    { key: "creada",      label: "Creada"    },
    { key: "recolectada", label: "Recolección" },
    { key: "wh1",         label: "WH1"       },
    { key: "en-transito", label: "Transporte" },
    { key: "finalizada",  label: "Entrega"   },
  ];
  const order = ["creada", "asignada", "recolectada", "wh1", "en-transito", "finalizada"];
  const idx   = Math.max(0, order.indexOf(estado));
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-5 py-4">
      {steps.map((s, i) => {
        const reached = order.indexOf(s.key) <= idx;
        const active  = order.indexOf(s.key) === idx;
        return (
          <div key={i} className="flex flex-1 items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "grid size-7 place-items-center rounded-full text-[11px] font-semibold transition",
                reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                active  ? "ring-4 ring-primary/20" : ""
              )}>
                {i + 1}
              </div>
              <span className={cn("whitespace-nowrap text-[10px]", reached ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("mb-4 h-0.5 flex-1", reached ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Donut({ entregadas, transito, recol, total }: { entregadas: number; transito: number; recol: number; total: number }) {
  const t    = total || 1;
  const segs = [
    { v: entregadas, c: "var(--success)", l: "Entregadas"  },
    { v: transito,   c: "var(--primary)", l: "En tránsito" },
    { v: recol,      c: "var(--warning)", l: "Recolección" },
  ];
  let off = 0;
  const C = 2 * Math.PI * 42;
  return (
    <div className="flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="42" fill="none" stroke="var(--muted)" strokeWidth="14" />
        {segs.map((s, i) => {
          const len = (s.v / t) * C;
          const dash = `${len} ${C - len}`;
          const dashoffset = -off;
          off += len;
          return (
            <circle key={i} cx="60" cy="60" r="42" fill="none" stroke={s.c} strokeWidth="14"
              strokeDasharray={dash} strokeDashoffset={dashoffset}
              transform="rotate(-90 60 60)" strokeLinecap="butt" />
          );
        })}
        <text x="60" y="58" textAnchor="middle" className="fill-foreground text-xl font-bold">{total}</text>
        <text x="60" y="74" textAnchor="middle" className="fill-muted-foreground text-[9px] uppercase tracking-wider">OTs</text>
      </svg>
      <div className="flex-1 space-y-1.5 text-xs">
        {segs.map((s) => (
          <div key={s.l} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm" style={{ background: s.c }} />
              {s.l}
            </span>
            <span className="tabular-nums font-medium">{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrearOTDialog({ onCreate }: { onCreate: (d: { origen: string; destino: string; bultos: number; merchant: string }) => void }) {
  const [origen,  setOrigen]  = useState("CD Pudahuel");
  const [destino, setDestino] = useState("Temuco");
  const [bultos,  setBultos]  = useState(10);
  const [peso,    setPeso]    = useState(100);
  const tarifa = (destino === "Temuco" ? 12000 : 10000) + bultos * 200 + peso * 20;
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Crear Orden de Transporte</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Origen</Label><Input value={origen} onChange={(e) => setOrigen(e.target.value)} /></div>
          <div>
            <Label>Destino</Label>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Temuco","Concepción","Valparaíso","Arica","Puerto Montt","La Serena"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Bultos</Label><Input type="number" min={1} value={bultos} onChange={(e) => setBultos(parseInt(e.target.value || "1"))} /></div>
          <div><Label>Peso (kg)</Label><Input type="number" min={1} value={peso} onChange={(e) => setPeso(parseInt(e.target.value || "1"))} /></div>
        </div>
        <div className="rounded-lg bg-primary/5 p-3 text-sm">
          Tarifa estimada: <span className="font-semibold text-primary">${tarifa.toLocaleString("es-CL")}</span>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onCreate({ origen, destino, bultos, merchant: "Falabella" })}>Crear OT</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function downloadManifesto(ot: OT) {
  const lines = [
    `MANIFIESTO DE CARGA — ${ot.id}`,
    `Merchant: ${ot.merchant}`,
    `Origen: ${ot.origen}  →  Destino: ${ot.destino}`,
    `Bus: ${ot.bus ?? "—"}  Driver 2: ${ot.driver2 ?? "—"}`,
    `Bultos: ${ot.bultos}`,
    "",
    ...Array.from({ length: ot.bultos }).map((_, i) =>
      `  #${String(i + 1).padStart(3, "0")}  KARGO-${ot.id.replace("OT-", "")}-${String(i + 1).padStart(3, "0")}  ✓`
    ),
  ].join("\n");
  const blob = new Blob([lines], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `manifiesto-${ot.id}.txt`; a.click();
  URL.revokeObjectURL(url);
  toast.success(`Manifiesto ${ot.id} descargado`);
}