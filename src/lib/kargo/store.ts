import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { OT, OTEstado, LogEntry, Operador } from "./types";
import { OPERADORES_SEED } from "./types";

const seed: OT[] = [
  { id: "OT-00123", merchant: "Falabella", origen: "CD Pudahuel",  destino: "Temuco",       bultos: 25, peso: 1250, estado: "en-transito", creada: "15/05 09:15", driver1: "Carlos González", driver2: "Pedro López",  bus: "AB-CD-12", progreso: 62,  operador: "op-rm",  manifiestoGenerado: true, modalidad: "B" },
  { id: "OT-00124", merchant: "Falabella", origen: "Las Condes",   destino: "Concepción",   bultos: 18, peso: 840,  estado: "recolectada",  creada: "15/05 08:45", driver1: "Luis G.",         driver2: null,           bus: null,       progreso: 0,   operador: "op-rm",  modalidad: "A" },
  { id: "OT-00125", merchant: "Ripley",    origen: "Vitacura",     destino: "Valparaíso",   bultos: 22, peso: 1100, estado: "creada",        creada: "15/05 10:30", driver1: null,              driver2: null,           bus: null,       progreso: 0,   operador: null,     modalidad: "A" },
  { id: "OT-00126", merchant: "Paris",     origen: "Providencia",  destino: "Arica",        bultos: 40, peso: 1800, estado: "wh1",           creada: "15/05 11:00", driver1: "Juan Martínez",   driver2: null,           bus: null,       progreso: 0,   operador: "op-rm",  modalidad: "B" },
  { id: "OT-00127", merchant: "Sodimac",   origen: "Maipú",        destino: "Puerto Montt", bultos: 12, peso: 430,  estado: "finalizada",    creada: "14/05 16:00", driver1: "Carlos González", driver2: "Roberto Vera", bus: "KL-MN-45", progreso: 100, operador: "op-rm",  manifiestoGenerado: true, modalidad: "A" },
  { id: "OT-00128", merchant: "Ripley",    origen: "Ñuñoa",        destino: "La Serena",    bultos: 8,  peso: 320,  estado: "creada",        creada: "15/05 12:10", driver1: null,              driver2: null,           bus: null,       progreso: 0,   operador: null,     modalidad: "A" },
  { id: "OT-00129", merchant: "Walmart",   origen: "CD Pudahuel",  destino: "Temuco",       bultos: 30, peso: 950,  estado: "en-transito",   creada: "15/05 07:00", driver1: "Ana Fuentes",     driver2: "Roberto Vera", bus: "EF-GH-23", progreso: 35,  operador: "op-sur", manifiestoGenerado: true, modalidad: "A" },
  { id: "OT-00130", merchant: "Falabella", origen: "Las Condes",   destino: "Rancagua",     bultos: 14, peso: 600,  estado: "wh1",           creada: "15/05 09:00", driver1: "Roberto Vega",    driver2: null,           bus: null,       progreso: 0,   operador: "op-rm",  modalidad: "B" },
];

