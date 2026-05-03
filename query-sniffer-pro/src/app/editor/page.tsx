"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import AuthGuard from "@/src/componentes/auth/AuthGuard";
import type {
  ErroQuery,
  MensagemChat as TipoMensagemChat,
  QueryLenta,
  ResultadoQuery,
  TabelaInfo,
} from "@/src/tipos/painel";
import {
  novoNomeSchema,
  extrairBlocoSql,
} from "@/src/utilitarios/ajudantes";
import {
  buscarQueriesLentas,
  buscarSugestoesIA,
  conversarComIA,
  excluirQueryEstatistica,
  executarQuery,
  importarBanco,
  limparEstatisticas,
  otimizarQueryComIA,
} from "@/src/servicos/api";
import { lerSqliteParaPayload } from "@/src/servicos/leitorSqlite";

import { BarraSuperior } from "@/src/componentes/painel/BarraSuperior";
import { BarraLateral } from "@/src/componentes/painel/BarraLateral";
import { EstadoVazio } from "@/src/componentes/painel/EstadoVazio";
import { PainelEditor } from "@/src/componentes/painel/PainelEditor";
import { PainelResultados } from "@/src/componentes/painel/PainelResultados";
import { PainelChat } from "@/src/componentes/painel/chat/PainelChat";
import { ModalMonitoramento } from "@/src/componentes/painel/monitoramento/ModalMonitoramento";
import { ModalDetalhesQuery } from "@/src/componentes/painel/monitoramento/ModalDetalhesQuery";

