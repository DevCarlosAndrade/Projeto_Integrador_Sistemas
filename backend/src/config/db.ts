import { Pool } from "pg";

export const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "monitoramento",
  password: "admin",
  port: 5433,
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
