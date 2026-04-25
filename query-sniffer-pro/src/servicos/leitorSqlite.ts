// ──────────────────────────────────────────────
// Leitor de arquivos SQLite no browser (via sql.js).
// Faz validacao da extensao, abre o banco em memoria, descobre tabelas,
// extrai colunas/linhas, sanitiza identificadores pro Postgres e devolve
// o payload pronto pra ser enviado ao endpoint /queries/import.
//
// Toda a logica de transformacao SQLite -> payload mora aqui — o page.tsx
// so precisa orquestrar (chamar essa funcao + lidar com sucesso/erro).
// ──────────────────────────────────────────────

import type { TabelaInfo } from "@/src/tipos/painel";
import {
  sanitizarIdentificador,
  serializarValor,
} from "@/src/utilitarios/ajudantes";
import { carregarSqlJs } from "./carregadorSqlJs";

const EXTENSOES_VALIDAS = ["db", "sqlite", "sqlite3", "sql"];

// Formato de tabela enviado ao backend pra reconstruir o schema no Postgres.
export interface PayloadTabela {
  name: string;
  columns: { name: string; type: string }[];
  values: any[][];
}

export interface ResultadoLeituraSqlite {
  // tabelas para exibir na sidebar (sem os valores das linhas)
  tabelas: TabelaInfo[];
  // payload completo enviado ao backend (com valores)
  payloadTabelas: PayloadTabela[];
}

// Le um arquivo de banco e devolve a estrutura pronta pra importar no Postgres.
// Suporta dois formatos:
//   - binario (.db / .sqlite / .sqlite3): abre direto via sql.js
//   - script texto (.sql): cria um SQLite vazio em memoria e executa o script
//     (CREATE TABLE / INSERT / etc) — funciona pra dumps em dialeto SQLite.
//
// O callback aoMudarPasso eh opcional — serve pra UI exibir progresso.
// Lanca Error com mensagem amigavel em caso de extensao invalida, banco vazio
// ou erro de sintaxe no script.
export async function lerSqliteParaPayload(
  file: File,
  aoMudarPasso?: (passo: string) => void
): Promise<ResultadoLeituraSqlite> {
  // 1) valida extensao
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!EXTENSOES_VALIDAS.includes(ext ?? "")) {
    throw new Error("Formato inválido. Use .db, .sqlite, .sqlite3 ou .sql");
  }
  const ehScriptTexto = ext === "sql";

  aoMudarPasso?.(ehScriptTexto ? "Executando script SQL…" : "Lendo o arquivo…");

  // 2) carrega sql.js (cacheado em window apos a primeira chamada)
  const SQL = await carregarSqlJs();

  // 3) abre o banco — caminho diferente pra binario vs script texto
  let db: any;
  if (ehScriptTexto) {
    // 3a) script .sql: abre um SQLite vazio em memoria e executa o script
    const texto = await file.text();
    if (!texto.trim()) {
      throw new Error("Arquivo .sql está vazio.");
    }
    db = new SQL.Database();
    try {
      db.exec(texto);
    } catch (err: any) {
      // libera o banco antes de relancar o erro
      try { db.close(); } catch { /* ignore */ }
      const motivo = err?.message ?? String(err);
      throw new Error(
        `Erro ao executar o script SQL: ${motivo}. ` +
        `O leitor entende dialeto SQLite — dumps de MySQL ou PostgreSQL podem ` +
        `precisar de ajustes (ex: trocar crases por aspas duplas, remover ` +
        `ENGINE=, AUTO_INCREMENT, etc).`
      );
    }
  } else {
    // 3b) arquivo binario: abre direto como banco SQLite
    const buffer = await file.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buffer));
  }

  try {
    // 3) descobre as tabelas do usuario (ignora as do proprio sqlite)
    const resultadoTabelas = db.exec(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    );
    if (!resultadoTabelas.length || !resultadoTabelas[0].values.length) {
      throw new Error(
        ehScriptTexto
          ? "O script foi executado mas nenhuma tabela foi criada. Verifique se ele contém comandos CREATE TABLE."
          : "Nenhuma tabela encontrada no banco de dados."
      );
    }
    const nomesTabelas = resultadoTabelas[0].values.map(
      (r: any[]) => r[0] as string
    );

    aoMudarPasso?.("Extraindo dados…");

    // 4) extrai colunas + linhas de cada tabela
    const tabelas: TabelaInfo[] = [];
    const payloadTabelas: PayloadTabela[] = [];

    for (const nomeOriginal of nomesTabelas) {
      // 4a) PRAGMA table_info devolve linhas no formato:
      //     [cid, name, type, notnull, dflt_value, pk]
      const resultadoColunas = db.exec(
        `PRAGMA table_info("${nomeOriginal}")`
      );
      const colunasCruas =
        resultadoColunas.length && resultadoColunas[0].values.length
          ? resultadoColunas[0].values.map((r: any[]) => ({
              name: r[1] as string,
              type: (r[2] as string) || "TEXT",
            }))
          : [];

      // 4b) sanitiza identificadores: lowercase + so [a-z0-9_]
      const nomeTabelaSeguro = sanitizarIdentificador(nomeOriginal);
      const colunasSeguras = colunasCruas.map(
        (c: { name: string; type: string }) => ({
          name: sanitizarIdentificador(c.name),
          type: c.type,
        })
      );

      // 4c) puxa todas as linhas e serializa valor por valor
      //     (BLOBs viram null, datas/numeros/strings passam direto, etc)
      const resultadoLinhas = db.exec(`SELECT * FROM "${nomeOriginal}"`);
      const valores: any[][] =
        resultadoLinhas.length && resultadoLinhas[0].values.length
          ? resultadoLinhas[0].values.map((row: any[]) =>
              row.map((v) => serializarValor(v))
            )
          : [];

      tabelas.push({ name: nomeTabelaSeguro, columns: colunasSeguras });
      payloadTabelas.push({
        name: nomeTabelaSeguro,
        columns: colunasSeguras,
        values: valores,
      });
    }

    return { tabelas, payloadTabelas };
  } finally {
    // libera o banco em memoria mesmo se algo deu errado no meio
    db.close();
  }
}
