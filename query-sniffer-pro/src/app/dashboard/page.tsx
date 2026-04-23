"use client";

import { useState, useRef } from "react";
import { 
  Database, Folder, Table2, Search, Settings, 
  ArrowRight, Zap, CalendarClock, LayoutGrid, LogOut 
} from "lucide-react";

export default function Dashboard() {
  const [db, setDb] = useState<any>(null);
  const [tabelasEncontradas, setTabelasEncontradas] = useState<string[]>([
    "Location", "Analytics", "System_Logs"
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  //tirei o sql.js, pq ia ser pesado e não é o foco do projeto
  const processarArquivoSQL = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    // simula carregamento
    setDb({});
    setTabelasEncontradas(["users", "orders", "products"]);

    alert(`Arquivo "${arquivo.name}" carregado (modo simulado).`);
  };

  return (
    <main className="min-h-screen bg-[#04040a] text-slate-100 font-sans p-6 relative overflow-hidden">
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={processarArquivoSQL} 
        accept=".db,.sqlite,.sql"
        className="hidden" 
      />

      <nav className="flex items-center justify-between mb-8 px-6 py-4 bg-[#0a0c20]/60 border border-blue-500/20 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Database className="text-blue-400" size={20} />
          <h1 className="text-xl font-black uppercase">
            Query <span className="text-blue-500">Sniffer</span>
          </h1>
        </div>

        <a href="/login" className="text-red-500 font-bold flex items-center gap-2">
          Sair <LogOut size={14}/>
        </a>
      </nav>

      <div className="grid grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        
        {/* SIDEBAR */}
        <aside className="col-span-12 lg:col-span-3 bg-[#0a0c20]/40 border border-blue-500/20 rounded-[2rem] p-8 h-[650px]">
          <h3 className="text-[10px] font-black text-blue-500/60 uppercase mb-8">
            Navegação
          </h3>

          <div className="space-y-5">
            <div className="flex items-center gap-3 text-blue-400 font-bold">
              <Database size={18}/> {db ? "DB_ATIVO" : "AGUARDANDO DB"}
            </div>

            <div className="ml-10 space-y-4 border-l border-white/5 pl-4">
              {tabelasEncontradas.map(table => (
                <div key={table} className="text-slate-500 hover:text-blue-400 flex items-center gap-3 text-xs">
                  <Table2 size={14}/> {table}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
            <h2 className="text-4xl font-black mb-4">Query Sniffer</h2>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-xs uppercase"
            >
              {db ? "Trocar Base" : "Iniciar Análise"}
            </button>
          </div>

          <div className="bg-[#0a0c20]/60 border border-blue-500/20 rounded-[2rem] p-8">
            <div className="mb-6 text-blue-400 font-bold text-xs">
              Explorador
            </div>

            {tabelasEncontradas.map((t, i) => (
              <div key={i} className="p-3 bg-white/5 rounded mb-2 text-xs">
                {t}
              </div>
            ))}
          </div>

        </div>
      </div>
    </main>
  );
}