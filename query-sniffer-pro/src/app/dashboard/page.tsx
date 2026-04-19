"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Database, Folder, Table2, Settings, 
  ArrowRight, LogOut, Upload 
} from "lucide-react";

export default function Dashboard() {
  const [db, setDb] = useState(false);
  const [tabelasEncontradas, setTabelasEncontradas] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  //buscar do pg
  const carregarBancos = async () => {
    try {
      const res = await fetch("http://localhost:3001/databases");
      const data = await res.json();

      if (Array.isArray(data)) {
        // pega nomes dos bancos
        const nomes = data.map((item: any) => item.name);
        setTabelasEncontradas(nomes);
        setDb(nomes.length > 0);
      }
    } catch (err) {
      console.error("Erro ao carregar bancos:", err);
    }
  };

  //upload
  const processarArquivoSQL = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    const formData = new FormData();
    formData.append("file", arquivo);

    try {
      const res = await fetch("http://host.docker.internal:3001/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar");
      }

      alert(`Banco "${arquivo.name}" enviado com sucesso!`);

      //recarrega fo banco (persistência)
      await carregarBancos();

    } catch (err) {
      console.error(err);
      alert("Erro ao enviar arquivo.");
    }
  };

  // carrega ao abrir
  useEffect(() => {
    carregarBancos();
  }, []);

  return (
    <main className="min-h-screen bg-[#04040a] text-slate-100 font-sans p-6 relative overflow-hidden">
      
      {/* INPUT ESCONDIDO */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={processarArquivoSQL} 
        accept=".db,.sqlite,.sql"
        className="hidden" 
      />

      {/* NAVBAR */}
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

      {/* GRID */}
      <div className="grid grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        
        {/* SIDEBAR */}
        <aside className="col-span-12 lg:col-span-3 bg-[#0a0c20]/40 border border-blue-500/20 rounded-[2rem] p-8 h-[650px] backdrop-blur-md flex flex-col">
          
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.3em]">
              Navegação
            </h3>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg border border-blue-500/30 transition-all text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest"
            >
              <Upload size={16} />
              Importar Base
            </button>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3 text-blue-400 font-bold">
              <Database size={18}/> {db ? "DB_ATIVO" : "AGUARDANDO DB"}
            </div>

            <div className="flex items-center gap-3 text-slate-300 ml-5 text-sm">
              <Folder size={16} className="text-indigo-400"/> Bancos
            </div>

            <div className="ml-10 space-y-4 border-l border-white/5 pl-4">
              {tabelasEncontradas.length === 0 ? (
                <div className="text-slate-500 text-xs">Nenhum banco enviado</div>
              ) : (
                tabelasEncontradas.map((table) => (
                  <div key={table} className="text-slate-500 hover:text-blue-400 flex items-center gap-3 text-xs">
                    <Table2 size={14}/> {table}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-gradient-to-br from-blue-600/20 to-transparent border-2 border-blue-500/30 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center">
            <h2 className="text-4xl font-black text-white mb-4 uppercase">
              Query Sniffer
            </h2>

            <p className="text-slate-400 text-sm mb-10 max-w-[280px]">
              Gerencie a performance do seu banco de dados com IA.
            </p>

            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              Iniciar Nova Análise <ArrowRight size={16}/>
            </button>
          </div>

          <div className="bg-[#0a0c20]/60 border border-blue-500/20 rounded-[2.5rem] p-8">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-5">
              <span className="text-blue-400 font-black uppercase text-xs">Explorador</span>
              <Settings size={18} className="text-slate-500" />
            </div>

            <div className="space-y-2">
              {tabelasEncontradas.map((db, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl flex justify-between">
                  <span className="text-xs text-slate-300">{db}</span>
                  <span className="text-[10px] text-slate-500">persistido</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}