"use client";

import { forwardRef, type RefObject } from "react";
import { Sparkles, Trash2, Send } from "lucide-react";
import type { MensagemChat as TipoMensagemChat, TabelaInfo } from "@/src/tipos/painel";
import { MensagemChat } from "./MensagemChat";
import { BoasVindasChat } from "./BoasVindasChat";

// Painel lateral direito (chat QuerySniffer.IA).
// Toda logica fica no pai; aqui so renderizamos. O ref do scroll
// e do input vem por props pra que o pai consiga rolar/focar.
type Props = {
  // estados de UI
  mensagens: TipoMensagemChat[];
  chatPensando: boolean;
  textoInput: string;
  aoMudarInput: (v: string) => void;
  aoEnviar: () => void;
  aoApertarTecla: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  aoLimparChat: () => void;
  aoUsarSql: (sql: string) => void;
  // dados pro card de boas vindas
  tabelas: TabelaInfo[];
  carregandoSugestoes: boolean;
  sugestoes: string[];
  aoEscolherSugestao: (texto: string) => void;
  // ref do textarea de input (pra focar quando o usuario limpa o chat)
  refInput: RefObject<HTMLTextAreaElement | null>;
};

// Forward ref pro container de scroll (auto-scroll fica no pai)
export const PainelChat = forwardRef<HTMLDivElement, Props>(function PainelChat(
  {
    mensagens,
    chatPensando,
    textoInput,
    aoMudarInput,
    aoEnviar,
    aoApertarTecla,
    aoLimparChat,
    aoUsarSql,
    tabelas,
    carregandoSugestoes,
    sugestoes,
    aoEscolherSugestao,
    refInput,
  },
  refScroll
) {
  return (
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

        {mensagens.length > 0 && (
          <button
            onClick={aoLimparChat}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold
              text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
            title="Limpar conversa"
          >
            <Trash2 size={10} />
          </button>
        )}
      </div>

      {/* Lista de mensagens */}
      <div ref={refScroll} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {mensagens.length === 0 && !chatPensando && (
          <BoasVindasChat
            tabelas={tabelas}
            carregandoSugestoes={carregandoSugestoes}
            sugestoes={sugestoes}
            chatPensando={chatPensando}
            aoEscolherSugestao={aoEscolherSugestao}
          />
        )}

        {mensagens.map((msg) => (
          <MensagemChat key={msg.id} mensagem={msg} aoUsarSql={aoUsarSql} />
        ))}

        {chatPensando && (
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
            ref={refInput}
            value={textoInput}
            onChange={(e) => aoMudarInput(e.target.value)}
            onKeyDown={aoApertarTecla}
            rows={2}
            placeholder="Descreva o que quer consultar…"
            className="flex-1 bg-[#04040a] text-slate-200 text-xs px-3 py-2 min-h-[40px] max-h-32
              resize-none outline-none placeholder:text-slate-700 border border-blue-500/20 rounded-lg
              focus:border-blue-500/50 transition-colors leading-relaxed"
          />
          <button
            onClick={aoEnviar}
            disabled={!textoInput.trim() || chatPensando}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all shrink-0
              ${!textoInput.trim() || chatPensando
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
  );
});
