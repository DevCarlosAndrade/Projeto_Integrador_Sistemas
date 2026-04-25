import { Pool } from "pg";

// ─────────────────────────────────────────────────────────
// Pool tunado pra suportar queries paralelas e proteger o backend:
//  - max=20: ate 20 conexoes simultaneas (default era 10)
//  - idleTimeoutMillis: fecha conexao ociosa apos 30s
//  - connectionTimeoutMillis: falha rapido se postgres ta indisponivel
//  - statement_timeout no nivel da conexao tambem (defesa em profundidade)
// ─────────────────────────────────────────────────────────
export const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "monitoramento",
  password: "admin",
  port: 5433,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // 60s no nivel do client — a rota /execute aplica um timeout menor (30s)
  // via SET LOCAL, mas isso aqui evita que algo escape do limite por bug
  statement_timeout: 60000,
});

// loga erros assincronos do pool (tipo: postgres caiu)
// senao o processo do node morre silenciosamente
pool.on("error", (err) => {
  console.error("[pg pool] erro inesperado:", err);
});

// ─────────────────────────────────────────────────────────
// Tabela propria pra monitorar SOMENTE as queries executadas
// no editor SQL do frontend (via POST /queries/execute).
// pg_stat_statements captura tudo (imports, DDL, etc),
// entao mantemos nossa propria contagem.
// ─────────────────────────────────────────────────────────
export async function ensureStatsTable(): Promise<void> {
  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS query_sniffer;`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS query_sniffer.editor_query_stats (
        query TEXT PRIMARY KEY,
        calls BIGINT NOT NULL DEFAULT 0,
        total_exec_time DOUBLE PRECISION NOT NULL DEFAULT 0,
        last_executed TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    console.log("[db] query_sniffer.editor_query_stats pronta.");
  } catch (err) {
    console.error("[db] Falha ao criar tabela de estatisticas:", err);
  }
}

// dispara no load do modulo
ensureStatsTable();
