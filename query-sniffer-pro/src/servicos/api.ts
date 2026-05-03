// ──────────────────────────────────────────────
// Camada de comunicacao com o backend Express (porta 3002).
// Cada funcao encapsula um endpoint e devolve os dados ja parseados.
// ──────────────────────────────────────────────
import type {
  ErroQuery,
  MensagemChat,
  QueryLenta,
  ResultadoQuery,
  TabelaInfo,
} from "@/src/tipos/painel";

export const BACKEND = "http://localhost:3002";

// formato de tabela enviado pra IA pra dar contexto do schema
type ContextoTabelaIA = {
  name: string;
  columns: { name: string; type: string }[];
};

function tabelasParaContextoIA(tables: TabelaInfo[]): ContextoTabelaIA[] {
  return tables.map((t) => ({
    name: t.name,
    columns: t.columns.map((c) => ({ name: c.name, type: c.type })),
  }));
}

// ── /queries/execute ──
export async function executarQuery(
  sql: string,
  schemaName: string | null
): Promise<ResultadoQuery | ErroQuery> {
  const res = await fetch(`${BACKEND}/queries/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql, schemaName }),
  });
  const data = await res.json();
  if (!res.ok) return data as ErroQuery;
  return data as ResultadoQuery;
}

// ── /queries/import ──
export async function importarBanco(
  schemaName: string,
  tables: Array<{
    name: string;
    columns: { name: string; type: string }[];
    values: any[][];
  }>
): Promise<void> {
  const res = await fetch(`${BACKEND}/queries/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schemaName, tables }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data?.error ?? `Falha ao importar no PostgreSQL (HTTP ${res.status}).`
    );
  }
}

// ── /queries/slow ──
export async function buscarQueriesLentas(): Promise<QueryLenta[]> {
  const res = await fetch(`${BACKEND}/queries/slow`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((row: any) => ({
    query: String(row.query ?? ""),
    calls: Number(row.calls ?? 0),
    total_exec_time: Number(row.total_exec_time ?? 0),
    mean_exec_time: Number(row.mean_exec_time ?? 0),
  }));
}

// ── /queries/reset ──
export async function limparEstatisticas(): Promise<void> {
  const res = await fetch(`${BACKEND}/queries/reset`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `HTTP ${res.status}`);
  }
}

// ── /queries/stats/delete ──
export async function excluirQueryEstatistica(query: string): Promise<void> {
  const res = await fetch(`${BACKEND}/queries/stats/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Erro ao excluir a query.");
  }
}

// ── /ai/chat ──
export async function conversarComIA(
  messages: MensagemChat[],
  novoTextoUsuario: string,
  tables: TabelaInfo[]
): Promise<string> {
  // monta historico ANTES de incluir a nova mensagem,
  // pra mandar pro backend ja no formato { role, content }
  const historico = messages.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    content: m.content,
  }));
  const payload = [
    ...historico,
    { role: "user" as const, content: novoTextoUsuario },
  ];

  const res = await fetch(`${BACKEND}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: payload,
      tables: tabelasParaContextoIA(tables),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Erro ao consultar a IA.");
  return (data?.reply as string) ?? "";
}

// ── /ai/optimize ──
export async function otimizarQueryComIA(
  query: string,
  meanExecMs: number,
  totalExecMs: number,
  calls: number,
  tables: TabelaInfo[]
): Promise<{ reply: string; optimizedSql: string | null }> {
  const res = await fetch(`${BACKEND}/ai/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      meanExecMs,
      totalExecMs,
      calls,
      tables: tabelasParaContextoIA(tables),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Erro ao otimizar a query.");
  return {
    reply: data?.reply ?? "",
    optimizedSql: data?.optimizedSql ?? null,
  };
}

// ── /ai/suggestions ──
export async function buscarSugestoesIA(
  tables: TabelaInfo[]
): Promise<string[]> {
  const res = await fetch(`${BACKEND}/ai/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tables: tabelasParaContextoIA(tables) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  // sanitiza qualquer sugestao que ainda tenha cara de JSON cru
  const raw = data?.suggestions;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s: any) => (typeof s === "string" ? s.trim() : ""))
    .filter((s: string) => s.length >= 8 && s.length <= 200)
    .filter(
      (s: string) =>
        !s.startsWith("{") &&
        !s.startsWith("[") &&
        !/"suggestions"\s*:/.test(s)
    );
}
