"use client";

import { useState } from "react";
import {
  X,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Sparkles,
  ArrowRight,
  Trash2,
} from "lucide-react";
import type { QueryLenta } from "@/src/tipos/painel";
import { getSeveridade, estilosSeveridade } from "@/src/utilitarios/severidade";

// Popup empilhado sobre o ModalMonitoramento mostrando os detalhes de UMA query.
// Acoes: copiar, otimizar (IA), excluir do historico (com confirmacao), usar
// no editor (que prioriza versao otimizada se houver).
type Props = {
  query: QueryLenta;
  // estados da otimizacao
  otimizando: boolean;
  respostaOtimizacao: string | null;
  sqlOtimizado: string | null;
  erroOtimizacao: string | null;
  // estados da exclusao
  confirmandoExclusao: boolean;
  excluindo: boolean;
  erroExclusao: string | null;
  // callbacks
  aoFechar: () => void;
  aoOtimizar: () => void;
  aoExcluir: () => void;
  aoUsarNoEditor: (sql: string) => void;
};

export function ModalDetalhesQuery({
  query,
  otimizando,
  respostaOtimizacao,
  sqlOtimizado,
  erroOtimizacao,
  confirmandoExclusao,
  excluindo,
  erroExclusao,
  aoFechar,
  aoOtimizar,
  aoExcluir,
  aoUsarNoEditor,
}: Props) {
  const sev = getSeveridade(query.mean_exec_time);
  const st = estilosSeveridade[sev];
  const podeOtimizar = sev !== "ok";

  const [copiouOriginal, setCopiouOriginal] = useState(false);
  const [copiouOtimizada, setCopiouOtimizada] = useState(false);

  const copiarTexto = async (texto: string, definirFlag: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(texto);
      definirFlag(true);
      window.setTimeout(() => definirFlag(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={aoFechar}
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
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${st.textColor} mt-0.5`}
              >
                {st.label}
              </p>
            </div>
          </div>
          <button
            onClick={aoFechar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Metricas */}
        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-white/5 bg-[#04040a]/40">
          <div className="bg-[#0a0c20] border border-blue-500/15 rounded-xl px-3 py-2">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
              Execuções
            </p>
            <p className="text-base font-black text-slate-200 font-mono mt-0.5">
              {query.calls.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="bg-[#0a0c20] border border-blue-500/15 rounded-xl px-3 py-2">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
              Tempo total
            </p>
            <p className="text-base font-black text-slate-200 font-mono mt-0.5">
              {query.total_exec_time.toFixed(2)} ms
            </p>
          </div>
          <div className="bg-[#0a0c20] border border-blue-500/15 rounded-xl px-3 py-2">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
              Tempo médio
            </p>
            <p className={`text-base font-black font-mono mt-0.5 ${st.textColor}`}>
              {query.mean_exec_time.toFixed(2)} ms
            </p>
          </div>
        </div>

        {/* SQL completo */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Query SQL
            </p>
            <button
              onClick={() => copiarTexto(query.query, setCopiouOriginal)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer
                ${copiouOriginal
                  ? "bg-green-500/15 border-green-500/30 text-green-300"
                  : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300"
                }`}
              title="Copiar query"
            >
              {copiouOriginal ? (
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
            {query.query}
          </pre>

          {/* Bloco da otimizacao */}
          {(otimizando || respostaOtimizacao || erroOtimizacao) && (
            <div className="mt-5 border-t border-blue-500/20 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-blue-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                  Versão otimizada pela IA
                </p>
              </div>

              {otimizando && (
                <div className="flex items-center gap-2 py-6 text-slate-400 text-xs">
                  <div className="w-4 h-4 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
                  Analisando e otimizando a query…
                </div>
              )}

              {erroOtimizacao && !otimizando && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-lg">
                  <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-red-400 mb-0.5">
                      Erro
                    </p>
                    <p className="text-xs text-red-300 font-mono">{erroOtimizacao}</p>
                  </div>
                </div>
              )}

              {respostaOtimizacao && !otimizando && (
                <div className="space-y-3">
                  <pre className="bg-[#04040a] border border-blue-500/15 rounded-xl p-4 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                    {respostaOtimizacao}
                  </pre>

                  {sqlOtimizado && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => copiarTexto(sqlOtimizado, setCopiouOtimizada)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer
                          ${copiouOtimizada
                            ? "bg-green-500/15 border-green-500/30 text-green-300"
                            : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300"
                          }`}
                        title="Copiar query otimizada"
                      >
                        {copiouOtimizada ? (
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
                        onClick={() => aoUsarNoEditor(sqlOtimizado)}
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

        {/* Erro de exclusao */}
        {erroExclusao && (
          <div className="px-5 pb-2">
            <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 font-mono">
              {erroExclusao}
            </div>
          </div>
        )}

        {/* Rodape */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-white/5 bg-[#04040a]/40">
          <span className="text-[10px] text-slate-700 font-mono hidden sm:inline">
            {confirmandoExclusao
              ? "Clique de novo em Confirmar exclusão pra remover essa query"
              : "Clique fora ou ESC para fechar"}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {/* Otimizar — so liberado pra queries lentas (warn) ou criticas (crit) */}
            <button
              onClick={podeOtimizar ? aoOtimizar : undefined}
              disabled={!podeOtimizar || otimizando}
              title={
                !podeOtimizar
                  ? "Essa query já está rápida, não precisa otimizar"
                  : otimizando
                    ? "Otimizando…"
                    : "Pede pra IA gerar uma versão otimizada"
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border
                ${!podeOtimizar
                  ? "bg-slate-800/40 text-slate-600 border-slate-700/40 cursor-not-allowed"
                  : otimizando
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30 cursor-wait"
                    : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 cursor-pointer shadow-md shadow-amber-900/20"
                }`}
            >
              {otimizando ? (
                <div className="w-3 h-3 border-2 border-amber-300/40 border-t-amber-300 rounded-full animate-spin" />
              ) : (
                <Sparkles size={11} />
              )}
              {otimizando ? "Otimizando…" : "Otimizar Query"}
            </button>

            {/* Excluir query */}
            <button
              onClick={aoExcluir}
              disabled={excluindo}
              title={
                excluindo
                  ? "Excluindo…"
                  : confirmandoExclusao
                    ? "Clique de novo pra confirmar a exclusão"
                    : "Remove apenas essa query do histórico"
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border
                ${excluindo
                  ? "bg-red-500/20 text-red-300 border-red-500/30 cursor-wait"
                  : confirmandoExclusao
                    ? "bg-red-600 hover:bg-red-500 text-white border-red-500/60 cursor-pointer shadow-md shadow-red-900/30"
                    : "bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/40 cursor-pointer shadow-md shadow-red-900/20"
                }`}
            >
              {excluindo ? (
                <div className="w-3 h-3 border-2 border-red-300/40 border-t-red-300 rounded-full animate-spin" />
              ) : (
                <Trash2 size={11} />
              )}
              {excluindo
                ? "Excluindo…"
                : confirmandoExclusao
                  ? "Confirmar exclusão"
                  : "Excluir query"}
            </button>

            {/* Usar no editor — prioriza otimizada quando existir */}
            <button
              onClick={() => aoUsarNoEditor(sqlOtimizado ?? query.query)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider
                bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-all shadow-md shadow-blue-900/30"
              title={
                sqlOtimizado
                  ? "Joga a versão otimizada pela IA no editor SQL"
                  : "Joga essa query no editor SQL"
              }
            >
              <ArrowRight size={11} />{" "}
              {sqlOtimizado ? "Usar otimizada no editor" : "Usar no editor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