function nowTs() {
  return new Date().toLocaleString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function nowClock() {
  return new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

interface KargoState {
  ots: OT[];
  operadores: Operador[];
  log: LogEntry[];
  nextId: number;
  _tickStarted: boolean;
  addLog: (msg: string, otId?: string, level?: LogEntry["level"]) => void;
  createOT: (data: Partial<OT> & { origen: string; destino: string; bultos: number; merchant?: string }) => OT;
  derivarOperador: (otId: string, operadorId: string) => void;
  asignarDriver1: (otId: string, driver: string) => void;
  scanBultoD1: (otId: string, n?: number) => void;
  firmarRecoleccion: (otId: string) => void;
  asignarBus: (otId: string, bus: string, driver2: string) => void;
  scanBultoLoader: (otId: string, n?: number) => void;
  confirmarCarga: (otId: string) => void;
  reportarIncidencia: (otId: string, motivo: string) => void;
  suspenderOT: (otId: string, motivo: string) => void;
  setProgreso: (otId: string, p: number) => void;
  moveEstado: (otId: string, estado: OTEstado) => void;
  startTick: () => void;
  generarFlujoEjemplo: () => void;
  resetDemo: () => void;
}

const upd = (ots: OT[], id: string, patch: Partial<OT>) =>
  ots.map((o) => (o.id === id ? { ...o, ...patch } : o));

export const useKargo = create<KargoState>((set, get) => ({
  ots: seed,
  operadores: OPERADORES_SEED,
  // Static initial log — no Date() call here; avoids SSR/client mismatch
  log: [{ time: "—", msg: "Sistema KARGO iniciado", level: "info" }],
  nextId: 131,
  _tickStarted: false,

  addLog: (msg, otId, level = "info") =>
    set((s) => ({ log: [{ time: nowClock(), msg, otId, level }, ...s.log].slice(0, 100) })),

  createOT: (data) => {
    const id = `OT-00${get().nextId}`;
    const ot: OT = {
      id, merchant: data.merchant ?? "Falabella",
      origen: data.origen, destino: data.destino,
      bultos: data.bultos, peso: data.peso,
      modalidad: data.modalidad ?? "A",
      estado: "creada", creada: nowTs(),
      driver1: null, driver2: null, bus: null, progreso: 0, operador: null,
    };
    set((s) => ({ ots: [...s.ots, ot], nextId: s.nextId + 1 }));
    get().addLog(`OT ${id} creada → pendiente Kupos`, id);
    return ot;
  },

  derivarOperador: (otId, operadorId) => {
    const op = get().operadores.find((o) => o.id === operadorId);
    set((s) => ({ ots: upd(s.ots, otId, { operador: operadorId }) }));
    get().addLog(`OT ${otId} derivada a ${op?.nombre ?? operadorId}`, otId);
  },

  asignarDriver1: (otId, driver) => {
    set((s) => ({ ots: upd(s.ots, otId, { driver1: driver, estado: "recolectada" }) }));
    get().addLog(`OT ${otId} asignada a Driver 1: ${driver}`, otId);
  },

  scanBultoD1: (otId, n = 5) => {
    const ot = get().ots.find((o) => o.id === otId);
    if (!ot) return;
    set((s) => ({ ots: upd(s.ots, otId, { bultosEscaneadosD1: Math.min(ot.bultos, (ot.bultosEscaneadosD1 ?? 0) + n) }) }));
  },

  firmarRecoleccion: (otId) => {
    const ot = get().ots.find((o) => o.id === otId);
    set((s) => ({ ots: upd(s.ots, otId, { estado: "wh1", bultosEscaneadosD1: ot?.bultos }) }));
    get().addLog(`OT ${otId} recolectada → Warehouse 1`, otId);
  },

  asignarBus: (otId, bus, driver2) => {
    const ot = get().ots.find((o) => o.id === otId);
    if (!ot) return;
    const estado: OTEstado = ot.manifiestoGenerado ? "en-transito" : "wh1";
    set((s) => ({ ots: upd(s.ots, otId, { bus, driver2, estado, progreso: estado === "en-transito" ? 5 : 0 }) }));
    get().addLog(`OT ${otId} → bus ${bus} · Driver 2: ${driver2}`, otId);
  },

  scanBultoLoader: (otId, n = 5) => {
    const ot = get().ots.find((o) => o.id === otId);
    if (!ot) return;
    set((s) => ({ ots: upd(s.ots, otId, { bultosEscaneadosLoader: Math.min(ot.bultos, (ot.bultosEscaneadosLoader ?? 0) + n) }) }));
  },

  confirmarCarga: (otId) => {
    const ot = get().ots.find((o) => o.id === otId);
    if (!ot) return;
    const estado: OTEstado = ot.bus && ot.driver2 ? "en-transito" : "wh1";
    set((s) => ({ ots: upd(s.ots, otId, { manifiestoGenerado: true, bultosEscaneadosLoader: ot.bultos, estado, progreso: estado === "en-transito" ? 5 : 0 }) }));
    get().addLog(`Manifiesto generado ${otId}${estado === "en-transito" ? " → En tránsito" : " (esperando bus)"}`, otId);
  },

  reportarIncidencia: (otId, motivo) => {
    set((s) => ({ ots: upd(s.ots, otId, { estado: "incidencia", incidencia: motivo }) }));
    get().addLog(`⚠ Incidencia ${otId}: ${motivo}`, otId, "warn");
  },

  suspenderOT: (otId, motivo) => {
    set((s) => ({ ots: upd(s.ots, otId, { estado: "suspendida", incidencia: motivo }) }));
    get().addLog(`🔴 OT ${otId} SUSPENDIDA: ${motivo}`, otId, "error");
  },

  setProgreso: (otId, p) =>
    set((s) => ({ ots: upd(s.ots, otId, { progreso: p }) })),

  moveEstado: (otId, estado) => {
    set((s) => ({ ots: upd(s.ots, otId, { estado }) }));
    get().addLog(`OT ${otId} → ${estado}`, otId);
  },

  // Called once from useEffect in KargoLayout — never during SSR
  startTick: () => {
    if (get()._tickStarted) return;
    set({ _tickStarted: true });
    setInterval(() => {
      const ots = get().ots;
      let changed = false;
      const next = ots.map((o) => {
        if (o.estado !== "en-transito" || o.progreso >= 100) return o;
        changed = true;
        const p = Math.min(100, Math.round(o.progreso + Math.random() * 3 + 1));
        if (p >= 100) {
          get().addLog(`OT ${o.id} entregada (100%)`, o.id);
          return { ...o, progreso: 100, estado: "finalizada" as OTEstado };
        }
        return { ...o, progreso: p };
      });
      if (changed) set({ ots: next });
    }, 3500);
  },

  generarFlujoEjemplo: () => {
    const ot = get().createOT({ merchant: "Ejemplo S.A.", origen: "Las Condes", destino: "Temuco", bultos: 15, peso: 600, modalidad: "B" });
    const id = ot.id;
    const steps: Array<[number, () => void]> = [
      [1200, () => get().derivarOperador(id, "op-rm")],
      [2400, () => get().asignarDriver1(id, "Juan Martínez")],
      [4000, () => { set((s) => ({ ots: upd(s.ots, id, { bultosEscaneadosD1: 15 }) })); get().firmarRecoleccion(id); }],
      [5600, () => { set((s) => ({ ots: upd(s.ots, id, { bultosEscaneadosLoader: 15 }) })); get().confirmarCarga(id); }],
      [7000, () => get().asignarBus(id, "AB-CD-12", "Pedro López")],
    ];
    steps.forEach(([ms, fn]) => setTimeout(fn, ms));
  },

  resetDemo: () => set({
    ots: seed, nextId: 131, _tickStarted: false,
    log: [{ time: "—", msg: "Demo reiniciado", level: "info" }],
  }),
}));

// ── Safe selector hook using shallow compare ───────────────────
// Use this instead of inline object selectors to avoid infinite loops.
export function useNetworkKpis() {
  return useKargo(
    useShallow((s) => ({
      total:       s.ots.length,
      sinAsignar:  s.ots.filter((o) => o.estado === "creada" && !o.operador).length,
      enOperacion: s.ots.filter((o) => !["finalizada"].includes(o.estado)).length,
      finalizadas: s.ots.filter((o) => o.estado === "finalizada").length,
      conAlerta:   s.ots.filter((o) => ["incidencia", "suspendida"].includes(o.estado)).length,
      enTransito:  s.ots.filter((o) => o.estado === "en-transito").length,
    }))
  );
}

// Keep scalar selector for backward compat
export const selectByEstado = (estado: OTEstado | OTEstado[]) => (s: KargoState) => {
  const arr = Array.isArray(estado) ? estado : [estado];
  return s.ots.filter((o) => arr.includes(o.estado));
};

export const selectOperadorById = (id: string) => (s: KargoState) =>
  s.operadores.find((o) => o.id === id);

// DO NOT use selectNetworkKpis as a direct selector — use useNetworkKpis() hook instead
/** @deprecated Use useNetworkKpis() hook */
export const selectNetworkKpis = (s: KargoState) => ({
  total:       s.ots.length,
  sinAsignar:  s.ots.filter((o) => o.estado === "creada" && !o.operador).length,
  enOperacion: s.ots.filter((o) => !["finalizada"].includes(o.estado)).length,
  finalizadas: s.ots.filter((o) => o.estado === "finalizada").length,
  conAlerta:   s.ots.filter((o) => ["incidencia", "suspendida"].includes(o.estado)).length,
  enTransito:  s.ots.filter((o) => o.estado === "en-transito").length,
});