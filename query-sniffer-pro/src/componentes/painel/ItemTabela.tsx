import { ChevronDown, ChevronRight, Table2 } from "lucide-react";
import type { TabelaInfo } from "@/src/tipos/painel";
import { IconeTipoColuna } from "./IconeTipoColuna";

// Linha clicavel da barra lateral: mostra a tabela e expande as colunas.
// Recebe estado externo (estaAberto) e callback (aoAlternar) — o pai controla
// quais tabelas estao expandidas.
export function ItemTabela({
  tabela,
  estaAberto,
  aoAlternar,
}: {
  tabela: TabelaInfo;
  estaAberto: boolean;
  aoAlternar: () => void;
}) {
  return (
    <div className="mb-1">
      <button
        onClick={aoAlternar}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group cursor-pointer
          ${estaAberto
            ? "bg-blue-600/20 border border-blue-500/30 text-blue-300"
            : "hover:bg-white/5 text-slate-400 hover:text-blue-400 border border-transparent"
          }`}
      >
        {estaAberto ? (
          <ChevronDown size={14} className="shrink-0 text-blue-400" />
        ) : (
          <ChevronRight size={14} className="shrink-0 group-hover:text-blue-400" />
        )}
        <Table2 size={14} className="shrink-0 group-hover:text-blue-400 transition-colors" />
        <span className="text-xs font-mono font-semibold truncate group-hover:text-blue-400 transition-colors">
          {tabela.name}
        </span>
        <span className="ml-auto text-[10px] text-slate-600 group-hover:text-blue-500/60">
          {tabela.columns.length}
        </span>
      </button>

      {estaAberto && (
        <div className="mt-1 ml-4 pl-3 border-l border-blue-500/20 space-y-0.5">
          {tabela.columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
            >
              <IconeTipoColuna type={col.type} />
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
