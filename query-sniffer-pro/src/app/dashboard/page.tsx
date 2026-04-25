"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Database,
  LogOut,
  Table2,
  ChevronRight,
  ChevronDown,
  Upload,
  Columns,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  Braces,
  Play,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Rows,
  Trash2,
  Sparkles,
  Send,
  User as UserIcon,
  ArrowRight,
  Copy,
  Activity,
  RefreshCw,
  X,
  TrendingUp,
  Flame,
  Gauge,
  Eraser,
} from "lucide-react";

const BACKEND = "http://localhost:3002";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

// so permite letras, numeros e underscore nos identificadores que vao virar
// schema/tabela/coluna no Postgres. Qualquer coisa fora disso vira "_".
// Forcamos lowercase pra que SELECT * FROM Genre funcione sem aspas
// (imita o comportamento case-insensitive do SQLite).
function sanitizeIdent(name: string): string {
  const cleaned = String(name).toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return /^[a-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

// gera um schemaName unico por sessao (nao persiste entre reloads).
function newSchemaName(): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `sessao_${rnd}`;
}

// converte um valor vindo do sql.js pra algo que o pg aceita como parametro.
function serializeValue(v: any): any {
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

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────
interface Column {
  name: string;
  type: string;
}

interface TableInfo {
  name: string;
  columns: Column[];
}

interface QueryResult {
  rows: Record<string, any>[];
  fields: { name: string }[];
  rowCount: number | null;
  execTimeMs: number;
}

interface QueryError {
  error: string;
  execTimeMs: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  timestamp: number;
}

interface SlowQuery {
  query: string;
  calls: number;
  total_exec_time: number;
  mean_exec_time: number;
}

// limiares de tempo medio de execucao (em ms) para classificar uma query
const SLOW_WARN_MS = 100;
const SLOW_CRIT_MS = 500;

type Severity = "ok" | "warn" | "crit";

function getSeverity(meanMs: number): Severity {
  if (meanMs >= SLOW_CRIT_MS) return "crit";
  if (meanMs >= SLOW_WARN_MS) return "warn";
  return "ok";
}

const severityStyles: Record<
  Severity,
  { label: string; textColor: string; bgColor: string; borderColor: string; dotColor: string }
> = {
  ok: {
    label: "Rápida",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    dotColor: "bg-green-400",
  },
  warn: {
    label: "Lenta",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    dotColor: "bg-yellow-400",
  },
  crit: {
    label: "Crítica",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    dotColor: "bg-red-400",
  },
};

// ──────────────────────────────────────────────
// Ícone por tipo de coluna
// ──────────────────────────────────────────────
function ColumnTypeIcon({ type }: { type: string }) {
  const t = type.toUpperCase();
  if (t.includes("INT") || t.includes("REAL") || t.includes("NUMERIC") || t.includes("FLOAT") || t.includes("DOUBLE"))
    return <Hash size={12} className="text-blue-400 shrink-0" />;
  if (t.includes("BOOL"))
    return <ToggleLeft size={12} className="text-green-400 shrink-0" />;
  if (t.includes("DATE") || t.includes("TIME"))
    return <Calendar size={12} className="text-yellow-400 shrink-0" />;
  if (t.includes("JSON") || t.includes("BLOB"))
    return <Braces size={12} className="text-purple-400 shrink-0" />;
  return <Type size={12} className="text-slate-400 shrink-0" />;
}

// ──────────────────────────────────────────────
// Item de tabela na sidebar
// ──────────────────────────────────────────────
function TableItem({
  table,
  isOpen,
  onToggle,
}: {
  table: TableInfo;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group cursor-pointer
          ${isOpen
            ? "bg-blue-600/20 border border-blue-500/30 text-blue-300"
            : "hover:bg-white/5 text-slate-400 hover:text-blue-400 border border-transparent"
          }`}
      >
        {isOpen ? (
          <ChevronDown size={14} className="shrink-0 text-blue-400" />
        ) : (
          <ChevronRight size={14} className="shrink-0 group-hover:text-blue-400" />
        )}
        <Table2 size={14} className="shrink-0 group-hover:text-blue-400 transition-colors" />
        <span className="text-xs font-mono font-semibold truncate group-hover:text-blue-400 transition-colors">
          {table.name}
        </span>
        <span className="ml-auto text-[10px] text-slate-600 group-hover:text-blue-500/60">
          {table.columns.length}
        </span>
      </button>

      {isOpen && (
        <div className="mt-1 ml-4 pl-3 border-l border-blue-500/20 space-y-0.5">
          {table.columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
            >
              <ColumnTypeIcon type={col.type} />
              <span className="text-[11px] font-mono text-slate-300 truncate">{col.name}</span>
              <span className="ml-auto text-[9px] text-slate-600 uppercase tracking-wide shrink-0">
                {col.type || "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Bolha de mensagem do chat
// ──────────────────────────────────────────────
function ChatBubble({
  message,
  onUseSql,
}: {
  message: ChatMessage;
  onUseSql: (sql: string) => void;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!message.sql) return;
    try {
      await navigator.clipboard.writeText(message.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
          ${isUser
            ? "bg-blue-600"
            : "bg-blue-500/10 border border-blue-500/30"
          }`}
      >
        {isUser ? (
          <UserIcon size={13} className="text-white" />
        ) : (
          <Sparkles size={13} className="text-blue-400" />
        )}
      </div>

      <div className={`flex flex-col gap-1.5 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words
            ${isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white/5 text-slate-200 border border-white/5 rounded-tl-sm"
            }`}
        >
          {message.content}
        </div>

        {message.sql && (
          <div className="w-full bg-[#04040a] border border-blue-500/20 rounded-lg overflow-hidden">
            <pre className="text-[11px] text-slate-300 font-mono p-3 overflow-x-auto leading-relaxed">
              {message.sql}
            </pre>
            <div className="flex items-center justify-between px-2 py-1.5 border-t border-white/5 bg-[#0a0c20]/50">
              <span className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">
                SQL sugerido
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  title="Copiar"
                >
                  <Copy size={10} />
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <button
                  onClick={() => onUseSql(message.sql!)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  title="Usar no editor"
                >
                  Usar
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────
export default function Dashboard() {
  // — estado do banco —
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [openTables, setOpenTables] = useState<Set<string>>(new Set());
  const [dbName, setDbName] = useState<string | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [schemaName, setSchemaName] = useState<string | null>(null);

  // — estado do editor —
  const [sql, setSql] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<QueryError | null>(null);
  const [running, setRunning] = useState(false);

  // — estado do chat QuerySniffer.IA —
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatThinking, setChatThinking] = useState(false);
  // sugestoes dinamicas geradas pela IA baseadas no schema carregado
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsFor, setSuggestionsFor] = useState<string | null>(null);

  // — estado do monitoramento —
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [slowError, setSlowError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  // query selecionada pra abrir no popup de detalhes
  const [selectedSlowQuery, setSelectedSlowQuery] = useState<SlowQuery | null>(null);
  const [copiedSlowQuery, setCopiedSlowQuery] = useState(false);
  // — otimizacao da query selecionada (via IA) —
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeReply, setOptimizeReply] = useState<string | null>(null);
  const [optimizedSql, setOptimizedSql] = useState<string | null>(null);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [copiedOptimized, setCopiedOptimized] = useState(false);
  // — exclusao de uma unica query do historico —
  const [confirmDeleteQuery, setConfirmDeleteQuery] = useState(false);
  const [deletingQuery, setDeletingQuery] = useState(false);
  const [deleteQueryError, setDeleteQueryError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // auto-scroll do chat sempre que chegarem mensagens novas
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, chatThinking]);

  // ── Chave estavel pra cache das sugestoes (nome do schema + tabelas) ──
  const suggestionsCacheKey = schemaName
    ? `${schemaName}::${tables.map((t) => t.name).join(",")}`
    : "";

  // ── Busca sugestoes da IA baseadas no schema atual ──
  useEffect(() => {
    // sem banco carregado: nao busca (o welcome card mostra a msg generica)
    if (tables.length === 0) {
      setSuggestions([]);
      setSuggestionsFor(null);
      return;
    }
    // ja temos sugestoes pra esse schema, nao precisa refazer
    if (suggestionsFor === suggestionsCacheKey) return;

    let cancelled = false;
    setLoadingSuggestions(true);
    setSuggestions([]);

    (async () => {
      try {
        const res = await fetch(`${BACKEND}/ai/suggestions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tables: tables.map((t) => ({
              name: t.name,
              columns: t.columns.map((c) => ({ name: c.name, type: c.type })),
            })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        // defesa extra: limpa qualquer sugestao que ainda tenha cara de JSON cru
        const sanitize = (raw: unknown): string[] => {
          if (!Array.isArray(raw)) return [];
          return raw
            .map((s) => (typeof s === "string" ? s.trim() : ""))
            .filter((s) => s.length >= 8 && s.length <= 200)
            .filter(
              (s) =>
                !s.startsWith("{") &&
                !s.startsWith("[") &&
                !/"suggestions"\s*:/.test(s)
            );
        };
        const clean = sanitize(data?.suggestions);
        if (res.ok && clean.length > 0) {
          setSuggestions(clean);
          setSuggestionsFor(suggestionsCacheKey);
        } else {
          // fallback local: sugestoes genericas baseadas nos nomes das tabelas
          const t0 = tables[0]?.name;
          const t1 = tables[1]?.name;
          const fallback = [
            `Liste os 10 primeiros registros de ${t0}`,
            `Quantos registros existem em ${t0}?`,
            t1 ? `Mostre um join entre ${t0} e ${t1}` : `Mostre colunas e tipos de ${t0}`,
            `Quais são as tabelas com mais colunas neste banco?`,
          ].filter(Boolean) as string[];
          setSuggestions(fallback);
          setSuggestionsFor(suggestionsCacheKey);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tables, suggestionsCacheKey, suggestionsFor]);

  // ── Extrai o primeiro bloco ```sql ... ``` do texto da IA ──
  const extractSqlBlock = (text: string): string | undefined => {
    // tenta bloco com linguagem explicita (```sql) primeiro
    const sqlFence = /```sql\s*([\s\S]*?)```/i.exec(text);
    if (sqlFence) return sqlFence[1].trim();
    // fallback: qualquer bloco ```
    const anyFence = /```\s*([\s\S]*?)```/.exec(text);
    if (anyFence) {
      const candidate = anyFence[1].trim();
      // so aceita se parecer SQL (tem uma palavra chave relevante)
      if (/\b(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER|DROP)\b/i.test(candidate)) {
        return candidate;
      }
    }
    return undefined;
  };

  // ── Envia mensagem do chat para a IA (Gemini via backend) ──
  // Opcionalmente aceita um texto direto (usado pelas sugestoes clicaveis).
  const sendChatMessage = useCallback(async (override?: string) => {
    const text = (override ?? chatInput).trim();
    if (!text || chatThinking) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    // monta historico ANTES de incluir a nova mensagem no estado,
    // pra mandar pro backend ja no formato { role, content }
    const history = messages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      content: m.content,
    }));
    const payloadMessages = [
      ...history,
      { role: "user" as const, content: text },
    ];

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatThinking(true);

    try {
      const res = await fetch(`${BACKEND}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          tables: tables.map((t) => ({
            name: t.name,
            columns: t.columns.map((c) => ({ name: c.name, type: c.type })),
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Erro ao consultar a IA.");
      }

      const reply: string = data?.reply ?? "";
      const sql = extractSqlBlock(reply);

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: reply || "(sem resposta)",
        sql,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content:
          "⚠️ Não consegui falar com a IA: " +
          (err?.message ?? "erro desconhecido") +
          ". Verifique se o backend está rodando e se a GEMINI_API_KEY está configurada.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setChatThinking(false);
    }
  }, [chatInput, chatThinking, messages, tables]);

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  // ao clicar em "Usar" numa sugestao, joga o SQL no editor e foca nele
  const useSqlFromChat = (sqlText: string) => {
    setSql(sqlText);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(sqlText.length, sqlText.length);
    });
  };

  const clearChat = () => {
    setMessages([]);
    setChatInput("");
    chatInputRef.current?.focus();
  };

  // ── Busca queries lentas no pg_stat_statements ──
  const fetchSlowQueries = useCallback(async () => {
    setLoadingSlow(true);
    setSlowError(null);
    try {
      const res = await fetch(`${BACKEND}/queries/slow`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSlowQueries(
        Array.isArray(data)
          ? data.map((row: any) => ({
              query: String(row.query ?? ""),
              calls: Number(row.calls ?? 0),
              total_exec_time: Number(row.total_exec_time ?? 0),
              mean_exec_time: Number(row.mean_exec_time ?? 0),
            }))
          : []
      );
    } catch (err: any) {
      setSlowError(
        err?.message?.includes("Failed to fetch")
          ? "Não foi possível conectar ao backend na porta 3002."
          : err?.message ?? "Erro ao buscar queries."
      );
    } finally {
      setLoadingSlow(false);
    }
  }, []);

  const openMonitoring = () => {
    setShowMonitoring(true);
    setConfirmReset(false);
    fetchSlowQueries();
  };

  // ── Zera o pg_stat_statements ──
  const resetSlowQueries = useCallback(async () => {
    setResetting(true);
    setSlowError(null);
    try {
      const res = await fetch(`${BACKEND}/queries/reset`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setSlowQueries([]);
      // refetch pra confirmar o reset (normalmente volta vazio ate rodar algo)
      await fetchSlowQueries();
    } catch (err: any) {
      setSlowError(
        err?.message?.includes("Failed to fetch")
          ? "Não foi possível conectar ao backend na porta 3002."
          : err?.message ?? "Erro ao limpar a lista."
      );
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  }, [fetchSlowQueries]);

  // primeiro clique pede confirmacao, segundo clique executa
  const handleResetClick = () => {
    if (resetting || loadingSlow) return;
    if (confirmReset) {
      resetSlowQueries();
    } else {
      setConfirmReset(true);
    }
  };

  // confirm state expira em 3s se o usuario nao clicar de novo
  useEffect(() => {
    if (!confirmReset) return;
    const t = window.setTimeout(() => setConfirmReset(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmReset]);

  // fecha modal com ESC e limpa confirmacao ao fechar
  useEffect(() => {
    if (!showMonitoring) {
      setConfirmReset(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // se o popup de detalhes estiver aberto, fecha ele primeiro
      // (sem fechar o modal de monitoramento por tras)
      if (selectedSlowQuery) {
        setSelectedSlowQuery(null);
      } else {
        setShowMonitoring(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showMonitoring, selectedSlowQuery]);

  // sempre que trocar/fechar a query selecionada, zera o estado da otimizacao
  useEffect(() => {
    setOptimizeReply(null);
    setOptimizedSql(null);
    setOptimizeError(null);
    setOptimizing(false);
    setCopiedOptimized(false);
    // zera tambem a confirmacao de exclusao
    setConfirmDeleteQuery(false);
    setDeleteQueryError(null);
  }, [selectedSlowQuery]);

  // reseta confirmacao de exclusao da query apos 3s sem clicar de novo
  useEffect(() => {
    if (!confirmDeleteQuery) return;
    const t = window.setTimeout(() => setConfirmDeleteQuery(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmDeleteQuery]);

  // ── Exclui UMA unica query do historico ──
  const deleteSelectedQuery = useCallback(async () => {
    const q = selectedSlowQuery;
    if (!q || deletingQuery) return;

    // primeira vez pede confirmacao
    if (!confirmDeleteQuery) {
      setConfirmDeleteQuery(true);
      setDeleteQueryError(null);
      return;
    }

    setDeletingQuery(true);
    setDeleteQueryError(null);
    try {
      const res = await fetch(`${BACKEND}/queries/stats/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.query }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Erro ao excluir a query.");
      }

      // remove a query da lista local de imediato
      setSlowQueries((prev) => prev.filter((it) => it.query !== q.query));
      // fecha o popup de detalhes
      setSelectedSlowQuery(null);
      setConfirmDeleteQuery(false);

      // revalida com o backend
      fetchSlowQueries();
    } catch (err: any) {
      setDeleteQueryError(err?.message ?? "Erro ao excluir a query.");
    } finally {
      setDeletingQuery(false);
    }
  }, [selectedSlowQuery, deletingQuery, confirmDeleteQuery]);

  // ── Chama a IA pra otimizar a query selecionada ──
  const optimizeSelectedQuery = useCallback(async () => {
    const q = selectedSlowQuery;
    if (!q || optimizing) return;

    setOptimizing(true);
    setOptimizeError(null);
    setOptimizeReply(null);
    setOptimizedSql(null);

    try {
      const res = await fetch(`${BACKEND}/ai/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q.query,
          meanExecMs: q.mean_exec_time,
          totalExecMs: q.total_exec_time,
          calls: q.calls,
          tables: tables.map((t) => ({
            name: t.name,
            columns: t.columns.map((c) => ({ name: c.name, type: c.type })),
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Erro ao otimizar a query.");
      }
      setOptimizeReply(data?.reply ?? "");
      setOptimizedSql(data?.optimizedSql ?? null);
    } catch (err: any) {
      setOptimizeError(err?.message ?? "Erro ao otimizar a query.");
    } finally {
      setOptimizing(false);
    }
  }, [selectedSlowQuery, optimizing, tables]);

  // ── Tab no textarea insere espaços, Ctrl+Enter executa ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = sql.substring(0, start) + "  " + sql.substring(end);
      setSql(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2; });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runQuery();
    }
  };

  // ── Carrega o sql.js via CDN ──
  const loadSqlJs = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).SQL) { resolve((window as any).SQL); return; }
      const CDN = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3";
      if (!document.getElementById("sqljs-script")) {
        const script = document.createElement("script");
        script.id = "sqljs-script";
        script.src = `${CDN}/sql-wasm.js`;
        script.async = true;
        document.head.appendChild(script);
        script.onload = () => {
          (window as any).initSqlJs({ locateFile: () => `${CDN}/sql-wasm.wasm` })
            .then((SQL: any) => { (window as any).SQL = SQL; resolve(SQL); })
            .catch(reject);
        };
        script.onerror = () => reject(new Error("Falha ao carregar sql.js"));
      } else {
        const wait = setInterval(() => {
          if ((window as any).initSqlJs) {
            clearInterval(wait);
            (window as any).initSqlJs({ locateFile: () => `${CDN}/sql-wasm.wasm` })
              .then((SQL: any) => { (window as any).SQL = SQL; resolve(SQL); })
              .catch(reject);
          }
        }, 100);
      }
    });
  }, []);

  // ── Processa arquivo SQLite e importa pro Postgres ──
  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["db", "sqlite", "sqlite3", "sql"].includes(ext ?? "")) {
      setDbError("Formato inválido. Use .db, .sqlite, .sqlite3 ou .sql");
      return;
    }
    setLoadingDb(true);
    setLoadingStep("Lendo o arquivo…");
    setDbError(null);
    setTables([]);
    setOpenTables(new Set());
    setQueryResult(null);
    setQueryError(null);
    setSchemaName(null);

    try {
      const SQL = await loadSqlJs();
      const buffer = await file.arrayBuffer();
      const db = new SQL.Database(new Uint8Array(buffer));

      // 1) descobre as tabelas
      const tablesResult = db.exec(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
      );
      if (!tablesResult.length || !tablesResult[0].values.length) {
        setDbError("Nenhuma tabela encontrada no banco de dados.");
        db.close();
        return;
      }
      const tableNames = tablesResult[0].values.map((r: any[]) => r[0] as string);

      // 2) para cada tabela, extrai colunas + todas as linhas
      setLoadingStep("Extraindo dados…");
      const extracted: TableInfo[] = [];
      const payloadTables: Array<{
        name: string;
        columns: { name: string; type: string }[];
        values: any[][];
      }> = [];

      for (const originalName of tableNames) {
        const colResult = db.exec(`PRAGMA table_info("${originalName}")`);
        const rawColumns =
          colResult.length && colResult[0].values.length
            ? colResult[0].values.map((r: any[]) => ({
                name: r[1] as string,
                type: (r[2] as string) || "TEXT",
              }))
            : [];

        // sanitiza nomes pro Postgres (e guarda os "originais" pra exibicao)
        const safeTableName = sanitizeIdent(originalName);
        const safeColumns = rawColumns.map((c) => ({
          name: sanitizeIdent(c.name),
          type: c.type,
        }));

        // extrai todas as linhas da tabela
        const rowsResult = db.exec(`SELECT * FROM "${originalName}"`);
        const values: any[][] =
          rowsResult.length && rowsResult[0].values.length
            ? rowsResult[0].values.map((row: any[]) =>
                row.map((v) => serializeValue(v))
              )
            : [];

        extracted.push({ name: safeTableName, columns: safeColumns });
        payloadTables.push({
          name: safeTableName,
          columns: safeColumns,
          values,
        });
      }
      db.close();

      // 3) manda tudo pro backend importar no Postgres
      setLoadingStep("Importando no PostgreSQL…");
      const sName = newSchemaName();
      const resp = await fetch(`${BACKEND}/queries/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemaName: sName, tables: payloadTables }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(
          data?.error ??
            `Falha ao importar no PostgreSQL (HTTP ${resp.status}).`
        );
      }

      setTables(extracted);
      setSchemaName(sName);
      setDbName(file.name);
      if (extracted.length > 0) setOpenTables(new Set([extracted[0].name]));
    } catch (err: any) {
      console.error(err);
      setDbError(
        err?.message?.includes("Failed to fetch")
          ? "Não foi possível conectar ao backend na porta 3002."
          : err?.message ??
              "Erro ao ler o arquivo. Certifique-se de que é um banco SQLite válido."
      );
    } finally {
      setLoadingDb(false);
      setLoadingStep("");
    }
  }, [loadSqlJs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const toggleTable = (name: string) => {
    setOpenTables((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // ── Executa a query via backend (registrada no pg_stat_statements) ──
  const runQuery = useCallback(async () => {
    const query = sql.trim();
    if (!query || running) return;
    setRunning(true);
    setQueryResult(null);
    setQueryError(null);
    try {
      const res = await fetch(`${BACKEND}/queries/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: query, schemaName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQueryError(data as QueryError);
      } else {
        setQueryResult(data as QueryResult);
      }
    } catch {
      setQueryError({
        error: "Não foi possível conectar ao backend. Verifique se ele está rodando na porta 3002.",
        execTimeMs: 0,
      });
    } finally {
      setRunning(false);
    }
  }, [sql, running, schemaName]);

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <main className="h-screen bg-[#04040a] text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* Input oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".db,.sqlite,.sqlite3,.sql"
        className="hidden"
      />

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-4 bg-[#0a0c20]/60 border-b border-blue-500/20 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <Database className="text-blue-400" size={20} />
          <h1 className="text-xl font-black uppercase tracking-tight">
            Query <span className="text-blue-500">Sniffer</span>
          </h1>
        </div>
        <a
          href="/login"
          className="text-red-500 font-bold flex items-center gap-2 text-sm hover:text-red-400 transition-colors"
        >
          Sair <LogOut size={14} />
        </a>
      </nav>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ════════════════════════════
            SIDEBAR
        ════════════════════════════ */}
        <aside className="w-72 shrink-0 flex flex-col border-r border-blue-500/15 bg-[#07081a]/80 overflow-hidden">
          <div className="px-4 pt-5 pb-3 border-b border-white/5">
            <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest mb-3">
              Banco de Dados
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              disabled={loadingDb}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed
                text-xs font-bold uppercase tracking-wider transition-all cursor-pointer
                ${isDragging
                  ? "border-blue-400 bg-blue-500/10 text-blue-300"
                  : "border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-500/5 text-slate-400 hover:text-blue-300"}
                ${loadingDb ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Upload size={14} />
              {loadingDb ? "Carregando..." : dbName ? "Trocar Base" : "Iniciar Análise"}
            </button>

            {dbName && !loadingDb && (
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Database size={12} className="text-blue-400 shrink-0" />
                  <span className="text-[11px] text-blue-300 font-mono truncate">
                    {dbName}
                  </span>
                </div>
                {schemaName && (
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20"
                    title="Schema criado no PostgreSQL para esta sessão"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                    <span className="text-[10px] text-green-300 font-mono truncate">
                      pg: {schemaName}
                    </span>
                  </div>
                )}
              </div>
            )}
            {dbError && (
              <p className="mt-2 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5">
                {dbError}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {loadingDb && (
              <div className="flex flex-col items-center justify-center h-32 gap-3">
                <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
                <p className="text-xs text-slate-500">
                  {loadingStep || "Lendo banco de dados…"}
                </p>
              </div>
            )}
            {!loadingDb && tables.length === 0 && !dbError && (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
                <Columns size={28} className="text-slate-700" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Carregue um arquivo <span className="text-slate-500 font-mono">.db</span> ou{" "}
                  <span className="text-slate-500 font-mono">.sqlite</span> para ver as tabelas aqui
                </p>
              </div>
            )}
            {!loadingDb && tables.map((table) => (
              <TableItem
                key={table.name}
                table={table}
                isOpen={openTables.has(table.name)}
                onToggle={() => toggleTable(table.name)}
              />
            ))}
          </div>

          {tables.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-slate-500 font-mono">
                {tables.length} tabela{tables.length !== 1 ? "s" : ""} •{" "}
                {tables.reduce((acc, t) => acc + t.columns.length, 0)} colunas
              </span>
            </div>
          )}
        </aside>

        {/* ════════════════════════════
            ÁREA PRINCIPAL
        ════════════════════════════ */}
        <section className="flex-1 flex flex-col overflow-hidden">

          {/* Estado vazio — sem DB carregado */}
          {!dbName && !loadingDb && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-5 w-full max-w-md
                  border-2 border-dashed rounded-3xl p-14 transition-all
                  ${isDragging ? "border-blue-400 bg-blue-500/5" : "border-blue-500/20 hover:border-blue-500/40"}`}
              >
                <div className="p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Database size={36} className="text-blue-400" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-black uppercase tracking-tight mb-2">Query Sniffer</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Carregue um banco de dados SQLite para começar a escrever e executar queries.
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl
                    text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-900/30"
                >
                  <Upload size={14} />
                  Iniciar Análise
                </button>
                <p className="text-[11px] text-slate-600">ou arraste e solte o arquivo aqui</p>
              </div>
            </div>
          )}

          {/* Editor + Resultado — com DB carregado */}
          {dbName && (
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* ── Editor SQL ── */}
              <div className="shrink-0 flex flex-col border-b border-blue-500/15">

                {/* Barra superior do editor */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0c20]/40 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Editor SQL
                    </span>
                    <span className="text-[10px] text-slate-700 ml-2 hidden sm:block">
                      Ctrl+Enter para executar
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openMonitoring}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
                        text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent
                        hover:border-blue-500/30 transition-all cursor-pointer"
                      title="Ver tempo de execução das queries (pg_stat_statements)"
                    >
                      <Activity size={12} />
                      Monitoramento
                    </button>
                    <button
                      onClick={() => { setSql(""); setQueryResult(null); setQueryError(null); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
                        text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Limpar
                    </button>
                    <button
                      onClick={runQuery}
                      disabled={running || !sql.trim()}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-black
                        uppercase tracking-wider transition-all
                        ${running || !sql.trim()
                          ? "bg-blue-600/30 text-blue-400/40 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md shadow-blue-900/30"
                        }`}
                    >
                      {running ? (
                        <div className="w-3 h-3 border-2 border-blue-300/40 border-t-blue-300 rounded-full animate-spin" />
                      ) : (
                        <Play size={12} fill="currentColor" />
                      )}
                      {running ? "Executando..." : "Executar"}
                    </button>
                  </div>
                </div>

                {/* Textarea do editor */}
                <textarea
                  ref={textareaRef}
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={"SELECT * FROM sua_tabela LIMIT 100;"}
                  spellCheck={false}
                  rows={7}
                  className="w-full bg-[#04040a] text-slate-200 font-mono text-sm px-5 py-4
                    resize-none outline-none placeholder:text-slate-700 border-0 leading-relaxed"
                  style={{ caretColor: "#60a5fa" }}
                />
              </div>

              {/* ── Painel de resultado ── */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#06070f]">

                {/* Placeholder */}
                {!queryResult && !queryError && !running && (
                  <div className="flex-1 flex items-center justify-center gap-3 text-slate-700">
                    <Play size={18} />
                    <span className="text-sm">Execute uma query para ver os resultados aqui</span>
                  </div>
                )}

                {/* Loading */}
                {running && (
                  <div className="flex-1 flex items-center justify-center gap-3 text-slate-500">
                    <div className="w-5 h-5 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
                    <span className="text-sm">Executando no banco…</span>
                  </div>
                )}

                {/* Erro */}
                {queryError && !running && (
                  <div className="flex-1 flex flex-col overflow-auto p-5">
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
                      <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-red-400">
                            Erro na execução
                          </span>
                          {queryError.execTimeMs > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-600">
                              <Clock size={10} /> {queryError.execTimeMs}ms
                            </span>
                          )}
                        </div>
                        <pre className="text-sm text-red-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                          {queryError.error}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sucesso */}
                {queryResult && !running && (
                  <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Status bar */}
                    <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 bg-[#0a0c20]/30 shrink-0">
                      <div className="flex items-center gap-1.5 text-green-400">
                        <CheckCircle2 size={13} />
                        <span className="text-[11px] font-black uppercase tracking-wider">Sucesso</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Rows size={12} />
                        <span>
                          {queryResult.rowCount !== null
                            ? `${queryResult.rowCount} linha${queryResult.rowCount !== 1 ? "s" : ""}`
                            : `${queryResult.rows.length} linha${queryResult.rows.length !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Clock size={12} />
                        <span>{queryResult.execTimeMs}ms</span>
                      </div>
                      {(() => {
                        const sev = getSeverity(queryResult.execTimeMs);
                        if (sev === "ok") return null;
                        const style = severityStyles[sev];
                        return (
                          <div
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${style.bgColor} ${style.borderColor}`}
                            title={
                              sev === "crit"
                                ? `Query crítica — acima de ${SLOW_CRIT_MS}ms`
                                : `Query lenta — acima de ${SLOW_WARN_MS}ms`
                            }
                          >
                            {sev === "crit" ? (
                              <Flame size={11} className={style.textColor} />
                            ) : (
                              <AlertTriangle size={11} className={style.textColor} />
                            )}
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider ${style.textColor}`}
                            >
                              {style.label}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Tabela de resultados */}
                    {queryResult.rows.length > 0 ? (
                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-[#0d0f28] border-b border-blue-500/20">
                              <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest
                                text-slate-600 border-r border-white/5 w-10 select-none">
                                #
                              </th>
                              {queryResult.fields.map((f) => (
                                <th
                                  key={f.name}
                                  className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest
                                    text-blue-400/70 border-r border-white/5 last:border-r-0 whitespace-nowrap"
                                >
                                  {f.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.rows.map((row, i) => (
                              <tr
                                key={i}
                                className={`border-b border-white/[0.03] transition-colors hover:bg-blue-500/5
                                  ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"}`}
                              >
                                <td className="px-3 py-2 text-[11px] text-slate-700 font-mono border-r border-white/5 select-none">
                                  {i + 1}
                                </td>
                                {queryResult.fields.map((f) => {
                                  const val = row[f.name];
                                  return (
                                    <td
                                      key={f.name}
                                      title={val === null ? "NULL" : String(val)}
                                      className="px-4 py-2 font-mono text-xs text-slate-300 border-r border-white/5
                                        last:border-r-0 max-w-xs truncate"
                                    >
                                      {val === null ? (
                                        <span className="text-slate-600 italic">NULL</span>
                                      ) : typeof val === "boolean" ? (
                                        <span className={val ? "text-green-400" : "text-red-400"}>
                                          {String(val)}
                                        </span>
                                      ) : (
                                        String(val)
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-3 text-slate-600">
                        <CheckCircle2 size={18} className="text-green-500/50" />
                        <span className="text-sm">
                          Query executada com sucesso — nenhuma linha retornada.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ════════════════════════════
            CHAT QuerySniffer.IA
        ════════════════════════════ */}
        <aside className="w-96 shrink-0 flex flex-col border-l border-blue-500/15 bg-[#07081a]/80 overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#0a0c20]/40">
            <div className="flex items-center gap-2.5">
              <div className="relative p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <Sparkles size={14} className="text-blue-400" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              </div>
              <div className="leading-tight">
                <h2 className="text-xs font-black uppercase tracking-wider">
                  QuerySniffer<span className="text-blue-500">.IA</span>
                </h2>
                <p className="text-[9px] text-slate-500 font-mono tracking-wide">
                  gere queries em linguagem natural
                </p>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold
                  text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
                title="Limpar conversa"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>

          {/* Lista de mensagens */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
          >
            {messages.length === 0 && !chatThinking && (
              <div className="flex flex-col h-full px-1">
                {tables.length === 0 ? (
                  /* ── Sem banco carregado: mensagem de boas-vindas ── */
                  <div className="flex flex-col items-center justify-center flex-1 text-center gap-3 text-slate-500 px-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                      <Sparkles size={22} className="text-blue-400/60" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-200 mb-1">
                        Olá! Eu sou o <span className="text-blue-400">QuerySniffer.IA</span>
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-[260px] mx-auto">
                        Seu assistente de banco de dados. Posso te ajudar a{" "}
                        <span className="text-slate-300">escrever queries</span>,{" "}
                        <span className="text-slate-300">otimizar consultas</span> e{" "}
                        <span className="text-slate-300">tirar dúvidas sobre SQL</span>.
                      </p>
                    </div>
                    <div className="mt-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 max-w-[260px]">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        <span className="text-blue-400 font-bold">Dica:</span> carregue um banco de dados
                        no painel à esquerda e eu vou sugerir consultas específicas pra ele.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ── Com banco carregado: sugestoes dinamicas da IA ── */
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-start gap-2 px-1">
                      <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0">
                        <Sparkles size={12} className="text-blue-400" />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Analisei as{" "}
                        <span className="text-blue-400 font-bold">
                          {tables.length} {tables.length === 1 ? "tabela" : "tabelas"}
                        </span>{" "}
                        carregadas. Aqui vão algumas consultas que você pode me pedir:
                      </p>
                    </div>

                    {loadingSuggestions && (
                      <div className="space-y-1.5 px-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-9 rounded-lg bg-white/[0.03] border border-white/5 animate-pulse"
                            style={{ animationDelay: `${i * 100}ms` }}
                          />
                        ))}
                        <p className="text-[9px] text-slate-700 font-mono uppercase tracking-widest text-center pt-1">
                          gerando sugestões…
                        </p>
                      </div>
                    )}

                    {!loadingSuggestions && suggestions.length > 0 && (
                      <div className="space-y-1.5 px-1">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => sendChatMessage(s)}
                            disabled={chatThinking}
                            className="group w-full text-left px-3 py-2 rounded-lg text-[11px] text-slate-300
                              bg-white/[0.02] hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/40
                              transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                              flex items-start gap-2"
                          >
                            <ArrowRight
                              size={11}
                              className="text-blue-400/40 group-hover:text-blue-400 mt-0.5 shrink-0 transition-colors"
                            />
                            <span className="leading-relaxed">{s}</span>
                          </button>
                        ))}
                        <p className="text-[9px] text-slate-700 font-mono uppercase tracking-widest text-center pt-1">
                          clique pra enviar · ou digite a sua
                        </p>
                      </div>
                    )}

                    {!loadingSuggestions && suggestions.length === 0 && (
                      <div className="mx-1 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Não consegui gerar sugestões agora. Descreva no campo abaixo o que você
                          quer consultar.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} onUseSql={useSqlFromChat} />
            ))}

            {chatThinking && (
              <div className="flex items-center gap-2 pl-9">
                <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-tl-sm bg-white/5 border border-white/5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5 bg-[#0a0c20]/30">
            <div className="flex gap-2 items-end">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                rows={2}
                placeholder="Descreva o que quer consultar…"
                className="flex-1 bg-[#04040a] text-slate-200 text-xs px-3 py-2 min-h-[40px] max-h-32
                  resize-none outline-none placeholder:text-slate-700 border border-blue-500/20 rounded-lg
                  focus:border-blue-500/50 transition-colors leading-relaxed"
              />
              <button
                onClick={() => sendChatMessage()}
                disabled={!chatInput.trim() || chatThinking}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all shrink-0
                  ${!chatInput.trim() || chatThinking
                    ? "bg-blue-600/30 text-blue-400/40 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md shadow-blue-900/30"
                  }`}
                title="Enviar (Enter)"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="mt-1.5 text-[9px] text-slate-700 px-1 font-mono tracking-wide">
              Enter envia · Shift+Enter quebra linha
            </p>
          </div>
        </aside>
      </div>

      {/* ════════════════════════════
          MODAL MONITORAMENTO
      ════════════════════════════ */}
      {showMonitoring && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowMonitoring(false)}
        >
          <div
            className="bg-[#0a0c20] border border-blue-500/25 rounded-3xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-blue-950/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-500/15 bg-[#07081a]/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <TrendingUp size={18} className="text-blue-400" />
                </div>
                <div className="leading-tight">
                  <h2 className="text-base font-black uppercase tracking-tight">
                    Monitoramento de Queries
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    queries do editor sql · todas ordenadas por tempo médio (clique numa linha pra ver completa)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSlowQueries}
                  disabled={loadingSlow || resetting}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all
                    ${loadingSlow || resetting
                      ? "bg-blue-600/30 text-blue-400/40 cursor-not-allowed"
                      : "bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 cursor-pointer"
                    }`}
                  title="Atualizar"
                >
                  <RefreshCw size={12} className={loadingSlow ? "animate-spin" : ""} />
                  Atualizar
                </button>

                <button
                  onClick={handleResetClick}
                  disabled={loadingSlow || resetting || slowQueries.length === 0}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border
                    ${resetting || loadingSlow || slowQueries.length === 0
                      ? "bg-red-600/10 text-red-400/30 border-red-500/10 cursor-not-allowed"
                      : confirmReset
                        ? "bg-red-600 hover:bg-red-500 text-white border-red-500 cursor-pointer shadow-md shadow-red-900/30 animate-pulse"
                        : "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30 cursor-pointer"
                    }`}
                  title={
                    confirmReset
                      ? "Clique de novo para confirmar (zera as estatísticas)"
                      : "Zera as estatísticas acumuladas no pg_stat_statements"
                  }
                >
                  {resetting ? (
                    <div className="w-3 h-3 border-2 border-red-300/40 border-t-red-300 rounded-full animate-spin" />
                  ) : (
                    <Eraser size={12} />
                  )}
                  {resetting
                    ? "Limpando…"
                    : confirmReset
                      ? "Confirmar?"
                      : "Limpar lista"}
                </button>

                <button
                  onClick={() => setShowMonitoring(false)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
                  title="Fechar (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Legenda de severidade */}
            <div className="flex items-center gap-4 px-6 py-3 border-b border-white/5 bg-[#04040a]/40">
              <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
                Legenda
              </span>
              {(["ok", "warn", "crit"] as Severity[]).map((s) => {
                const st = severityStyles[s];
                const range =
                  s === "ok"
                    ? `< ${SLOW_WARN_MS}ms`
                    : s === "warn"
                      ? `${SLOW_WARN_MS}–${SLOW_CRIT_MS}ms`
                      : `≥ ${SLOW_CRIT_MS}ms`;
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />
                    <span className={`text-[10px] font-bold ${st.textColor}`}>
                      {st.label}
                    </span>
                    <span className="text-[9px] text-slate-700 font-mono">{range}</span>
                  </div>
                );
              })}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto">
              {loadingSlow && slowQueries.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
                  <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
                  <p className="text-xs">Buscando estatísticas…</p>
                </div>
              )}

              {slowError && !loadingSlow && (
                <div className="mx-6 my-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-red-400 mb-1">
                      Erro ao buscar estatísticas
                    </p>
                    <p className="text-sm text-red-300 font-mono">{slowError}</p>
                  </div>
                </div>
              )}

              {!loadingSlow && !slowError && slowQueries.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-600">
                  <Gauge size={28} className="text-slate-700" />
                  <p className="text-sm">Nenhuma query registrada ainda.</p>
                  <p className="text-[11px] text-slate-700">
                    Execute alguma query no editor que ela aparece aqui.
                  </p>
                </div>
              )}

              {slowQueries.length > 0 && (
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#0d0f28]">
                    <tr className="border-b border-blue-500/20">
                      <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 w-10">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-blue-400/70">
                        Query
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-blue-400/70 whitespace-nowrap">
                        Execuções
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-blue-400/70 whitespace-nowrap">
                        Tempo total
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-blue-400/70 whitespace-nowrap">
                        Tempo médio
                      </th>
                      <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-blue-400/70">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowQueries.map((q, i) => {
                      const sev = getSeverity(q.mean_exec_time);
                      const st = severityStyles[sev];
                      return (
                        <tr
                          key={i}
                          onClick={() => {
                            setSelectedSlowQuery(q);
                            setCopiedSlowQuery(false);
                          }}
                          title="Clique para ver a query completa"
                          className={`border-b border-white/[0.03] transition-colors cursor-pointer
                            ${sev === "crit"
                              ? "bg-red-500/[0.04] hover:bg-red-500/15"
                              : sev === "warn"
                                ? "bg-yellow-500/[0.03] hover:bg-yellow-500/15"
                                : "hover:bg-blue-500/10"
                            }`}
                        >
                          <td className="px-4 py-3 text-[11px] text-slate-600 font-mono select-none">
                            {i + 1}
                          </td>
                          <td
                            className="px-4 py-3 font-mono text-xs text-slate-300 max-w-[500px] truncate"
                            title={q.query}
                          >
                            {q.query}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-400 font-mono whitespace-nowrap">
                            {q.calls.toLocaleString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-400 font-mono whitespace-nowrap">
                            {q.total_exec_time.toFixed(2)} ms
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-xs font-mono font-bold whitespace-nowrap ${st.textColor}`}
                          >
                            {q.mean_exec_time.toFixed(2)} ms
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${st.bgColor} ${st.borderColor}`}
                            >
                              {sev === "crit" ? (
                                <Flame size={11} className={st.textColor} />
                              ) : sev === "warn" ? (
                                <AlertTriangle size={11} className={st.textColor} />
                              ) : (
                                <CheckCircle2 size={11} className={st.textColor} />
                              )}
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider ${st.textColor}`}
                              >
                                {st.label}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Rodapé do modal — resumo de contagens por severidade */}
            {slowQueries.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 bg-[#04040a]/40">
                <div className="flex items-center gap-4">
                  {(["crit", "warn", "ok"] as Severity[]).map((s) => {
                    const count = slowQueries.filter(
                      (q) => getSeverity(q.mean_exec_time) === s
                    ).length;
                    if (count === 0) return null;
                    const st = severityStyles[s];
                    return (
                      <div key={s} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />
                        <span className={`text-[11px] font-black ${st.textColor}`}>
                          {count}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">
                          {st.label.toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
                  <span className="text-[10px] text-slate-600 font-mono ml-2">
                    · {slowQueries.length} {slowQueries.length === 1 ? "query" : "queries"} no total
                  </span>
                </div>
                <span className="text-[10px] text-slate-700 font-mono">
                  ESC para fechar
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════
          POPUP DETALHES DA QUERY (aparece empilhado sobre o modal de monitoramento)
      ════════════════════════════ */}
      {selectedSlowQuery && (() => {
        const q = selectedSlowQuery;
        const sev = getSeverity(q.mean_exec_time);
        const st = severityStyles[sev];
        return (
          <div
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedSlowQuery(null)}
          >
            <div
              className="bg-[#0a0c20] border border-blue-500/25 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-blue-950/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-blue-500/15 bg-[#07081a]/60">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${st.bgColor} ${st.borderColor}`}>
                    {sev === "crit" ? (
                      <Flame size={14} className={st.textColor} />
                    ) : sev === "warn" ? (
                      <AlertTriangle size={14} className={st.textColor} />
                    ) : (
                      <CheckCircle2 size={14} className={st.textColor} />
                    )}
                  </div>
                  <div className="leading-tight">
                    <h3 className="text-sm font-black uppercase tracking-tight">
                      Detalhes da Query
                    </h3>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${st.textColor} mt-0.5`}>
                      {st.label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSlowQuery(null)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-white/5 bg-[#04040a]/40">
                <div className="bg-[#0a0c20] border border-blue-500/15 rounded-xl px-3 py-2">
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
                    Execuções
                  </p>
                  <p className="text-base font-black text-slate-200 font-mono mt-0.5">
                    {q.calls.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="bg-[#0a0c20] border border-blue-500/15 rounded-xl px-3 py-2">
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
                    Tempo total
                  </p>
                  <p className="text-base font-black text-slate-200 font-mono mt-0.5">
                    {q.total_exec_time.toFixed(2)} ms
                  </p>
                </div>
                <div className="bg-[#0a0c20] border border-blue-500/15 rounded-xl px-3 py-2">
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
                    Tempo médio
                  </p>
                  <p className={`text-base font-black font-mono mt-0.5 ${st.textColor}`}>
                    {q.mean_exec_time.toFixed(2)} ms
                  </p>
                </div>
              </div>

              {/* SQL completa */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    Query SQL
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard
                        .writeText(q.query)
                        .then(() => {
                          setCopiedSlowQuery(true);
                          window.setTimeout(() => setCopiedSlowQuery(false), 1800);
                        })
                        .catch(() => {});
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer
                      ${copiedSlowQuery
                        ? "bg-green-500/15 border-green-500/30 text-green-300"
                        : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300"
                      }`}
                    title="Copiar query"
                  >
                    {copiedSlowQuery ? (
                      <>
                        <CheckCircle2 size={11} /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={11} /> Copiar
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-[#04040a] border border-blue-500/15 rounded-xl p-4 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap break-words">
                  {q.query}
                </pre>

                {/* ── Bloco da otimizacao (aparece so quando o usuario clica em Otimizar) ── */}
                {(optimizing || optimizeReply || optimizeError) && (
                  <div className="mt-5 border-t border-blue-500/20 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={13} className="text-blue-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                        Versão otimizada pela IA
                      </p>
                    </div>

                    {optimizing && (
                      <div className="flex items-center gap-2 py-6 text-slate-400 text-xs">
                        <div className="w-4 h-4 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
                        Analisando e otimizando a query…
                      </div>
                    )}

                    {optimizeError && !optimizing && (
                      <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-lg">
                        <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-red-400 mb-0.5">
                            Erro
                          </p>
                          <p className="text-xs text-red-300 font-mono">{optimizeError}</p>
                        </div>
                      </div>
                    )}

                    {optimizeReply && !optimizing && (
                      <div className="space-y-3">
                        {/* Resposta completa da IA (markdown simples em pre) */}
                        <pre className="bg-[#04040a] border border-blue-500/15 rounded-xl p-4 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                          {optimizeReply}
                        </pre>

                        {/* Se a IA devolveu um SQL otimizado, mostra botoes de acao */}
                        {optimizedSql && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard
                                  .writeText(optimizedSql)
                                  .then(() => {
                                    setCopiedOptimized(true);
                                    window.setTimeout(
                                      () => setCopiedOptimized(false),
                                      1800
                                    );
                                  })
                                  .catch(() => {});
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer
                                ${copiedOptimized
                                  ? "bg-green-500/15 border-green-500/30 text-green-300"
                                  : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300"
                                }`}
                              title="Copiar query otimizada"
                            >
                              {copiedOptimized ? (
                                <>
                                  <CheckCircle2 size={11} /> Copiado
                                </>
                              ) : (
                                <>
                                  <Copy size={11} /> Copiar otimizada
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSql(optimizedSql);
                                setSelectedSlowQuery(null);
                                setShowMonitoring(false);
                                window.setTimeout(
                                  () => textareaRef.current?.focus(),
                                  50
                                );
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                                bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-all border border-blue-500"
                              title="Usa a versão otimizada no editor"
                            >
                              <ArrowRight size={11} /> Usar otimizada no editor
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Erro ao excluir a query (se houver) */}
              {deleteQueryError && (
                <div className="px-5 pb-2">
                  <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 font-mono">
                    {deleteQueryError}
                  </div>
                </div>
              )}

              {/* Rodapé */}
              <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-white/5 bg-[#04040a]/40">
                <span className="text-[10px] text-slate-700 font-mono hidden sm:inline">
                  {confirmDeleteQuery
                    ? "Clique de novo em Confirmar exclusão pra remover essa query"
                    : "Clique fora ou ESC para fechar"}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  {/* Otimizar — so liberado pra queries lentas (warn) ou criticas (crit) */}
                  {(() => {
                    const canOptimize = sev !== "ok";
                    return (
                      <button
                        onClick={canOptimize ? optimizeSelectedQuery : undefined}
                        disabled={!canOptimize || optimizing}
                        title={
                          !canOptimize
                            ? "Essa query já está rápida, não precisa otimizar"
                            : optimizing
                              ? "Otimizando…"
                              : "Pede pra IA gerar uma versão otimizada"
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border
                          ${!canOptimize
                            ? "bg-slate-800/40 text-slate-600 border-slate-700/40 cursor-not-allowed"
                            : optimizing
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30 cursor-wait"
                              : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 cursor-pointer shadow-md shadow-amber-900/20"
                          }`}
                      >
                        {optimizing ? (
                          <div className="w-3 h-3 border-2 border-amber-300/40 border-t-amber-300 rounded-full animate-spin" />
                        ) : (
                          <Sparkles size={11} />
                        )}
                        {optimizing ? "Otimizando…" : "Otimizar Query"}
                      </button>
                    );
                  })()}

                  {/* Excluir query — remove somente essa query do historico */}
                  <button
                    onClick={deleteSelectedQuery}
                    disabled={deletingQuery}
                    title={
                      deletingQuery
                        ? "Excluindo…"
                        : confirmDeleteQuery
                          ? "Clique de novo pra confirmar a exclusão"
                          : "Remove apenas essa query do histórico"
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border
                      ${deletingQuery
                        ? "bg-red-500/20 text-red-300 border-red-500/30 cursor-wait"
                        : confirmDeleteQuery
                          ? "bg-red-600 hover:bg-red-500 text-white border-red-500/60 cursor-pointer shadow-md shadow-red-900/30"
                          : "bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/40 cursor-pointer shadow-md shadow-red-900/20"
                      }`}
                  >
                    {deletingQuery ? (
                      <div className="w-3 h-3 border-2 border-red-300/40 border-t-red-300 rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={11} />
                    )}
                    {deletingQuery
                      ? "Excluindo…"
                      : confirmDeleteQuery
                        ? "Confirmar exclusão"
                        : "Excluir query"}
                  </button>

                  <button
                    onClick={() => {
                      // se a IA ja otimizou, prioriza a versao otimizada;
                      // caso contrario, joga a query original no editor.
                      const sqlToUse = optimizedSql ?? q.query;
                      setSql(sqlToUse);
                      setSelectedSlowQuery(null);
                      setShowMonitoring(false);
                      // foca no editor depois que o modal fecha
                      window.setTimeout(() => textareaRef.current?.focus(), 50);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider
                      bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-all shadow-md shadow-blue-900/30"
                    title={
                      optimizedSql
                        ? "Joga a versão otimizada pela IA no editor SQL"
                        : "Joga essa query no editor SQL"
                    }
                  >
                    <ArrowRight size={11} />{" "}
                    {optimizedSql ? "Usar otimizada no editor" : "Usar no editor"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
