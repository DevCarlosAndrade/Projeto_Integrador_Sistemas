import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// ─────────────────────────────────────────────────────────
// Cliente Gemini
// ─────────────────────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn(
    "[ai] GEMINI_API_KEY nao configurada. A rota /ai/chat respondera com erro ate que voce crie o .env no backend."
  );
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Cadeia de modelos — se o primeiro estiver sobrecarregado (503/429),
// o servidor tenta o proximo automaticamente. Os "lite" tem MUITO mais
// capacidade no free tier e sao tao bons pra SQL quanto os flash normais.
const MODEL_CHAIN = [
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.0-flash-lite",
];

// ─────────────────────────────────────────────────────────
// System prompt — trava o escopo em banco de dados
// ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
Voce e o "QuerySniffer.IA", um assistente especializado EXCLUSIVAMENTE em bancos de dados relacionais (SQL).

SEU ESCOPO DE ATUACAO (e APENAS ele):
1. Auxiliar na construcao de queries SQL (SELECT, INSERT, UPDATE, DELETE, JOIN, subqueries, CTEs, etc).
2. Otimizacao de consultas lentas (indices, reescrita de queries, planos de execucao, analise de EXPLAIN).
3. Sugestoes de melhoria em queries existentes (performance, legibilidade, correcao).
4. Duvidas conceituais sobre bancos de dados (normalizacao, chaves, transacoes, isolamento, tipos de dado, modelagem, etc).
5. Explicar comportamento de SGBDs (PostgreSQL, MySQL, SQLite, SQL Server, Oracle) no que se refere a queries e modelagem.

REGRAS DE RECUSA (OBRIGATORIAS):
- Se a pergunta do usuario NAO for relacionada a banco de dados ou SQL, voce DEVE recusar educadamente.
- NAO responda sobre: programacao geral (fora de SQL), receitas, politica, filosofia, matematica pura, jogos, entretenimento, saude, financas, viagens, conselhos pessoais, historia, geografia, idiomas, pedidos de traducao que nao sejam de codigo SQL, nada fora do dominio de banco de dados.
- Mesmo que o usuario insista, rejeite o pedido fora do escopo.
- Nao invente ou extrapole para outros dominios. Seja firme e educado.

FORMATO DA RECUSA (quando a pergunta estiver fora do escopo):
Responda em portugues, em no maximo 2 frases, algo como:
"Desculpe, sou o QuerySniffer.IA e so posso ajudar com assuntos relacionados a bancos de dados (queries SQL, otimizacao, modelagem, duvidas de SGBD). Posso te ajudar com alguma consulta ou duvida sobre o banco?"

QUANDO HOUVER CONTEXTO DE SCHEMA:
O usuario pode te enviar o schema de um banco (tabelas e colunas) como contexto. Use essas informacoes para gerar queries que realmente funcionem naquele banco. Respeite nomes EXATOS das tabelas e colunas.

IDIOMA:
Responda sempre em portugues do Brasil, a menos que o usuario peça explicitamente outro idioma dentro do escopo (ex: "explica em ingles").

