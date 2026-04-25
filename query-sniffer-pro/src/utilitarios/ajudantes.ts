// ──────────────────────────────────────────────
// Funcoes utilitarias reutilizadas pelo painel.
// ──────────────────────────────────────────────

// So permite letras, numeros e underscore nos identificadores que vao virar
// schema/tabela/coluna no Postgres. Qualquer coisa fora disso vira "_".
// Forcamos lowercase pra que SELECT * FROM Genre funcione sem aspas
// (imita o comportamento case-insensitive do SQLite).
export function sanitizarIdentificador(name: string): string {
  const cleaned = String(name).toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return /^[a-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

// Gera um schemaName unico por sessao (nao persiste entre reloads).
export function novoNomeSchema(): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `sessao_${rnd}`;
}

// Converte um valor vindo do sql.js pra algo que o pg aceita como parametro.
export function serializarValor(v: any): any {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string" || typeof v === "boolean")
    return v;
  // Uint8Array (BLOB) — ignoramos por ora, senao vira um objeto gigante em JSON
  if (v instanceof Uint8Array) return null;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// Extrai o primeiro bloco ```sql ... ``` do texto que a IA retorna no chat.
export function extrairBlocoSql(text: string): string | undefined {
  // tenta bloco com linguagem explicita (```sql) primeiro
  const sqlFence = /```sql\s*([\s\S]*?)```/i.exec(text);
  if (sqlFence) return sqlFence[1].trim();
  // fallback: qualquer bloco ```
  const anyFence = /```\s*([\s\S]*?)```/.exec(text);
  if (anyFence) {
    const candidate = anyFence[1].trim();
    // so aceita se parecer SQL (tem uma palavra chave relevante)
    if (
      /\b(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER|DROP)\b/i.test(candidate)
    ) {
      return candidate;
    }
  }
  return undefined;
}
