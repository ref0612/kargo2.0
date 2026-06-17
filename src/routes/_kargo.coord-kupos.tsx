import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Globe2, ArrowRight, MapPinned } from "lucide-react";
import { useKargo } from "@/lib/kargo/store";
import { KpiCard } from "@/components/kargo/KpiCard";
import { StateBadge } from "@/components/kargo/StateBadge";
import { ActivityLog } from "@/components/kargo/ActivityLog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_kargo/coord-kupos")({
  head: () => ({
    meta: [
      { title: "Coordinador Global Kupos · KARGO" },
      { name: "description", content: "Enrutamiento de OTs a operadores logísticos zonales." },
    ],
  }),
  component: KuposPage,
});

const OPERADORES = ["Op. RM Centro", "Op. Valparaíso", "Op. Bío-Bío", "Op. Sur Austral"];

function KuposPage() {
  const ots = useKargo((s) => s.ots);
  const derivar = useKargo((s) => s.derivarOperador);
  const [sel, setSel] = useState<Record<string, string>>({});

  const sinDerivar = ots.filter((o) => o.estado === "creada" && !o.operador);
  const derivadas = ots.filter((o) => o.operador && o.estado === "creada").length;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5"><Globe2 size={12} /> Coordinador Global · Kupos</div>
        <h1 className="text-2xl font-semibold tracking-tight">Enrutamiento Nacional</h1>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="OTs totales" value={ots.length} tone="primary" />
        <KpiCard label="Por enrutar" value={sinDerivar.length} tone="warning" />
        <KpiCard label="Derivadas a operadores" value={derivadas} tone="success" />
        <KpiCard label="Operadores activos" value={OPERADORES.length} icon={<MapPinned />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="kargo-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="text-sm font-semibold">Bandeja de enrutamiento</div>
            <span className="text-xs text-muted-foreground">{sinDerivar.length} pendientes</span>
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
                  <th className="px-5 py-2 text-left">Operador</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sinDerivar.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-5 py-2 font-mono text-xs font-semibold text-primary">{o.id}</td>
                    <td className="px-5 py-2">{o.merchant}</td>
                    <td className="px-5 py-2">{o.origen}</td>
                    <td className="px-5 py-2">{o.destino}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{o.bultos}</td>
                    <td className="px-5 py-2">
                      <Select value={sel[o.id] ?? ""} onValueChange={(v) => setSel({ ...sel, [o.id]: v })}>
                        <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {OPERADORES.map((op) => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-2 text-right">
                      <Button
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        disabled={!sel[o.id]}
                        onClick={() => {
                          derivar(o.id, sel[o.id]);
                          toast.success(`${o.id} derivada`, { description: sel[o.id] });
                        }}
                      >
                        Derivar <ArrowRight size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!sinDerivar.length && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">✓ Todas las OTs están enrutadas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="kargo-card p-5">
            <div className="mb-3 text-sm font-semibold">Cobertura por operador</div>
            <div className="space-y-2">
              {OPERADORES.map((op) => {
                const c = ots.filter((o) => o.operador === op).length;
                return (
                  <div key={op} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2"><MapPinned size={12} className="text-primary" /> {op}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium tabular-nums">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="kargo-card p-5">
            <div className="mb-3 text-sm font-semibold">Últimas derivadas</div>
            <div className="space-y-1.5">
              {ots.filter((o) => o.operador).slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-primary">{o.id}</span>
                  <StateBadge estado={o.estado} />
                </div>
              ))}
            </div>
          </div>

          <ActivityLog limit={10} />
        </div>
      </div>
    </div>
  );
}