ESTILO:
- Seja direto e objetivo.
- Quando gerar SQL, use blocos de codigo (\`\`\`sql ... \`\`\`).
- Comente apenas o essencial.
- Se a pergunta for ambigua, peca esclarecimento em UMA frase antes de gerar a query.
`.trim();

// ─────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────
type Role = "user" | "model";
interface ChatTurn {
  role: Role;
  content: string;
}
interface SchemaTable {
  name: string;
  columns: { name: string; type: string }[];
}

// ─────────────────────────────────────────────────────────
// Monta um bloco de contexto a partir do schema importado
// ─────────────────────────────────────────────────────────
// limites pra nao estourar o prompt (mais tokens = mais fila = mais chance de 503)
const MAX_TABLES_IN_CONTEXT = 40;
const MAX_COLS_PER_TABLE = 25;

function buildSchemaContext(tables: SchemaTable[] | undefined): string {
  if (!tables || tables.length === 0) {
    return "Nenhum banco de dados carregado no momento. Responda de forma geral.";
  }

  const truncatedTables = tables.slice(0, MAX_TABLES_IN_CONTEXT);
  const lines: string[] = [
    "Schema atual carregado no editor (use esses nomes exatos ao gerar queries):",
  ];
  for (const t of truncatedTables) {
    const allCols = t.columns ?? [];
    const cols = allCols
      .slice(0, MAX_COLS_PER_TABLE)
      .map((c) => `${c.name} ${c.type || "TEXT"}`)
      .join(", ");
    const extra =
      allCols.length > MAX_COLS_PER_TABLE
        ? `, ...(+${allCols.length - MAX_COLS_PER_TABLE} colunas)`
        : "";
    lines.push(`- ${t.name}(${cols}${extra})`);
  }
  if (tables.length > MAX_TABLES_IN_CONTEXT) {
    lines.push(
      `...(+${tables.length - MAX_TABLES_IN_CONTEXT} tabelas nao listadas; pergunte ao usuario se precisar delas)`
    );
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────
// Helper compartilhado: chama o Gemini com cadeia de modelos
// (fallback automatico em 429/500/502/503/504).
// ─────────────────────────────────────────────────────────
const TRANSIENT_CODES = [429, 500, 502, 503, 504];
const ATTEMPTS_PER_MODEL = 2;

type GeminiHistoryTurn = { role: "user" | "model"; parts: { text: string }[] };

async function callGemini(options: {
  systemInstruction: string;
  userMessage: string;
  history?: GeminiHistoryTurn[];
  maxOutputTokens?: number;
  temperature?: number;
  logTag: string;
}): Promise<string> {
  if (!genAI) {
    throw new Error(
      "GEMINI_API_KEY nao configurada no backend. Crie um arquivo .env com GEMINI_API_KEY=... e reinicie o servidor."
    );
  }

  let lastErr: any = null;

  for (const modelName of MODEL_CHAIN) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: options.systemInstruction,
    });

    const chat = model.startChat({
      history: options.history ?? [],
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxOutputTokens ?? 768,
      },
    });

    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const result = await chat.sendMessage(options.userMessage);
        const reply = result.response.text();
        if (modelName !== MODEL_CHAIN[0] || attempt > 1) {
          console.log(
            `[${options.logTag}] OK com ${modelName} (tentativa ${attempt})`
          );
        }
        return reply;
      } catch (e: any) {
        lastErr = e;
        const msg = String(e?.message ?? "");
        const codeMatch = msg.match(/\[(\d{3})\b/);
        const code = codeMatch ? Number(codeMatch[1]) : null;
        const isTransient = code !== null && TRANSIENT_CODES.includes(code);

        if (!isTransient) throw e;

        if (attempt < ATTEMPTS_PER_MODEL) {
          const delay = 800 * attempt + Math.floor(Math.random() * 200);
          console.warn(
            `[${options.logTag}] ${code} em ${modelName}, retry ${attempt}/${ATTEMPTS_PER_MODEL - 1} em ${delay}ms`
          );
          await new Promise((r) => setTimeout(r, delay));
        } else {
          console.warn(
            `[${options.logTag}] ${code} em ${modelName}, esgotado — caindo pro proximo modelo`
          );
        }
      }
    }
  }

  throw lastErr ?? new Error("Todos os modelos do Gemini estao sobrecarregados.");
}

// Traduz o erro do SDK num status/mensagem amigavel.
function respondWithAiError(res: any, err: any, logTag: string) {
  console.error(`[${logTag}]`, err);
  const msg = String(err?.message ?? "");
  const codeMatch = msg.match(/\[(\d{3})\b/);
  const code = codeMatch ? Number(codeMatch[1]) : null;

  if (code === 503 || code === 429) {
    return res.status(503).json({
      error:
        "O Gemini está sobrecarregado no momento (o free tier tem limites em horário de pico). Tente novamente em alguns segundos.",
    });
  }

  return res.status(500).json({
    error: err?.message ?? "Erro ao consultar a IA.",
  });
}

// ─────────────────────────────────────────────────────────
// POST /ai/chat
// body: {
//   messages: [{ role: "user"|"model", content: string }, ...],
//   tables?: [{ name, columns: [{ name, type }] }]
// }
// Retorna: { reply: string }
// ─────────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  try {
    const messages: ChatTurn[] = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];
    const tables: SchemaTable[] | undefined = req.body?.tables;

    if (messages.length === 0) {
      return res.status(400).json({ error: "Envie pelo menos uma mensagem." });
    }

    const last = messages[messages.length - 1];
    if (last.role !== "user" || !last.content?.trim()) {
      return res
        .status(400)
        .json({ error: "A ultima mensagem precisa ser do usuario." });
    }

    const history: GeminiHistoryTurn[] = messages.slice(0, -1).map((m) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    while (history.length > 0 && history[0].role !== "user") history.shift();

    const schemaContext = buildSchemaContext(tables);
    const systemInstruction = `${SYSTEM_PROMPT}\n\nCONTEXTO DO BANCO:\n${schemaContext}`;

    const reply = await callGemini({
      systemInstruction,
      userMessage: last.content,
      history,
      logTag: "ai/chat",
    });

    res.json({ reply });
  } catch (err: any) {
    return respondWithAiError(res, err, "ai/chat");
  }
});

