import { create } from "zustand";
import type { OT, OTEstado, LogEntry } from "./types";

const seed: OT[] = [
  { id: "OT-00123", merchant: "Falabella", origen: "CD Pudahuel", destino: "Temuco", bultos: 25, estado: "en-transito", creada: "15/05 09:15", driver1: "Carlos González", driver2: "Pedro López", bus: "AB-CD-12", progreso: 62, operador: "Op. RM Centro", manifiestoGenerado: true },
  { id: "OT-00124", merchant: "Falabella", origen: "Las Condes", destino: "Concepción", bultos: 18, estado: "recolectada", creada: "15/05 08:45", driver1: "Luis G.", driver2: null, bus: null, progreso: 0, operador: "Op. RM Centro" },
  { id: "OT-00125", merchant: "Ripley", origen: "Vitacura", destino: "Valparaíso", bultos: 22, estado: "creada", creada: "15/05 10:30", driver1: null, driver2: null, bus: null, progreso: 0 },
  { id: "OT-00126", merchant: "Paris", origen: "Providencia", destino: "Arica", bultos: 40, estado: "wh1", creada: "15/05 11:00", driver1: "Juan Martínez", driver2: null, bus: null, progreso: 0, operador: "Op. RM Centro" },
  { id: "OT-00127", merchant: "Sodimac", origen: "Maipú", destino: "Puerto Montt", bultos: 12, estado: "finalizada", creada: "14/05 16:00", driver1: "Carlos González", driver2: "Roberto Vera", bus: "KL-MN-45", progreso: 100, operador: "Op. RM Centro", manifiestoGenerado: true },
  { id: "OT-00128", merchant: "Ripley", origen: "Ñuñoa", destino: "La Serena", bultos: 8, estado: "creada", creada: "15/05 12:10", driver1: null, driver2: null, bus: null, progreso: 0 },
];

