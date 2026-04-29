"use client";

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
  MAX_RENDERED_ROWS,
} from "@/src/utilitarios/severidade";

// Painel inferior da area do editor: mostra placeholder, loading,
// erro ou tabela de resultados, conforme o estado da execucao.
// Inclui banner de truncamento quando o backend cortou linhas ou quando
// o frontend limita render por seguranca.
export function PainelResultados({
  executando,
  resultadoQuery,
  erroQuery,
}: {
  executando: boolean;
  resultadoQuery: ResultadoQuery | null;
  erroQuery: ErroQuery | null;
}) {////////

const exportarCSV = () => {

 if (!resultadoQuery?.rows?.length) return;

 const headers =
   resultadoQuery.fields.map(
    campo => campo.name
   );

 const linhas = [
   headers.join(","),
   ...resultadoQuery.rows.map((row:any)=>
      headers.map(coluna=>{
        const valor = row[coluna];

        return `"${String(valor ?? "")
          .replace(/"/g,'""')}"`;
      }).join(",")
   )
 ];

 const csv =
  linhas.join("\n");

 const blob =
  new Blob(
   [csv],
   {
    type:"text/csv;charset=utf-8;"
   }
  );

 const url =
  URL.createObjectURL(blob);

 const link =
  document.createElement("a");

 link.href = url;
 link.download =
  `query_resultado_${Date.now()}.csv`;

 link.click();

 URL.revokeObjectURL(url);
};

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#06070f]">
      {/* Idle */}
      {!resultadoQuery && !erroQuery && !executando && (
        <div className="flex-1 flex items-center justify-center gap-3 text-slate-700">
          <Play size={18} />
          <span className="text-sm">
            Execute uma query para ver os resultados aqui
          </span>
        </div>
      )}

      {/* Loading */}
      {executando && (
        <div className="flex-1 flex items-center justify-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
          <span className="text-sm">Executando no banco…</span>
        </div>
      )}

      {/* Erro */}
      {erroQuery && !executando && (
        <div className="flex-1 flex flex-col overflow-auto p-5">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-400">
                  Erro na execução
                </span>
                {erroQuery.execTimeMs > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-600">
                    <Clock size={10} /> {erroQuery.execTimeMs}ms
                  </span>
                )}
              </div>
              <pre className="text-sm text-red-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                {erroQuery.error}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Sucesso */}
      {resultadoQuery && !executando && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Status bar */}
<div className="flex items-center px-4 py-2 border-b border-white/5 bg-[#0a0c20]/30 shrink-0">            <div className="flex items-center gap-1.5 text-green-400 mr-4">
              <CheckCircle2 size={13} />
              <span className="text-[11px] font-black uppercase tracking-wider">
                Sucesso
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-[11px] mr-4">
              <Rows size={12} />
              <span>
                {(() => {
                  // total real (vem do backend pra SELECTs; cai pra rowCount/rows.length)
                  const total =
                    typeof resultadoQuery.totalRows === "number"
                      ? resultadoQuery.totalRows
                      : resultadoQuery.rowCount !== null
                        ? resultadoQuery.rowCount
                        : resultadoQuery.rows.length;
                  return `${total.toLocaleString("pt-BR")} linha${total !== 1 ? "s" : ""}`;
                })()}
              </span>
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

            <div className="ml-auto">
      <button
        onClick={exportarCSV}
        disabled={!resultadoQuery?.rows?.length}
        className="
          px-3 py-1.5
          rounded-md
          border border-blue-500/30
          text-blue-400
          hover:bg-blue-500/10
          text-[11px]
          font-black
          uppercase
          tracking-wider
          transition
        "
      >
        Exportar
      </button>
    </div>
          </div>

          {/* Tabela */}
          {resultadoQuery.rows.length > 0 ? (
            (() => {
              const totalRowsServer =
                typeof resultadoQuery.totalRows === "number"
                  ? resultadoQuery.totalRows
                  : resultadoQuery.rows.length;
              const linhasParaRender =
                resultadoQuery.rows.length > MAX_RENDERED_ROWS
                  ? resultadoQuery.rows.slice(0, MAX_RENDERED_ROWS)
                  : resultadoQuery.rows;
              const truncadoServer = !!resultadoQuery.truncated;
              const truncadoCliente =
                resultadoQuery.rows.length > MAX_RENDERED_ROWS;
              const mostrarBanner = truncadoServer || truncadoCliente;

              return (
                <div className="flex-1 overflow-auto">
                  {mostrarBanner && (
                    <div className="sticky top-0 z-20 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-[11px]">
                      <AlertTriangle
                        size={12}
                        className="text-amber-400 shrink-0"
                      />
                      <span className="text-amber-300 font-mono">
                        {truncadoServer ? (
                          <>
                            Resultado grande: backend devolveu apenas{" "}
                            <strong>
                              {resultadoQuery.rows.length.toLocaleString("pt-BR")}
                            </strong>{" "}
                            de{" "}
                            <strong>
                              {totalRowsServer.toLocaleString("pt-BR")}
                            </strong>{" "}
                            linhas
                            {truncadoCliente && (
                              <>
                                {" "}
                                · exibindo as primeiras{" "}
                                <strong>
                                  {MAX_RENDERED_ROWS.toLocaleString("pt-BR")}
                                </strong>{" "}
                                no editor
                              </>
                            )}
                            . Use <span className="font-mono">LIMIT</span> /{" "}
                            <span className="font-mono">WHERE</span> pra reduzir.
                          </>
                        ) : (
                          <>
                            Exibindo as primeiras{" "}
                            <strong>
                              {MAX_RENDERED_ROWS.toLocaleString("pt-BR")}
                            </strong>{" "}
                            de{" "}
                            <strong>
                              {resultadoQuery.rows.length.toLocaleString("pt-BR")}
                            </strong>{" "}
                            linhas (cap do navegador pra manter a UI fluida).
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  <table className="w-full text-sm border-collapse">
                    <thead
                      className={`sticky z-10 ${mostrarBanner ? "top-[33px]" : "top-0"}`}
                    >
                      <tr className="bg-[#0d0f28] border-b border-blue-500/20">
                        <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest
                          text-slate-600 border-r border-white/5 w-10 select-none">
                          #
                        </th>
                        {resultadoQuery.fields.map((f) => (
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
                      {linhasParaRender.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b border-white/[0.03] transition-colors hover:bg-blue-500/5
                            ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"}`}
                        >
                          <td className="px-3 py-2 text-[11px] text-slate-700 font-mono border-r border-white/5 select-none">
                            {i + 1}
                          </td>
                          {resultadoQuery.fields.map((f) => {
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
              );
            })()
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
  );
}
