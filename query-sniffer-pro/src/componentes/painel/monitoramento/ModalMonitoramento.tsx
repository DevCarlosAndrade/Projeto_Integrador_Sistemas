"use client";

import {
  TrendingUp,
  RefreshCw,
  Eraser,
  X,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Gauge,
} from "lucide-react";
import type { Severidade, QueryLenta } from "@/src/tipos/painel";
import {
  getSeveridade,
  estilosSeveridade,
  SLOW_WARN_MS,
  SLOW_CRIT_MS,
} from "@/src/utilitarios/severidade";

// Modal grande de Monitoramento — tabela com TODAS as queries do editor.
// Linhas sao clicaveis: o pai abre o popup de detalhes (ModalDetalhesQuery).
type Props = {
  queriesLentas: QueryLenta[];
  carregandoLentas: boolean;
  erroLentas: string | null;
  limpando: boolean;
  confirmandoLimpeza: boolean;
  aoFechar: () => void;
  aoAtualizar: () => void;
  aoClicarLimpar: () => void;
  aoSelecionarQuery: (q: QueryLenta) => void;
};

export function ModalMonitoramento({
  queriesLentas,
  carregandoLentas,
  erroLentas,
  limpando,
  confirmandoLimpeza,
  aoFechar,
  aoAtualizar,
  aoClicarLimpar,
  aoSelecionarQuery,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={aoFechar}
    >
      <div
        className="bg-[#0a0c20] border border-blue-500/25 rounded-3xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-blue-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
              onClick={aoAtualizar}
              disabled={carregandoLentas || limpando}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all
                ${carregandoLentas || limpando
                  ? "bg-blue-600/30 text-blue-400/40 cursor-not-allowed"
                  : "bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 cursor-pointer"
                }`}
              title="Atualizar"
            >
              <RefreshCw size={12} className={carregandoLentas ? "animate-spin" : ""} />
              Atualizar
            </button>

            <button
              onClick={aoClicarLimpar}
              disabled={carregandoLentas || limpando || queriesLentas.length === 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border
                ${limpando || carregandoLentas || queriesLentas.length === 0
                  ? "bg-red-600/10 text-red-400/30 border-red-500/10 cursor-not-allowed"
                  : confirmandoLimpeza
                    ? "bg-red-600 hover:bg-red-500 text-white border-red-500 cursor-pointer shadow-md shadow-red-900/30 animate-pulse"
                    : "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30 cursor-pointer"
                }`}
              title={
                confirmandoLimpeza
                  ? "Clique de novo para confirmar (zera as estatísticas)"
                  : "Zera as estatísticas acumuladas"
              }
            >
              {limpando ? (
                <div className="w-3 h-3 border-2 border-red-300/40 border-t-red-300 rounded-full animate-spin" />
              ) : (
                <Eraser size={12} />
              )}
              {limpando
                ? "Limpando…"
                : confirmandoLimpeza
                  ? "Confirmar?"
                  : "Limpar lista"}
            </button>

            <button
              onClick={aoFechar}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
              title="Fechar (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-white/5 bg-[#04040a]/40">
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
            Legenda
          </span>
          {(["ok", "warn", "crit"] as Severidade[]).map((s) => {
            const st = estilosSeveridade[s];
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

        {/* Conteudo */}
        <div className="flex-1 overflow-y-auto">
          {carregandoLentas && queriesLentas.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
              <p className="text-xs">Buscando estatísticas…</p>
            </div>
          )}

          {erroLentas && !carregandoLentas && (
            <div className="mx-6 my-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-red-400 mb-1">
                  Erro ao buscar estatísticas
                </p>
                <p className="text-sm text-red-300 font-mono">{erroLentas}</p>
              </div>
            </div>
          )}

          {!carregandoLentas && !erroLentas && queriesLentas.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-600">
              <Gauge size={28} className="text-slate-700" />
              <p className="text-sm">Nenhuma query registrada ainda.</p>
              <p className="text-[11px] text-slate-700">
                Execute alguma query no editor que ela aparece aqui.
              </p>
            </div>
          )}

          {queriesLentas.length > 0 && (
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
                {queriesLentas.map((q, i) => {
                  const sev = getSeveridade(q.mean_exec_time);
                  const st = estilosSeveridade[sev];
                  return (
                    <tr
                      key={i}
                      onClick={() => aoSelecionarQuery(q)}
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

        {/* Rodape: contagens por severidade */}
        {queriesLentas.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 bg-[#04040a]/40">
            <div className="flex items-center gap-4">
              {(["crit", "warn", "ok"] as Severidade[]).map((s) => {
                const count = queriesLentas.filter(
                  (q) => getSeveridade(q.mean_exec_time) === s
                ).length;
                if (count === 0) return null;
                const st = estilosSeveridade[s];
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
                · {queriesLentas.length}{" "}
                {queriesLentas.length === 1 ? "query" : "queries"} no total
              </span>
            </div>
            <span className="text-[10px] text-slate-700 font-mono">
              ESC para fechar
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
