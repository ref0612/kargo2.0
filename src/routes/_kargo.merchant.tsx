import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell, Plus, Search, Package, Truck, AlertTriangle, FileText, Download, Filter,
  TrendingUp, MapPin, Clock, Gauge, Bus, ArrowUpRight, ShieldCheck,
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
import type { OT } from "@/lib/kargo/types";

export const Route = createFileRoute("/_kargo/merchant")({
  head: () => ({
    meta: [
      { title: "Merchant — Crear y rastrear OTs · KARGO" },
      { name: "description", content: "Panel del Merchant: crear órdenes de transporte, ver KPIs, tracking GPS en vivo y manifiesto." },
    ],
  }),
  component: MerchantPage,
});

function MerchantPage() {
  const ots = useKargo((s) => s.ots);
  const createOT = useKargo((s) => s.createOT);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  const kpis = useMemo(() => {
    const activas = ots.filter((o) => o.estado !== "finalizada" && o.estado !== "incidencia").length;
    const recol = ots.filter((o) => o.estado === "recolectada" || o.estado === "asignada").length;
    const transito = ots.filter((o) => o.estado === "en-transito").length;
    const incidencias = ots.filter((o) => o.estado === "incidencia").length;
    const entregadas = ots.filter((o) => o.estado === "finalizada").length;
    return { activas, recol, transito, incidencias, entregadas, total: ots.length };
  }, [ots]);

  const filtered = ots.filter(
    (o) => !search || `${o.id} ${o.destino} ${o.origen}`.toLowerCase().includes(search.toLowerCase())
  );

  const selected = ots.find((o) => o.id === selectedId) ?? ots.find((o) => o.estado === "en-transito") ?? ots[0];

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Merchant · Falabella</div>
          <h1 className="text-2xl font-semibold tracking-tight">Centro de Operaciones</h1>
          <p className="text-sm text-muted-foreground">Gestiona órdenes, monitorea entregas en vivo y descarga manifiestos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Bell size={14} /> Alertas <span className="ml-1 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">3</span></Button>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus size={14} /> Nueva OT</Button>
            </DialogTrigger>
            <CrearOTDialog
              onCreate={(data) => {
                const ot = createOT(data);
                setOpenCreate(false);
                toast.success(`OT ${ot.id} creada`, { description: "Enrutada a Coordinador Kupos." });
              }}
            />
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="OTs activas" value={kpis.activas} icon={<Package />} tone="primary" hint={`${kpis.total} totales`} />
        <KpiCard label="En recolección" value={kpis.recol} icon={<Truck />} tone="warning" />
        <KpiCard label="En tránsito" value={kpis.transito} icon={<Bus />} tone="primary" hint="Bus interurbano" />
        <KpiCard label="Entregadas" value={kpis.entregadas} icon={<ShieldCheck />} tone="success" />
        <KpiCard label="Incidencias" value={kpis.incidencias} icon={<AlertTriangle />} tone="destructive" />
      </div>

      {/* Live tracking + log */}
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
              <GpsMap origen={selected.origen} destino={selected.destino} progreso={selected.progreso} velocidad={selected.estado === "en-transito" ? 85 : undefined} className="h-[260px]" />
              <div className="grid grid-cols-2 gap-px bg-border text-xs sm:grid-cols-4">
                {[
                  { i: <MapPin size={14} />, l: "Origen", v: selected.origen },
                  { i: <MapPin size={14} />, l: "Destino", v: selected.destino },
                  { i: <Bus size={14} />, l: "Bus", v: selected.bus ?? "—" },
                  { i: <Clock size={14} />, l: "ETA", v: selected.estado === "en-transito" ? "16/05 07:30" : "—" },
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
              {/* Stepper */}
              <Stepper estado={selected.estado} />
            </div>
          )}

          {/* Orders table */}
          <div className="kargo-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
              <div className="text-sm font-semibold">Tus órdenes</div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar OT, destino…" className="h-8 w-56 pl-8 text-xs" />
                </div>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"><Filter size={13} /> Filtrar</Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"><Download size={13} /> Exportar</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 text-left">OT</th>
                    <th className="px-5 py-2 text-left">Origen</th>
                    <th className="px-5 py-2 text-left">Destino</th>
                    <th className="px-5 py-2 text-left">Estado</th>
                    <th className="px-5 py-2 text-left">Creada</th>
                    <th className="px-5 py-2 text-right">Bultos</th>
                    <th className="px-5 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((o) => (
                    <tr key={o.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedId(o.id)}>
                      <td className="px-5 py-2 font-mono text-xs font-semibold text-primary">{o.id}</td>
                      <td className="px-5 py-2">{o.origen}</td>
                      <td className="px-5 py-2">{o.destino}</td>
                      <td className="px-5 py-2"><StateBadge estado={o.estado} /></td>
                      <td className="px-5 py-2 text-muted-foreground">{o.creada}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                      <td className="px-5 py-2 text-right"><Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">Ver <ArrowUpRight size={12} /></Button></td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sin órdenes que coincidan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Donut */}
          <div className="kargo-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Distribución</div>
              <TrendingUp size={14} className="text-success" />
            </div>
            <Donut entregadas={kpis.entregadas} transito={kpis.transito} recol={kpis.recol} total={kpis.total} />
          </div>

          {/* Manifest / documents */}
          {selected && (
            <div className="kargo-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold flex items-center gap-1.5"><FileText size={14} /> Manifiesto {selected.id}</div>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => downloadManifesto(selected)}><Download size={12} /> PDF</Button>
              </div>
              {selected.manifiestoGenerado ? (
                <div className="space-y-1.5">
                  {Array.from({ length: Math.min(4, selected.bultos) }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-xs">
                      <span className="font-mono">KARGO-{selected.id.replace("OT-", "")}-{String(i + 1).padStart(3, "0")}</span>
                      <ShieldCheck size={12} className="text-success" />
                    </div>
                  ))}
                  <div className="pt-2 text-center text-xs text-muted-foreground">+{Math.max(0, selected.bultos - 4)} bultos · Total {selected.bultos}/{selected.bultos} ✓</div>
                </div>
              ) : (
                <div className="rounded-md bg-warning/10 p-3 text-xs text-warning">Manifiesto se generará cuando el Loader confirme la carga en WH1.</div>
              )}
            </div>
          )}

          <ActivityLog limit={10} />
        </div>
      </div>
    </div>
  );
}

