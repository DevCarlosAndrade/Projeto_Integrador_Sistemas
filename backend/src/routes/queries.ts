import { Router } from "express";
import { pool } from "../config/db";

const router = Router();

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

// identificador precisa ser letras / numeros / underscore, comecando por letra ou _
function isValidIdent(name: string): boolean {
  return typeof name === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

// quota um identificador no padrao Postgres (aspas duplas)
function quoteIdent(name: string): string {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

// mapeia tipo do SQLite -> tipo do PostgreSQL
function mapType(sqliteType: string | undefined | null): string {
  const t = (sqliteType || "").toUpperCase().trim();
  if (!t) return "TEXT";
  if (/INT/.test(t)) return "BIGINT";
  if (/REAL|FLOAT|DOUB/.test(t)) return "DOUBLE PRECISION";
  if (/NUMERIC|DECIMAL/.test(t)) return "NUMERIC";
  if (/BOOL/.test(t)) return "BOOLEAN";
  if (/TIMESTAMP|DATETIME/.test(t)) return "TIMESTAMP";
  if (/DATE/.test(t)) return "DATE";
  if (/TIME/.test(t)) return "TIME";
  if (/BLOB/.test(t)) return "BYTEA";
  // TEXT, VARCHAR, CHAR, CLOB, JSON e quaisquer outros -> TEXT
  return "TEXT";
}

// ─────────────────────────────────────────────────────────
// GET /queries/slow
// Retorna TODAS as queries executadas no editor SQL, ordenadas
// por tempo medio desc (a partir de query_sniffer.editor_query_stats).
// ─────────────────────────────────────────────────────────
router.get("/slow", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        query,
        calls,
        total_exec_time,
        CASE WHEN calls > 0
             THEN total_exec_time / calls
             ELSE 0
        END AS mean_exec_time,
        last_executed
      FROM query_sniffer.editor_query_stats
      ORDER BY mean_exec_time DESC;
    `);

    res.json(result.rows);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// POST /queries/reset
// Zera as estatisticas das queries executadas no editor.
// ─────────────────────────────────────────────────────────
router.post("/reset", async (req, res) => {
  try {
    await pool.query("TRUNCATE TABLE query_sniffer.editor_query_stats;");
    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: err?.message ?? "Erro ao limpar as estatisticas.",
    });
  }
});

// ─────────────────────────────────────────────────────────
// POST /queries/stats/delete
// body: { query: string }
// Remove UMA unica query do historico (editor_query_stats).
// As demais queries continuam no historico.
// ─────────────────────────────────────────────────────────
router.post("/stats/delete", async (req, res) => {
  const query: string = (req.body?.query ?? "").toString();
  if (!query.trim()) {
    return res.status(400).json({ error: "query e obrigatoria." });
  }
  try {
    const result = await pool.query(
      "DELETE FROM query_sniffer.editor_query_stats WHERE query = $1",
      [query]
    );
    res.json({ ok: true, deleted: result.rowCount ?? 0 });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: err?.message ?? "Erro ao excluir a query.",
    });
  }
});

// ─────────────────────────────────────────────────────────
// POST /queries/import
// body: {
//   schemaName: string,             // ex: "sessao_abc123"
//   tables: [{
//     name: string,
//     columns: [{ name: string, type: string }],
//     values: any[][]                // linhas em ordem das colunas
//   }]
// }
// Cria um schema isolado, faz CREATE TABLE e popula via INSERT parametrizado.
// ─────────────────────────────────────────────────────────
router.post("/import", async (req, res) => {
  const { schemaName, tables } = req.body ?? {};

  if (!schemaName || !isValidIdent(schemaName)) {
    return res.status(400).json({
      error:
        "schemaName invalido. Use apenas letras, numeros e underscore (comecando por letra ou _).",
    });
  }
  if (!Array.isArray(tables) || tables.length === 0) {
    return res.status(400).json({
      error: "Envie pelo menos uma tabela em 'tables'.",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const schemaIdent = quoteIdent(schemaName);
    await client.query(`DROP SCHEMA IF EXISTS ${schemaIdent} CASCADE`);
    await client.query(`CREATE SCHEMA ${schemaIdent}`);

    let totalRows = 0;
    const createdTables: string[] = [];

    for (const table of tables) {
      const tableName: string = table?.name;
      const columns: Array<{ name: string; type: string }> = table?.columns ?? [];
      const valuesRows: any[][] = table?.values ?? [];

      if (!tableName || !isValidIdent(tableName)) {
        throw new Error(`Nome de tabela invalido: ${tableName}`);
      }
      if (columns.length === 0) {
        throw new Error(`Tabela "${tableName}" nao possui colunas.`);
      }

      // monta CREATE TABLE
      const columnDefs = columns
        .map((c) => {
          if (!isValidIdent(c.name)) {
            throw new Error(
              `Nome de coluna invalido na tabela "${tableName}": ${c.name}`
            );
          }
          return `${quoteIdent(c.name)} ${mapType(c.type)}`;
        })
        .join(", ");

      await client.query(
        `CREATE TABLE ${schemaIdent}.${quoteIdent(tableName)} (${columnDefs})`
      );
      createdTables.push(tableName);

      // insert em lotes pra nao estourar numero de parametros ($1..$N tem limite)
      // Postgres aceita ate ~65k parametros; 500 linhas * colunas fica bem abaixo
      const BATCH = 500;
      const colIdent = columns.map((c) => quoteIdent(c.name)).join(", ");

      for (let i = 0; i < valuesRows.length; i += BATCH) {
        const chunk = valuesRows.slice(i, i + BATCH);
        const params: any[] = [];
        const rowPlaceholders: string[] = [];

        for (const row of chunk) {
          const rowPh: string[] = [];
          for (let j = 0; j < columns.length; j++) {
            const v = row?.[j];
            params.push(v === undefined ? null : v);
            rowPh.push(`$${params.length}`);
          }
          rowPlaceholders.push(`(${rowPh.join(", ")})`);
        }

        await client.query(
          `INSERT INTO ${schemaIdent}.${quoteIdent(tableName)} (${colIdent})
           VALUES ${rowPlaceholders.join(", ")}`,
          params
        );
        totalRows += chunk.length;
      }
    }

    await client.query("COMMIT");
    res.json({
      ok: true,
      schemaName,
      tables: createdTables,
      rows: totalRows,
    });
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    res.status(500).json({
      error: err?.message ?? "Erro ao importar o banco.",
    });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────
// POST /queries/execute
// body: { sql: string, schemaName?: string }
// Se schemaName vier, faz SET search_path antes de rodar a query do usuario.
// ─────────────────────────────────────────────────────────
router.post("/execute", async (req, res) => {
  const sql: string = (req.body?.sql ?? "").toString().trim();
  const schemaName: string | undefined = req.body?.schemaName;

  if (!sql) {
    return res.status(400).json({
      error: "Nenhuma query foi enviada.",
      execTimeMs: 0,
    });
  }
  if (schemaName && !isValidIdent(schemaName)) {
    return res.status(400).json({
      error: "schemaName invalido.",
      execTimeMs: 0,
    });
  }

  const client = await pool.connect();
  const start = Date.now();
  try {
    if (schemaName) {
      await client.query(
        `SET search_path TO ${quoteIdent(schemaName)}, public`
      );
    }

    const result = await client.query(sql);
    const execTimeMs = Date.now() - start;

    // registra a query nas nossas estatisticas do editor
    // (upsert por texto da query — mesma query soma calls e tempo total)
    try {
      await pool.query(
        `INSERT INTO query_sniffer.editor_query_stats
           (query, calls, total_exec_time, last_executed)
         VALUES ($1, 1, $2, now())
         ON CONFLICT (query) DO UPDATE
           SET calls = query_sniffer.editor_query_stats.calls + 1,
               total_exec_time = query_sniffer.editor_query_stats.total_exec_time + EXCLUDED.total_exec_time,
               last_executed = now();`,
        [sql, execTimeMs]
      );
    } catch (statsErr) {
      console.error("[stats] falha ao registrar query no editor_query_stats:", statsErr);
      // nao falha a resposta pro usuario por conta das estatisticas
    }

    res.json({
      rows: result.rows,
      fields: (result.fields ?? []).map((f: any) => ({ name: f.name })),
      rowCount: result.rowCount,
      execTimeMs,
    });
  } catch (err: any) {
    const execTimeMs = Date.now() - start;
    console.error(err);
    res.status(400).json({
      error: err?.message ?? "Erro ao executar a query.",
      execTimeMs,
    });
  } finally {
    client.release();
  }
});

export default router;
