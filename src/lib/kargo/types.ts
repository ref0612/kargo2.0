export type OTEstado =
  | "creada"
  | "asignada"
  | "recolectada"
  | "wh1"
  | "en-transito"
  | "finalizada"
  | "incidencia";

export interface OT {
  id: string;
  merchant: string;
  origen: string;
  destino: string;
  bultos: number;
  estado: OTEstado;
  creada: string;
  driver1: string | null;
  driver2: string | null;
  bus: string | null;
  progreso: number;
  operador?: string | null;
  manifiestoGenerado?: boolean;
  bultosEscaneadosD1?: number;
  bultosEscaneadosLoader?: number;
}

export interface LogEntry {
  time: string;
  msg: string;
  otId?: string;
}

export const ESTADO_LABEL: Record<OTEstado, string> = {
  creada: "Creada",
  asignada: "Asignada",
  recolectada: "En recolección",
  wh1: "En WH1",
  "en-transito": "En tránsito",
  finalizada: "Entregada",
  incidencia: "Con incidencia",
};

export const ESTADO_ORDER: OTEstado[] = [
  "creada",
  "asignada",
  "recolectada",
  "wh1",
  "en-transito",
  "finalizada",
];