function Stepper({ estado }: { estado: OT["estado"] }) {
  const steps = [
    { key: "creada", label: "Creada" },
    { key: "recolectada", label: "Recolección" },
    { key: "wh1", label: "WH1" },
    { key: "en-transito", label: "Carga bus" },
    { key: "en-transito", label: "Transporte" },
    { key: "finalizada", label: "Entrega" },
  ];
  const order = ["creada", "asignada", "recolectada", "wh1", "en-transito", "finalizada"];
  const idx = Math.max(0, order.indexOf(estado));
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-5 py-4">
      {steps.map((s, i) => {
        const reached = order.indexOf(s.key) <= idx;
        const active = order.indexOf(s.key) === idx;
        return (
          <div key={i} className="flex flex-1 items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`grid size-7 place-items-center rounded-full text-[11px] font-semibold transition ${
                  reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                } ${active ? "ring-4 ring-primary/20" : ""}`}
              >
                {i + 1}
              </div>
              <span className={`whitespace-nowrap text-[10px] ${reached ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`mb-4 h-0.5 flex-1 ${reached ? "bg-primary" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function Donut({ entregadas, transito, recol, total }: { entregadas: number; transito: number; recol: number; total: number }) {
  const t = total || 1;
  const segs = [
    { v: entregadas, c: "var(--success)", l: "Entregadas" },
    { v: transito, c: "var(--primary)", l: "En tránsito" },
    { v: recol, c: "var(--warning)", l: "Recolección" },
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
              strokeDasharray={dash} strokeDashoffset={dashoffset} transform="rotate(-90 60 60)" strokeLinecap="butt" />
          );
        })}
        <text x="60" y="58" textAnchor="middle" className="fill-foreground text-xl font-bold">{total}</text>
        <text x="60" y="74" textAnchor="middle" className="fill-muted-foreground text-[9px] uppercase tracking-wider">OTs</text>
      </svg>
      <div className="flex-1 space-y-1.5 text-xs">
        {segs.map((s) => (
          <div key={s.l} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: s.c }} />{s.l}</span>
            <span className="tabular-nums font-medium">{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrearOTDialog({ onCreate }: { onCreate: (d: { origen: string; destino: string; bultos: number; merchant: string }) => void }) {
  const [origen, setOrigen] = useState("CD Pudahuel");
  const [destino, setDestino] = useState("Temuco");
  const [bultos, setBultos] = useState(10);
  const [peso, setPeso] = useState(100);
  const tarifa = (destino === "Temuco" ? 12000 : 10000) + bultos * 200 + peso * 20;
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Crear Orden de Transporte</DialogTitle>
      </DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Origen</Label><Input value={origen} onChange={(e) => setOrigen(e.target.value)} /></div>
          <div>
            <Label>Destino</Label>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Temuco", "Concepción", "Valparaíso", "Arica", "Puerto Montt", "La Serena"].map((c) => (
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
    ...Array.from({ length: ot.bultos }).map((_, i) => `  #${String(i + 1).padStart(3, "0")}  KARGO-${ot.id.replace("OT-", "")}-${String(i + 1).padStart(3, "0")}  ✓`),
  ].join("\n");
  const blob = new Blob([lines], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `manifiesto-${ot.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Manifiesto ${ot.id} descargado`);
}