// ─────────────────────────────────────────────────────────
// POST /ai/optimize
// body: {
//   query: string,              // SQL original
//   tables?: [{ name, columns: [{ name, type }] }],
//   meanExecMs?: number,        // metricas atuais (opcional, so pra dar contexto)
//   totalExecMs?: number,
//   calls?: number
// }
// Retorna: { reply: string, optimizedSql?: string }
// ─────────────────────────────────────────────────────────
const OPTIMIZE_SYSTEM_PROMPT = `
Voce e o "QuerySniffer.IA", especialista em OTIMIZACAO de queries SQL para PostgreSQL.

Sua tarefa: receber uma query que foi identificada como LENTA ou CRITICA e produzir uma versao OTIMIZADA dela.

REGRAS OBRIGATORIAS:
1. Retorne SEMPRE a query otimizada dentro de UM unico bloco \`\`\`sql ... \`\`\` (essencial pra UI extrair).
2. A query otimizada deve ser FUNCIONALMENTE EQUIVALENTE a original (mesmo resultado, so mais rapida).
3. Use o schema informado no contexto — respeite nomes EXATOS de tabelas e colunas.
4. Depois do bloco de codigo, escreva uma secao curta "### Melhorias aplicadas" em portugues, com bullets (3 a 6 itens) explicando o que mudou e por que (ex: "troquei SELECT * por colunas especificas", "adicionei LIMIT", "sugiro criar indice em tabela(coluna)", "substitui subquery correlacionada por JOIN", "removi ORDER BY desnecessario", etc).
5. Se detectar que seria util criar um INDICE, sugira o comando \`CREATE INDEX ...\` em um SEGUNDO bloco \`\`\`sql (apos o primeiro).
6. Se a query ja estiver praticamente otima, responda isso com sinceridade, mas ainda assim devolva a query original no bloco \`\`\`sql pra manter o formato.
7. NAO responda sobre qualquer assunto fora de SQL/otimizacao — isso aqui nao e chat aberto.
8. Seja DIRETO e tecnico. Nada de preambulo tipo "claro, posso ajudar". Va direto pro bloco de codigo.

FORMATO EXATO DA RESPOSTA:
\`\`\`sql
-- query otimizada
...
\`\`\`

### Melhorias aplicadas
- ponto 1
- ponto 2
- ponto 3

(opcional)
\`\`\`sql
CREATE INDEX ...
\`\`\`
`.trim();

router.post("/optimize", async (req, res) => {
  try {
    const query: string = (req.body?.query ?? "").toString().trim();
    const tables: SchemaTable[] | undefined = req.body?.tables;
    const meanExecMs: number | undefined = req.body?.meanExecMs;
    const totalExecMs: number | undefined = req.body?.totalExecMs;
    const calls: number | undefined = req.body?.calls;

    if (!query) {
      return res.status(400).json({ error: "Envie a query original em 'query'." });
    }

    const schemaContext = buildSchemaContext(tables);
    const systemInstruction = `${OPTIMIZE_SYSTEM_PROMPT}\n\nCONTEXTO DO BANCO:\n${schemaContext}`;

    const metricsLine =
      meanExecMs !== undefined || totalExecMs !== undefined || calls !== undefined
        ? `Metricas atuais: calls=${calls ?? "?"}, tempo medio=${
            meanExecMs !== undefined ? meanExecMs.toFixed(2) + "ms" : "?"
          }, tempo total=${
            totalExecMs !== undefined ? totalExecMs.toFixed(2) + "ms" : "?"
          }.`
        : "Metricas atuais nao informadas.";

    const userMessage = `${metricsLine}\n\nQuery original:\n\`\`\`sql\n${query}\n\`\`\`\n\nProduza a versao otimizada seguindo o formato obrigatorio.`;

    const reply = await callGemini({
      systemInstruction,
      userMessage,
      maxOutputTokens: 4096, //aumentei para permitir respostas mais longas (foi oq quebrou antes)
      temperature: 0.3,
      logTag: "ai/optimize",
    });

    //remover o comentario caso queira analisar a resposta bruta do gemini
    //console.log("[ai/optimize] Resposta bruta da IA:", reply);

    // extrai o primeiro bloco ```sql pra devolver ja separado pro frontend
    const sqlFence = /```sql\s*([\s\S]*?)```/i.exec(reply);
    const optimizedSql = sqlFence ? sqlFence[1].trim() : undefined;

    res.json({ reply, optimizedSql });
  } catch (err: any) {
    return respondWithAiError(res, err, "ai/optimize");
  }
});

