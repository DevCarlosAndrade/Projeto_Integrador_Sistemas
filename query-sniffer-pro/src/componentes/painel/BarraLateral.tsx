"use client";

import { Database, Upload, Columns } from "lucide-react";
import type { TabelaInfo } from "@/src/tipos/painel";
import { ItemTabela } from "./ItemTabela";

// Barra lateral esquerda — botao de upload, info do banco carregado e
// lista de tabelas com colunas expansiveis.
// Recebe tudo via props pra que o pai (page.tsx) controle o estado.
export function BarraLateral({
  nomeBanco,
  nomeSchema,
  carregandoBanco,
  passoCarregamento,
  erroBanco,
  estaArrastando,
  tabelas,
  tabelasAbertas,
  aoEscolherArquivo,
  aoArrastarSobre,
  aoSairArrastando,
  aoSoltar,
  aoAlternarTabela,
}: {
  nomeBanco: string | null;
  nomeSchema: string | null;
  carregandoBanco: boolean;
  passoCarregamento: string;
  erroBanco: string | null;
  estaArrastando: boolean;
  tabelas: TabelaInfo[];
  tabelasAbertas: Set<string>;
  aoEscolherArquivo: () => void;
  aoArrastarSobre: (e: React.DragEvent) => void;
  aoSairArrastando: () => void;
  aoSoltar: (e: React.DragEvent) => void;
  aoAlternarTabela: (name: string) => void;
}) {
  return (
    <aside className="w-72 shrink-0 flex flex-col border-r border-blue-500/15 bg-[#07081a]/80 overflow-hidden">
      {/* Topo: upload + status */}
      <div className="px-4 pt-5 pb-3 border-b border-white/5">
        <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest mb-3">
          Banco de Dados
        </p>
        <button
          onClick={aoEscolherArquivo}
          onDragOver={aoArrastarSobre}
          onDragLeave={aoSairArrastando}
          onDrop={aoSoltar}
          disabled={carregandoBanco}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed
            text-xs font-bold uppercase tracking-wider transition-all cursor-pointer
            ${estaArrastando
              ? "border-blue-400 bg-blue-500/10 text-blue-300"
              : "border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-500/5 text-slate-400 hover:text-blue-300"}
            ${carregandoBanco ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Upload size={14} />
          {carregandoBanco ? "Carregando..." : nomeBanco ? "Trocar Base" : "Iniciar Análise"}
        </button>

        {nomeBanco && !carregandoBanco && (
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Database size={12} className="text-blue-400 shrink-0" />
              <span className="text-[11px] text-blue-300 font-mono truncate">
                {nomeBanco}
              </span>
            </div>
            {nomeSchema && (
              <div
                className="flex items-center gap-2 px-2 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20"
                title="Schema criado no PostgreSQL para esta sessão"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                <span className="text-[10px] text-green-300 font-mono truncate">
                  pg: {nomeSchema}
                </span>
              </div>
            )}
          </div>
        )}

        {erroBanco && (
          <p className="mt-2 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5">
            {erroBanco}
          </p>
        )}
      </div>

      {/* Lista de tabelas */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {carregandoBanco && (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-xs text-slate-500">
              {passoCarregamento || "Lendo banco de dados…"}
            </p>
          </div>
        )}
        {!carregandoBanco && tabelas.length === 0 && !erroBanco && (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
            <Columns size={28} className="text-slate-700" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Carregue um arquivo <span className="text-slate-500 font-mono">.db</span> ou{" "}
              <span className="text-slate-500 font-mono">.sqlite</span> para ver as tabelas aqui
            </p>
          </div>
        )}
        {!carregandoBanco &&
          tabelas.map((tabela) => (
            <ItemTabela
              key={tabela.name}
              tabela={tabela}
              estaAberto={tabelasAbertas.has(tabela.name)}
              aoAlternar={() => aoAlternarTabela(tabela.name)}
            />
          ))}
      </div>

      {/* Rodape: contagem rapida */}
      {tabelas.length > 0 && (
        <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-slate-500 font-mono">
            {tabelas.length} tabela{tabelas.length !== 1 ? "s" : ""} •{" "}
            {tabelas.reduce((acc, t) => acc + t.columns.length, 0)} colunas
          </span>
        </div>
      )}
    </aside>
  );
}
