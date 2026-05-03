"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Rows,
  Play,
  Flame,
} from "lucide-react";
import type { ErroQuery, ResultadoQuery } from "@/src/tipos/painel";
import {
  getSeveridade,
  estilosSeveridade,
  SLOW_WARN_MS,
  SLOW_CRIT_MS,
} from "@/src/utilitarios/severidade";

export function PainelResultados({
  executando,
  resultadoQuery,
  erroQuery,
}: {
  executando: boolean;
  resultadoQuery: ResultadoQuery | null;
  erroQuery: ErroQuery | null;
}) {
  const [pagina, setPagina] = useState(1);
  const [mostrarAviso, setMostrarAviso] = useState(true);
  const PAGE_SIZE = 1000;

  useEffect(() => {
    setPagina(1);
    setMostrarAviso(true);
  }, [resultadoQuery]);

  if (executando) return (
    <div className="flex-1 flex items-center justify-center gap-3 text-slate-500 bg-[#06070f]">
      <div className="w-5 h-5 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
      <span className="text-sm">Executando no banco…</span>
    </div>
  );

  if (!resultadoQuery && !erroQuery) return (
    <div className="flex-1 flex items-center justify-center gap-3 text-slate-700 bg-[#06070f]">
      <Play size={18} />
      <span className="text-sm">Execute uma query para ver os resultados aqui</span>
    </div>
  );

  const inicio = (pagina - 1) * PAGE_SIZE;
  const fim = inicio + PAGE_SIZE;
  const totalPaginas = resultadoQuery ? Math.ceil(resultadoQuery.rows.length / PAGE_SIZE) : 1;

  return (
    <div className="flex-1 flex flex-col h-full max-h-full overflow-hidden bg-[#06070f]">
      
      {resultadoQuery && (
        <div className="shrink-0 flex items-center px-4 py-2 border-b border-white/5 bg-[#0a0c20]/50 z-30">
          <div className="flex items-center gap-1.5 text-green-400 mr-4">
            <CheckCircle2 size={13} />
            <span className="text-[11px] font-black uppercase tracking-wider">Sucesso</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 text-[11px] mr-4">
            <Rows size={12} />
            <span>{resultadoQuery.rows.length.toLocaleString("pt-BR")} linhas</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 text-[11px] mr-4">
            <Clock size={12} />
            <span>{resultadoQuery.execTimeMs}ms</span>
          </div>

          {(() => {
            const sev = getSeveridade(resultadoQuery.execTimeMs);
            if (sev === "ok") return null;
            const style = estilosSeveridade[sev];
            return (
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${style.bgColor} ${style.borderColor}`}
                title={sev === "crit" ? `Acima de ${SLOW_CRIT_MS}ms` : `Acima de ${SLOW_WARN_MS}ms`}
              >
                {sev === "crit" ? (
                  <Flame size={11} className={style.textColor} />
                ) : (
                  <AlertTriangle size={11} className={style.textColor} />
                )}
                <span className={`text-[10px] font-black uppercase tracking-wider ${style.textColor}`}>
                  {style.label}
                </span>
              </div>
            );
          })()}

          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                disabled={pagina === 1} 
                onClick={() => setPagina(p => p - 1)}
                className="px-2 py-1 text-xs border border-white/10 rounded-md hover:bg-white/5 disabled:opacity-20 text-slate-400"
              >←</button>
              <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                {inicio + 1}-{Math.min(fim, resultadoQuery.rows.length)} de {resultadoQuery.rows.length.toLocaleString("pt-BR")}
              </span>
              <button 
                disabled={pagina === totalPaginas} 
                onClick={() => setPagina(p => p + 1)}
                className="px-2 py-1 text-xs border border-white/10 rounded-md hover:bg-white/5 disabled:opacity-20 text-slate-400"
              >→</button>
            </div>
          </div>
        </div>
      )}

      {mostrarAviso && resultadoQuery?.truncated && (
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 z-20">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            <span className="text-amber-300 text-[11px] font-mono">
              Resultado grande: backend devolveu apenas <strong>{resultadoQuery.rows.length.toLocaleString("pt-BR")}</strong>. Use LIMIT pra reduzir.
            </span>
          </div>
          <button 
            onClick={() => setMostrarAviso(false)} 
            className="text-amber-400 hover:text-white transition-colors text-xs p-1"
          >✕</button>
        </div>
      )}

      <div className="flex-1 overflow-auto min-h-0 bg-[#06070f] relative">
        {resultadoQuery && resultadoQuery.rows.length > 0 ? (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#0d0f28] border-b border-blue-500/20 shadow-sm">
                <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase text-slate-600 border-r border-white/5 w-12 bg-[#0d0f28]">#</th>
                {resultadoQuery.fields.map((f) => (
                  <th key={f.name} className="px-4 py-2.5 text-left text-[10px] font-black uppercase text-blue-400/70 border-r border-white/5 bg-[#0d0f28] whitespace-nowrap">
                    {f.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {resultadoQuery.rows.slice(inicio, fim).map((row, i) => (
                <tr key={i} className="hover:bg-blue-500/5 transition-colors">
                  <td className="px-3 py-1.5 text-[11px] text-slate-700 font-mono border-r border-white/5">
                    {inicio + i + 1}
                  </td>
                  {resultadoQuery.fields.map((f) => (
                    <td key={f.name} className="px-4 py-1.5 font-mono text-[11px] text-slate-300 border-r border-white/5 last:border-r-0 truncate max-w-xs">
                      {row[f.name] === null ? (
                        <span className="text-slate-600 italic text-[10px]">NULL</span>
                      ) : (
                        String(row[f.name])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : erroQuery ? (
          <div className="p-6">
            <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
              <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap">{erroQuery.error}</pre>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}