// ──────────────────────────────────────────────
// Dashboard — orquestrador.
// Concentra TODO o estado e os efeitos da pagina e distribui dados +
// callbacks pros componentes presentational em src/componentes/painel/*.
// ──────────────────────────────────────────────
export default function Dashboard() {
  // ── estado do banco ──
  const [tabelas, setTabelas] = useState<TabelaInfo[]>([]);
  const [tabelasAbertas, setTabelasAbertas] = useState<Set<string>>(new Set());
  const [nomeBanco, setNomeBanco] = useState<string | null>(null);
  const [carregandoBanco, setCarregandoBanco] = useState(false);
  const [passoCarregamento, setPassoCarregamento] = useState<string>("");
  const [erroBanco, setErroBanco] = useState<string | null>(null);
  const [estaArrastando, setEstaArrastando] = useState(false);
  const [nomeSchema, setNomeSchema] = useState<string | null>(null);

  // ── estado do editor ──
  const [sql, setSql] = useState("");
  const [resultadoQuery, setResultadoQuery] = useState<ResultadoQuery | null>(
    null
  );
  const [erroQuery, setErroQuery] = useState<ErroQuery | null>(null);
  const [executando, setExecutando] = useState(false);

  // ── estado do chat ──
  const [mensagens, setMensagens] = useState<TipoMensagemChat[]>([]);
  const [textoInput, setTextoInput] = useState("");
  const [chatPensando, setChatPensando] = useState(false);
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false);
  const [chaveSugestoesAtual, setChaveSugestoesAtual] = useState<string | null>(
    null
  );

  // ── estado do monitoramento ──
  const [mostrarMonitoramento, setMostrarMonitoramento] = useState(false);
  const [queriesLentas, setQueriesLentas] = useState<QueryLenta[]>([]);
  const [carregandoLentas, setCarregandoLentas] = useState(false);
  const [erroLentas, setErroLentas] = useState<string | null>(null);
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const [querySelecionada, setQuerySelecionada] = useState<QueryLenta | null>(
    null
  );

  // ── estado da otimizacao ──
  const [otimizando, setOtimizando] = useState(false);
  const [respostaOtimizacao, setRespostaOtimizacao] = useState<string | null>(
    null
  );
  const [sqlOtimizado, setSqlOtimizado] = useState<string | null>(null);
  const [erroOtimizacao, setErroOtimizacao] = useState<string | null>(null);

  // ── estado da exclusao individual ──
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  // ── refs ──
  const refInputArquivo = useRef<HTMLInputElement>(null);
  const refTextareaEditor = useRef<HTMLTextAreaElement>(null);
  const refScrollChat = useRef<HTMLDivElement>(null);
  const refInputChat = useRef<HTMLTextAreaElement>(null);

  // ─────────────────────────────────────────────────────
  // EFEITOS
  // ─────────────────────────────────────────────────────

  // auto-scroll do chat sempre que chegarem mensagens novas
  useEffect(() => {
    const el = refScrollChat.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [mensagens, chatPensando]);

  // chave do cache das sugestoes (nome do schema + tabelas)
  const chaveSugestoes = nomeSchema
    ? `${nomeSchema}::${tabelas.map((t) => t.name).join(",")}`
    : "";

  // busca sugestoes da IA baseadas no schema atual
  useEffect(() => {
    if (tabelas.length === 0) {
      setSugestoes([]);
      setChaveSugestoesAtual(null);
      return;
    }
    if (chaveSugestoesAtual === chaveSugestoes) return;

    let cancelado = false;
    setCarregandoSugestoes(true);
    setSugestoes([]);

    (async () => {
      try {
        const limpas = await buscarSugestoesIA(tabelas);
        if (cancelado) return;

        if (limpas.length > 0) {
          setSugestoes(limpas);
          setChaveSugestoesAtual(chaveSugestoes);
        } else {
          // fallback local: sugestoes genericas baseadas nos nomes das tabelas
          const t0 = tabelas[0]?.name;
          const t1 = tabelas[1]?.name;
          const fallback = [
            `Liste os 10 primeiros registros de ${t0}`,
            `Quantos registros existem em ${t0}?`,
            t1
              ? `Mostre um join entre ${t0} e ${t1}`
              : `Mostre colunas e tipos de ${t0}`,
            `Quais são as tabelas com mais colunas neste banco?`,
          ].filter(Boolean) as string[];
          setSugestoes(fallback);
          setChaveSugestoesAtual(chaveSugestoes);
        }
      } catch {
        if (!cancelado) setSugestoes([]);
      } finally {
        if (!cancelado) setCarregandoSugestoes(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [tabelas, chaveSugestoes, chaveSugestoesAtual]);

  // confirmacao de reset expira em 3s sem clicar de novo
  useEffect(() => {
    if (!confirmandoLimpeza) return;
    const t = window.setTimeout(() => setConfirmandoLimpeza(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmandoLimpeza]);

  // fecha modal com ESC; se o popup de detalhes estiver aberto, fecha so ele
  useEffect(() => {
    if (!mostrarMonitoramento) {
      setConfirmandoLimpeza(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (querySelecionada) {
        setQuerySelecionada(null);
      } else {
        setMostrarMonitoramento(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mostrarMonitoramento, querySelecionada]);

  // sempre que trocar/fechar a query selecionada, zera otimizacao + delete
  useEffect(() => {
    setRespostaOtimizacao(null);
    setSqlOtimizado(null);
    setErroOtimizacao(null);
    setOtimizando(false);
    setConfirmandoExclusao(false);
    setErroExclusao(null);
  }, [querySelecionada]);

  // confirmacao de exclusao expira em 3s
  useEffect(() => {
    if (!confirmandoExclusao) return;
    const t = window.setTimeout(() => setConfirmandoExclusao(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmandoExclusao]);

  // ─────────────────────────────────────────────────────
  // HANDLERS — Editor SQL
  // ─────────────────────────────────────────────────────

  const rodarQuery = useCallback(async () => {
    const query = sql.trim();
    if (!query || executando) return;
    setExecutando(true);
    setResultadoQuery(null);
    setErroQuery(null);
    try {
      const data = await executarQuery(query, nomeSchema);
      if ("error" in data) {
        setErroQuery(data);
      } else {
        setResultadoQuery(data);
      }
    } catch {
      setErroQuery({
        error:
          "Não foi possível conectar ao backend. Verifique se ele está rodando na porta 3002.",
        execTimeMs: 0,
      });
    } finally {
      setExecutando(false);
    }
  }, [sql, executando, nomeSchema]);

  // Tab insere espacos, Ctrl+Enter executa
  const aoApertarTeclaEditor = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = sql.substring(0, start) + "  " + sql.substring(end);
      setSql(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      rodarQuery();
    }
  };

  const limparEditor = () => {
    setSql("");
    setResultadoQuery(null);
    setErroQuery(null);
  };

  // ─────────────────────────────────────────────────────
  // HANDLERS — Chat
  // ─────────────────────────────────────────────────────

  // envia mensagem do chat (texto opcional pra usar com sugestoes clicaveis)
  const enviarMensagemChat = useCallback(
    async (substituir?: string) => {
      const text = (substituir ?? textoInput).trim();
      if (!text || chatPensando) return;

      const msgUsuario: TipoMensagemChat = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      setMensagens((prev) => [...prev, msgUsuario]);
      setTextoInput("");
      setChatPensando(true);

      try {
        const resposta = await conversarComIA(mensagens, text, tabelas);
        const blocoSql = extrairBlocoSql(resposta);

        const msgIA: TipoMensagemChat = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: resposta || "(sem resposta)",
          sql: blocoSql,
          timestamp: Date.now(),
        };
        setMensagens((prev) => [...prev, msgIA]);
      } catch (err: any) {
        const msgIA: TipoMensagemChat = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            "⚠️ Não consegui falar com a IA: " +
            (err?.message ?? "erro desconhecido") +
            ". Verifique se o backend está rodando e se a GEMINI_API_KEY está configurada.",
          timestamp: Date.now(),
        };
        setMensagens((prev) => [...prev, msgIA]);
      } finally {
        setChatPensando(false);
      }
    },
    [textoInput, chatPensando, mensagens, tabelas]
  );

  const aoApertarTeclaChat = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagemChat();
    }
  };

  // pega um SQL gerado pela IA (mensagem do chat) e joga no editor
  const usarSqlDoChat = (sqlText: string) => {
    setSql(sqlText);
    requestAnimationFrame(() => {
      refTextareaEditor.current?.focus();
      refTextareaEditor.current?.setSelectionRange(sqlText.length, sqlText.length);
    });
  };

  const limparChat = () => {
    setMensagens([]);
    setTextoInput("");
    refInputChat.current?.focus();
  };

  // ─────────────────────────────────────────────────────
  // HANDLERS — Monitoramento
  // ─────────────────────────────────────────────────────

  const buscarLentas = useCallback(async () => {
    setCarregandoLentas(true);
    setErroLentas(null);
    try {
      const lista = await buscarQueriesLentas();
      setQueriesLentas(lista);
    } catch (err: any) {
      setErroLentas(
        err?.message?.includes("Failed to fetch")
          ? "Não foi possível conectar ao backend na porta 3002."
          : err?.message ?? "Erro ao buscar queries."
      );
    } finally {
      setCarregandoLentas(false);
    }
  }, []);

  const abrirMonitoramento = () => {
    setMostrarMonitoramento(true);
    setConfirmandoLimpeza(false);
    buscarLentas();
  };

  const limparTudo = useCallback(async () => {
    setLimpando(true);
    setErroLentas(null);
    try {
      await limparEstatisticas();
      setQueriesLentas([]);
      await buscarLentas();
    } catch (err: any) {
      setErroLentas(
        err?.message?.includes("Failed to fetch")
          ? "Não foi possível conectar ao backend na porta 3002."
          : err?.message ?? "Erro ao limpar a lista."
      );
    } finally {
      setLimpando(false);
      setConfirmandoLimpeza(false);
    }
  }, [buscarLentas]);

  const aoClicarLimpar = () => {
    if (limpando || carregandoLentas) return;
    if (confirmandoLimpeza) {
      limparTudo();
    } else {
      setConfirmandoLimpeza(true);
    }
  };

  // ─────────────────────────────────────────────────────
  // HANDLERS — Detalhe da query (otimizar / excluir / usar)
  // ─────────────────────────────────────────────────────

  const otimizarSelecionada = useCallback(async () => {
    const q = querySelecionada;
    if (!q || otimizando) return;

    setOtimizando(true);
    setErroOtimizacao(null);
    setRespostaOtimizacao(null);
    setSqlOtimizado(null);

    try {
      const { reply, optimizedSql } = await otimizarQueryComIA(
        q.query,
        q.mean_exec_time,
        q.total_exec_time,
        q.calls,
        tabelas
      );
      setRespostaOtimizacao(reply);
      setSqlOtimizado(optimizedSql);
    } catch (err: any) {
      setErroOtimizacao(err?.message ?? "Erro ao otimizar a query.");
    } finally {
      setOtimizando(false);
    }
  }, [querySelecionada, otimizando, tabelas]);

  const excluirSelecionada = useCallback(async () => {
    const q = querySelecionada;
    if (!q || excluindo) return;

    // primeiro clique pede confirmacao
    if (!confirmandoExclusao) {
      setConfirmandoExclusao(true);
      setErroExclusao(null);
      return;
    }

    setExcluindo(true);
    setErroExclusao(null);
    try {
      await excluirQueryEstatistica(q.query);
      setQueriesLentas((prev) => prev.filter((it) => it.query !== q.query));
      setQuerySelecionada(null);
      setConfirmandoExclusao(false);
      buscarLentas();
    } catch (err: any) {
      setErroExclusao(err?.message ?? "Erro ao excluir a query.");
    } finally {
      setExcluindo(false);
    }
  }, [querySelecionada, excluindo, confirmandoExclusao, buscarLentas]);

  // usado tanto pelo botao "Usar no editor" quanto pra "Usar otimizada"
  const usarQueryNoEditor = (sqlText: string) => {
    setSql(sqlText);
    setQuerySelecionada(null);
    setMostrarMonitoramento(false);
    window.setTimeout(() => refTextareaEditor.current?.focus(), 50);
  };

  // ─────────────────────────────────────────────────────
  // HANDLERS — Importacao do banco SQLite
  // ─────────────────────────────────────────────────────

  const processarArquivo = useCallback(async (file: File) => {
    if (!file) return;

    // 1) reseta estado pra nova importacao
    setCarregandoBanco(true);
    setPassoCarregamento("Lendo o arquivo…");
    setErroBanco(null);
    setTabelas([]);
    setTabelasAbertas(new Set());
    setResultadoQuery(null);
    setErroQuery(null);
    setNomeSchema(null);

    try {
      // 2) leitura/transformacao SQLite -> payload (delegado pro servico)
      const { tabelas: extraidas, payloadTabelas } =
        await lerSqliteParaPayload(file, setPassoCarregamento);

      // 3) envia pro backend criar o schema no Postgres
      setPassoCarregamento("Importando no PostgreSQL…");
      const sName = novoNomeSchema();
      await importarBanco(sName, payloadTabelas);

      // 4) atualiza estado de sucesso
      setTabelas(extraidas);
      setNomeSchema(sName);
      setNomeBanco(file.name);
      if (extraidas.length > 0)
        setTabelasAbertas(new Set([extraidas[0].name]));
    } catch (err: any) {
      console.error(err);
      setErroBanco(
        err?.message?.includes("Failed to fetch")
          ? "Não foi possível conectar ao backend na porta 3002."
          : err?.message ??
            "Erro ao ler o arquivo. Certifique-se de que é um banco SQL válido."
      );
    } finally {
      setCarregandoBanco(false);
      setPassoCarregamento("");
    }
  }, []);

  const aoMudarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
    e.target.value = "";
  };

  const aoSoltar = (e: React.DragEvent) => {
    e.preventDefault();
    setEstaArrastando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processarArquivo(file);
  };

  const aoArrastarSobre = (e: React.DragEvent) => {
    e.preventDefault();
    setEstaArrastando(true);
  };

  const aoSairArrastando = () => setEstaArrastando(false);

  const escolherArquivo = () => refInputArquivo.current?.click();

  const alternarTabela = (name: string) => {
    setTabelasAbertas((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
  <AuthGuard>
    <main className="h-screen bg-[#04040a] text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* Input de arquivo (escondido) */}
      <input
        type="file"
        ref={refInputArquivo}
        onChange={aoMudarArquivo}
        accept=".db,.sqlite,.sqlite3,.sql"
        className="hidden"
      />

      <BarraSuperior />

      <div className="flex flex-1 overflow-hidden">
        <BarraLateral
          nomeBanco={nomeBanco}
          nomeSchema={nomeSchema}
          carregandoBanco={carregandoBanco}
          passoCarregamento={passoCarregamento}
          erroBanco={erroBanco}
          estaArrastando={estaArrastando}
          tabelas={tabelas}
          tabelasAbertas={tabelasAbertas}
          aoEscolherArquivo={escolherArquivo}
          aoArrastarSobre={aoArrastarSobre}
          aoSairArrastando={aoSairArrastando}
          aoSoltar={aoSoltar}
          aoAlternarTabela={alternarTabela}
        />

        {/* Area principal */}
        <section className="flex-1 flex flex-col overflow-hidden">
          {!nomeBanco && !carregandoBanco && (
            <EstadoVazio
              estaArrastando={estaArrastando}
              aoEscolherArquivo={escolherArquivo}
              aoArrastarSobre={aoArrastarSobre}
              aoSairArrastando={aoSairArrastando}
              aoSoltar={aoSoltar}
            />
          )}

          {nomeBanco && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <PainelEditor
                ref={refTextareaEditor}
                sql={sql}
                executando={executando}
                aoMudarSql={setSql}
                aoApertarTecla={aoApertarTeclaEditor}
                aoAbrirMonitoramento={abrirMonitoramento}
                aoLimpar={limparEditor}
                aoExecutar={rodarQuery}
              />
              <PainelResultados
                executando={executando}
                resultadoQuery={resultadoQuery}
                erroQuery={erroQuery}
              />
            </div>
          )}
        </section>

        <PainelChat
          ref={refScrollChat}
          refInput={refInputChat}
          mensagens={mensagens}
          chatPensando={chatPensando}
          textoInput={textoInput}
          aoMudarInput={setTextoInput}
          aoEnviar={() => enviarMensagemChat()}
          aoApertarTecla={aoApertarTeclaChat}
          aoLimparChat={limparChat}
          aoUsarSql={usarSqlDoChat}
          tabelas={tabelas}
          carregandoSugestoes={carregandoSugestoes}
          sugestoes={sugestoes}
          aoEscolherSugestao={(texto) => enviarMensagemChat(texto)}
        />
      </div>

      {/* Modais */}
      {mostrarMonitoramento && (
        <ModalMonitoramento
          queriesLentas={queriesLentas}
          carregandoLentas={carregandoLentas}
          erroLentas={erroLentas}
          limpando={limpando}
          confirmandoLimpeza={confirmandoLimpeza}
          aoFechar={() => setMostrarMonitoramento(false)}
          aoAtualizar={buscarLentas}
          aoClicarLimpar={aoClicarLimpar}
          aoSelecionarQuery={(q) => setQuerySelecionada(q)}
        />
      )}

      {querySelecionada && (
        <ModalDetalhesQuery
          query={querySelecionada}
          otimizando={otimizando}
          respostaOtimizacao={respostaOtimizacao}
          sqlOtimizado={sqlOtimizado}
          erroOtimizacao={erroOtimizacao}
          confirmandoExclusao={confirmandoExclusao}
          excluindo={excluindo}
          erroExclusao={erroExclusao}
          aoFechar={() => setQuerySelecionada(null)}
          aoOtimizar={otimizarSelecionada}
          aoExcluir={excluirSelecionada}
          aoUsarNoEditor={usarQueryNoEditor}
        />
      )}
    </main>
   </AuthGuard>
  );
}
