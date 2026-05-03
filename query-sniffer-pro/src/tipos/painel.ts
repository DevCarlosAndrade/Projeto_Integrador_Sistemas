// ──────────────────────────────────────────────
// Tipos compartilhados entre os componentes do painel (dashboard).
// ──────────────────────────────────────────────

export interface Coluna {
  name: string;
  type: string;
}

export interface TabelaInfo {
  name: string;
  columns: Coluna[];
}

export interface ResultadoQuery {
  rows: Record<string, any>[];
  fields: { name: string }[];
  rowCount: number | null;
  execTimeMs: number;
  // campos opcionais devolvidos pelo backend quando o resultado eh truncado
  totalRows?: number;
  truncated?: boolean;
  maxRows?: number;
}

export interface ErroQuery {
  error: string;
  execTimeMs: number;
}

export interface MensagemChat {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  timestamp: number;
}

export interface QueryLenta {
  query: string;
  calls: number;
  total_exec_time: number;
  mean_exec_time: number;
}

export type Severidade = "ok" | "warn" | "crit";
