"use client";

import { forwardRef } from "react";
import { Activity, Trash2, Play } from "lucide-react";

// Editor SQL: barra de ferramentas (Monitoramento, Limpar, Executar) + textarea.
// O ref do textarea fica externo (forwardRef) pra que o pai possa focar nele
// quando o usuario clica em "Usar no editor" nas sugestoes do chat.
type Props = {
  sql: string;
  executando: boolean;
  aoMudarSql: (val: string) => void;
  aoApertarTecla: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  aoAbrirMonitoramento: () => void;
  aoLimpar: () => void;
  aoExecutar: () => void;
};

export const PainelEditor = forwardRef<HTMLTextAreaElement, Props>(
  function PainelEditor(
    {
      sql,
      executando,
      aoMudarSql,
      aoApertarTecla,
      aoAbrirMonitoramento,
      aoLimpar,
      aoExecutar,
    },
    ref
  ) {
    return (
      <div className="shrink-0 flex flex-col border-b border-blue-500/15">
        {/* Barra superior */}
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
              onClick={aoAbrirMonitoramento}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
                text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent
                hover:border-blue-500/30 transition-all cursor-pointer"
              title="Ver tempo de execução das queries"
            >
              <Activity size={12} />
              Monitoramento
            </button>
            <button
              onClick={aoLimpar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
                text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
            >
              <Trash2 size={12} />
              Limpar
            </button>
            <button
              onClick={aoExecutar}
              disabled={executando || !sql.trim()}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-black
                uppercase tracking-wider transition-all
                ${executando || !sql.trim()
                  ? "bg-blue-600/30 text-blue-400/40 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md shadow-blue-900/30"
                }`}
            >
              {executando ? (
                <div className="w-3 h-3 border-2 border-blue-300/40 border-t-blue-300 rounded-full animate-spin" />
              ) : (
                <Play size={12} fill="currentColor" />
              )}
              {executando ? "Executando..." : "Executar"}
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={ref}
          value={sql}
          onChange={(e) => aoMudarSql(e.target.value)}
          onKeyDown={aoApertarTecla}
          placeholder={"SELECT * FROM sua_tabela LIMIT 100;"}
          spellCheck={false}
          rows={7}
          className="w-full bg-[#04040a] text-slate-200 font-mono text-sm px-5 py-4
            resize-none outline-none placeholder:text-slate-700 border-0 leading-relaxed"
          style={{ caretColor: "#60a5fa" }}
        />
      </div>
    );
  }
);
