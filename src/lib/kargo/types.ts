export type OTEstado =
  | "creada"
  | "asignada"
  | "recolectada"
  | "wh1"
  | "en-transito"
  | "finalizada"
  | "incidencia"
  | "suspendida";

export type Modalidad = "A" | "B"; // A = retiro WH2, B = entrega en bodega cliente

export interface OT {
  id: string;
  merchant: string;
  origen: string;
  destino: string;
  bultos: number;
  peso?: number;
  estado: OTEstado;
  creada: string;
  driver1: string | null;
  driver2: string | null;
  bus: string | null;
  progreso: number;
  operador?: string | null;       // operador regional asignado por Kupos
  manifiestoGenerado?: boolean;
  bultosEscaneadosD1?: number;
  bultosEscaneadosLoader?: number;
  modalidad?: Modalidad;
  incidencia?: string | null;     // motivo última incidencia
  alertaTiempo?: number;          // minutos desde último evento (para timeouts)
}

export interface Operador {
  id: string;
  nombre: string;
  region: string;
  capacidadMax: number;           // OTs máximas simultáneas
  drivers: number;
  otif: number;                   // % OTIF del mes
  activo: boolean;
}

export interface LogEntry {
  time: string;
  msg: string;
  otId?: string;
  level?: "info" | "warn" | "error";
}

export const ESTADO_LABEL: Record<OTEstado, string> = {
  creada: "Creada",
  asignada: "Asignada",
  recolectada: "En recolección",
  wh1: "En WH1",
  "en-transito": "En tránsito",
  finalizada: "Entregada",
  incidencia: "Con incidencia",
  suspendida: "Suspendida",
};

export const ESTADO_ORDER: OTEstado[] = [
  "creada",
  "asignada",
  "recolectada",
  "wh1",
  "en-transito",
  "finalizada",
];

export const OPERADORES_SEED: Operador[] = [
  { id: "op-rm",   nombre: "Transportes Sur Ltda.",  region: "Metropolitana",    capacidadMax: 60, drivers: 12, otif: 97.8, activo: true },
  { id: "op-vp",   nombre: "LogiExpress Ltda.",       region: "Valparaíso",       capacidadMax: 40, drivers: 8,  otif: 96.2, activo: true },
  { id: "op-norte",nombre: "Cargo Norte SpA",          region: "Norte Grande",     capacidadMax: 30, drivers: 6,  otif: 94.1, activo: true },
  { id: "op-sur",  nombre: "SurCarga S.A.",            region: "Biobío/Araucanía", capacidadMax: 56, drivers: 14, otif: 98.3, activo: true },
  { id: "op-exrm", nombre: "ExpressRM",                region: "RM Sur",           capacidadMax: 35, drivers: 9,  otif: 97.1, activo: true },
];