// ─────────────────────────────────────────────────────────
// POST /ai/suggestions
// body: { tables: [{ name, columns: [{ name, type }] }] }
// Retorna: { suggestions: string[] }  // 4 perguntas em linguagem natural
// ─────────────────────────────────────────────────────────
const SUGGESTIONS_SYSTEM_PROMPT = `
Voce e o "QuerySniffer.IA". Sua tarefa aqui e gerar sugestoes de CONSULTAS em LINGUAGEM NATURAL (portugues do Brasil) que o usuario poderia pedir com base no schema do banco informado.

REGRAS OBRIGATORIAS:
1. Retorne EXATAMENTE 4 sugestoes.
2. Cada sugestao deve ser UMA frase curta e natural (maximo 15 palavras), como se fosse uma pessoa falando.
3. As sugestoes devem ser RELEVANTES pras tabelas/colunas que foram passadas. Nao invente tabelas.
4. Varie: inclua consultas diferentes (contagem, ranking, filtro por periodo, relacionamento entre tabelas quando fizer sentido, etc).
5. Nao escreva SQL. Escreva o PEDIDO em portugues, do jeito que um usuario falaria.
6. NAO inclua numeracao, bullets, aspas, nem preambulo.
7. Retorne um JSON valido e NADA mais. Formato exato:

{"suggestions":["pergunta 1","pergunta 2","pergunta 3","pergunta 4"]}

Se nenhuma tabela foi informada, retorne 4 perguntas bem genericas sobre bancos de dados / SQL.
`.trim();

router.post("/suggestions", async (req, res) => {
  try {
    const tables: SchemaTable[] | undefined = req.body?.tables;
    const schemaContext = buildSchemaContext(tables);

    const reply = await callGemini({
      systemInstruction: `${SUGGESTIONS_SYSTEM_PROMPT}\n\nCONTEXTO DO BANCO:\n${schemaContext}`,
      userMessage:
        "Gere agora as 4 sugestoes de consultas em JSON conforme o formato obrigatorio.",
      maxOutputTokens: 800, // subido pra evitar truncamento do JSON
      temperature: 0.7,
      logTag: "ai/suggestions",
    });

    // ── parse defensivo ──
    // 1) tira fence ```json ... ``` se existir
    let jsonText = reply.trim();
    const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(jsonText);
    if (fence) jsonText = fence[1].trim();

    // detecta strings com cara de JSON cru (chave, abertura de objeto, etc)
    const looksLikeRawJson = (s: string): boolean => {
      const t = s.trim();
      if (!t) return true;
      if (t.startsWith("{") || t.startsWith("[")) return true;
      if (/"suggestions"\s*:/.test(t)) return true;
      const braces = (t.match(/[{}\[\]]/g) ?? []).length;
      return braces >= 2;
    };

    let suggestions: string[] = [];

    // 2) tenta JSON.parse do texto limpo
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed?.suggestions)) {
        suggestions = parsed.suggestions
          .filter((s: any) => typeof s === "string" && s.trim().length > 0)
          .map((s: string) => s.trim());
      }
    } catch {
      // 3) fallback robusto: extrai strings entre aspas do texto todo.
      //    funciona mesmo se o JSON estiver truncado no meio.
      const quoted = reply.match(/"([^"\\]{6,200}(?:\\.[^"\\]*)*)"/g) ?? [];
      suggestions = quoted
        .map((q) => q.slice(1, -1).replace(/\\"/g, '"').trim())
        // descarta chaves de objeto tipo "suggestions"
        .filter((s) => !/^[a-z_]+$/i.test(s))
        .filter((s) => !looksLikeRawJson(s));
    }

    // 4) filtro final: remove qualquer sobra com cara de JSON e normaliza tamanho
    suggestions = suggestions
      .map((s) => s.trim())
      .filter((s) => s.length >= 8 && s.length <= 200)
      .filter((s) => !looksLikeRawJson(s))
      .slice(0, 4);

    if (suggestions.length === 0) {
      return res.status(502).json({
        error: "Nao consegui gerar sugestoes agora. Tente de novo em instantes.",
      });
    }

    res.json({ suggestions });
  } catch (err: any) {
    return respondWithAiError(res, err, "ai/suggestions");
  }
});

export default router;