function nowTs() {
  return new Date().toLocaleString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function nowClock() {
  return new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

interface KargoState {
  ots: OT[];
  log: LogEntry[];
  nextId: number;
  // actions
  addLog: (msg: string, otId?: string) => void;
  createOT: (data: Partial<OT> & { origen: string; destino: string; bultos: number; merchant?: string }) => OT;
  derivarOperador: (otId: string, operador: string) => void;
  asignarDriver1: (otId: string, driver: string) => void;
  scanBultoD1: (otId: string, n?: number) => void;
  firmarRecoleccion: (otId: string) => void;
  asignarBus: (otId: string, bus: string, driver2: string) => void;
  scanBultoLoader: (otId: string, n?: number) => void;
  confirmarCarga: (otId: string) => void;
  reportarIncidencia: (otId: string, motivo: string) => void;
  setProgreso: (otId: string, p: number) => void;
  moveEstado: (otId: string, estado: OTEstado) => void;
  generarFlujoEjemplo: () => void;
  resetDemo: () => void;
}

const updateOT = (ots: OT[], id: string, patch: Partial<OT>) =>
  ots.map((o) => (o.id === id ? { ...o, ...patch } : o));

export const useKargo = create<KargoState>((set, get) => {
  // background tick: auto progress in-transit OTs
  if (typeof window !== "undefined") {
    setInterval(() => {
      const ots = get().ots;
      let changed = false;
      const next = ots.map((o) => {
        if (o.estado === "en-transito" && o.progreso < 100) {
          changed = true;
          const inc = Math.random() * 4 + 1;
          const p = Math.min(100, Math.round(o.progreso + inc));
          if (p >= 100) {
            get().addLog(`OT ${o.id} entregada (100%)`, o.id);
            return { ...o, progreso: 100, estado: "finalizada" as OTEstado };
          }
          return { ...o, progreso: p };
        }
        return o;
      });
      if (changed) set({ ots: next });
    }, 3500);
  }

  return {
    ots: seed,
    log: [{ time: nowClock(), msg: "Sistema KARGO iniciado con datos de ejemplo" }],
    nextId: 129,

    addLog: (msg, otId) =>
      set((s) => ({ log: [{ time: nowClock(), msg, otId }, ...s.log].slice(0, 80) })),

    createOT: (data) => {
      const id = `OT-00${get().nextId}`;
      const ot: OT = {
        id,
        merchant: data.merchant ?? "Falabella",
        origen: data.origen,
        destino: data.destino,
        bultos: data.bultos,
        estado: "creada",
        creada: nowTs(),
        driver1: null,
        driver2: null,
        bus: null,
        progreso: 0,
      };
      set((s) => ({ ots: [...s.ots, ot], nextId: s.nextId + 1 }));
      get().addLog(`OT ${id} creada por Merchant`, id);
      return ot;
    },

    derivarOperador: (otId, operador) => {
      set((s) => ({ ots: updateOT(s.ots, otId, { operador }) }));
      get().addLog(`OT ${otId} derivada a ${operador}`, otId);
    },

    asignarDriver1: (otId, driver) => {
      set((s) => ({ ots: updateOT(s.ots, otId, { driver1: driver, estado: "recolectada" }) }));
      get().addLog(`OT ${otId} asignada a Driver 1: ${driver}`, otId);
    },

    scanBultoD1: (otId, n = 5) => {
      const ot = get().ots.find((o) => o.id === otId);
      if (!ot) return;
      const cur = ot.bultosEscaneadosD1 ?? 0;
      const next = Math.min(ot.bultos, cur + n);
      set((s) => ({ ots: updateOT(s.ots, otId, { bultosEscaneadosD1: next }) }));
    },

    firmarRecoleccion: (otId) => {
      set((s) => ({ ots: updateOT(s.ots, otId, { estado: "wh1" }) }));
      get().addLog(`OT ${otId} recolectada → Warehouse 1`, otId);
    },

    asignarBus: (otId, bus, driver2) => {
      const ot = get().ots.find((o) => o.id === otId);
      if (!ot) return;
      // si loader ya confirmó (manifiestoGenerado), pasa a en-transito
      const estado: OTEstado = ot.manifiestoGenerado ? "en-transito" : "wh1";
      set((s) => ({ ots: updateOT(s.ots, otId, { bus, driver2, estado, progreso: estado === "en-transito" ? 5 : 0 }) }));
      get().addLog(`OT ${otId} asignada a bus ${bus} con Driver 2: ${driver2}`, otId);
    },

    scanBultoLoader: (otId, n = 5) => {
      const ot = get().ots.find((o) => o.id === otId);
      if (!ot) return;
      const cur = ot.bultosEscaneadosLoader ?? 0;
      const next = Math.min(ot.bultos, cur + n);
      set((s) => ({ ots: updateOT(s.ots, otId, { bultosEscaneadosLoader: next }) }));
    },

    confirmarCarga: (otId) => {
      const ot = get().ots.find((o) => o.id === otId);
      if (!ot) return;
      // requiere bus asignado para pasar a tránsito
      const estado: OTEstado = ot.bus && ot.driver2 ? "en-transito" : "wh1";
      set((s) => ({
        ots: updateOT(s.ots, otId, {
          manifiestoGenerado: true,
          estado,
          progreso: estado === "en-transito" ? 5 : 0,
        }),
      }));
      get().addLog(
        `Manifiesto generado para ${otId}${estado === "en-transito" ? " → En tránsito" : " (esperando bus)"}`,
        otId
      );
    },

    reportarIncidencia: (otId, motivo) => {
      set((s) => ({ ots: updateOT(s.ots, otId, { estado: "incidencia" }) }));
      get().addLog(`Incidencia en ${otId}: ${motivo}`, otId);
    },

    setProgreso: (otId, p) => set((s) => ({ ots: updateOT(s.ots, otId, { progreso: p }) })),

    moveEstado: (otId, estado) => {
      set((s) => ({ ots: updateOT(s.ots, otId, { estado }) }));
      get().addLog(`OT ${otId} → ${estado}`, otId);
    },

    generarFlujoEjemplo: () => {
      const ot = get().createOT({ merchant: "Ejemplo S.A.", origen: "Las Condes", destino: "Temuco", bultos: 15 });
      const id = ot.id;
      const steps: Array<[number, () => void]> = [
        [1200, () => get().derivarOperador(id, "Op. RM Centro")],
        [2400, () => get().asignarDriver1(id, "Juan Martínez")],
        [4000, () => {
          const cur = get().ots.find((o) => o.id === id);
          if (cur) set((s) => ({ ots: updateOT(s.ots, id, { bultosEscaneadosD1: cur.bultos }) }));
          get().firmarRecoleccion(id);
        }],
        [5600, () => {
          const cur = get().ots.find((o) => o.id === id);
          if (cur) set((s) => ({ ots: updateOT(s.ots, id, { bultosEscaneadosLoader: cur.bultos }) }));
          get().confirmarCarga(id);
        }],
        [7000, () => get().asignarBus(id, "AB-CD-12", "Pedro López")],
      ];
      steps.forEach(([ms, fn]) => setTimeout(fn, ms));
    },

    resetDemo: () => set({ ots: seed, nextId: 129, log: [{ time: nowClock(), msg: "Demo reiniciado" }] }),
  };
});

// Selectors
export const selectByEstado = (estado: OTEstado | OTEstado[]) => (s: KargoState) => {
  const arr = Array.isArray(estado) ? estado : [estado];
  return s.ots.filter((o) => arr.includes(o.estado));
};
