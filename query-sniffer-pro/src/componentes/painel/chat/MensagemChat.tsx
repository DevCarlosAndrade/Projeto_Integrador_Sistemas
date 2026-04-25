"use client";

import { useState } from "react";
import { Sparkles, User as UserIcon, Copy, ArrowRight } from "lucide-react";
import type { MensagemChat as TipoMensagemChat } from "@/src/tipos/painel";

// Bolha de mensagem do chat (usuario ou IA).
// Quando a IA devolve um bloco SQL, mostra o codigo + botoes pra copiar
// e jogar a query direto no editor (callback aoUsarSql).
export function MensagemChat({
  mensagem,
  aoUsarSql,
}: {
  mensagem: TipoMensagemChat;
  aoUsarSql: (sql: string) => void;
}) {
  const ehUsuario = mensagem.role === "user";
  const [copiado, setCopiado] = useState(false);

  const copiarSql = async () => {
    if (!mensagem.sql) return;
    try {
      await navigator.clipboard.writeText(mensagem.sql);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`flex gap-2 ${ehUsuario ? "flex-row-reverse" : ""}`}>
      <div
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
          ${ehUsuario
            ? "bg-blue-600"
            : "bg-blue-500/10 border border-blue-500/30"
          }`}
      >
        {ehUsuario ? (
          <UserIcon size={13} className="text-white" />
        ) : (
          <Sparkles size={13} className="text-blue-400" />
        )}
      </div>

      <div
        className={`flex flex-col gap-1.5 max-w-[85%] ${ehUsuario ? "items-end" : "items-start"}`}
      >
        <div
          className={`px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words
            ${ehUsuario
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white/5 text-slate-200 border border-white/5 rounded-tl-sm"
            }`}
        >
          {mensagem.content}
        </div>

        {mensagem.sql && (
          <div className="w-full bg-[#04040a] border border-blue-500/20 rounded-lg overflow-hidden">
            <pre className="text-[11px] text-slate-300 font-mono p-3 overflow-x-auto leading-relaxed">
              {mensagem.sql}
            </pre>
            <div className="flex items-center justify-between px-2 py-1.5 border-t border-white/5 bg-[#0a0c20]/50">
              <span className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">
                SQL sugerido
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={copiarSql}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  title="Copiar"
                >
                  <Copy size={10} />
                  {copiado ? "Copiado" : "Copiar"}
                </button>
                <button
                  onClick={() => aoUsarSql(mensagem.sql!)}
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
