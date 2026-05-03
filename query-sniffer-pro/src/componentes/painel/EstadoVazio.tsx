"use client";

import { Database, Upload } from "lucide-react";

// Tela do meio quando nenhum banco foi carregado.
// Reutiliza os mesmos handlers de drag & drop e click do upload.
export function EstadoVazio({
  estaArrastando,
  aoEscolherArquivo,
  aoArrastarSobre,
  aoSairArrastando,
  aoSoltar,
}: {
  estaArrastando: boolean;
  aoEscolherArquivo: () => void;
  aoArrastarSobre: (e: React.DragEvent) => void;
  aoSairArrastando: () => void;
  aoSoltar: (e: React.DragEvent) => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        onDragOver={aoArrastarSobre}
        onDragLeave={aoSairArrastando}
        onDrop={aoSoltar}
        className={`flex flex-col items-center justify-center gap-5 w-full max-w-md
          border-2 border-dashed rounded-3xl p-14 transition-all
          ${estaArrastando ? "border-blue-400 bg-blue-500/5" : "border-blue-500/20 hover:border-blue-500/40"}`}
      >
        <div className="p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
          <Database size={36} className="text-blue-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-tight mb-2">Query Sniffer</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Carregue um banco de dados SQLite para começar a escrever e executar queries.
          </p>
        </div>
        <button
          onClick={aoEscolherArquivo}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl
            text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-900/30"
        >
          <Upload size={14} />
          Iniciar Análise
        </button>
        <p className="text-[11px] text-slate-600">ou arraste e solte o arquivo aqui</p>
      </div>
    </div>
  );
}
