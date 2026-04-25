import { Sparkles, ArrowRight } from "lucide-react";
import type { TabelaInfo } from "@/src/tipos/painel";

// Card de boas-vindas exibido no chat antes da primeira mensagem.
// Sem banco carregado: apresentacao curta.
// Com banco: sugestoes geradas pela IA (ou fallback) clicaveis.
export function BoasVindasChat({
  tabelas,
  carregandoSugestoes,
  sugestoes,
  chatPensando,
  aoEscolherSugestao,
}: {
  tabelas: TabelaInfo[];
  carregandoSugestoes: boolean;
  sugestoes: string[];
  chatPensando: boolean;
  aoEscolherSugestao: (texto: string) => void;
}) {
  const temBanco = tabelas.length > 0;

  return (
    <div className="flex flex-col h-full px-1">
      {!temBanco ? (
        // ── Sem banco carregado ──
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
        // ── Com banco carregado ──
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-start gap-2 px-1">
            <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0">
              <Sparkles size={12} className="text-blue-400" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Analisei as{" "}
              <span className="text-blue-400 font-bold">
                {tabelas.length} {tabelas.length === 1 ? "tabela" : "tabelas"}
              </span>{" "}
              carregadas. Aqui vão algumas consultas que você pode me pedir:
            </p>
          </div>

          {carregandoSugestoes && (
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

          {!carregandoSugestoes && sugestoes.length > 0 && (
            <div className="space-y-1.5 px-1">
              {sugestoes.map((s, i) => (
                <button
                  key={i}
                  onClick={() => aoEscolherSugestao(s)}
                  disabled={chatPensando}
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

          {!carregandoSugestoes && sugestoes.length === 0 && (
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
  );
}
