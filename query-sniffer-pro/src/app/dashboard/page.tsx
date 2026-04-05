"use client";

import { 
  Database, Folder, Table2, Search, Settings, 
  ArrowRight, Zap, CalendarClock, LayoutGrid, LogOut 
} from "lucide-react";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#04040a] text-slate-100 font-sans p-6 relative overflow-hidden">
      
      {/* Efeito de Luz de Fundo (Glow azulado idêntico ao Login) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* NAVBAR COM EFEITO DE VIDRO */}
      <nav className="flex items-center justify-between mb-8 px-6 py-4 bg-[#0a0c20]/60 border border-blue-500/20 rounded-2xl backdrop-blur-xl z-10 relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
            <Database className="text-blue-400" size={20} />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase">Query <span className="text-blue-500">Sniffer</span></h1>
        </div>
        <div className="hidden md:flex gap-8 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          {['Home', 'Recursos', 'Conta', 'Sobre'].map(i => (
            <a key={i} href="#" className="hover:text-blue-400 transition-all">{i}</a>
          ))}
          <a href="/login" className="flex items-center gap-2 text-red-500/80 hover:text-red-400 font-black">Sair <LogOut size={14}/></a>
        </div>
      </nav>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-12 gap-6 max-w-[1600px] mx-auto relative z-10">
        
        {/* SIDEBAR: OBJECT BROWSER (Retângulo com borda azulada) */}
        <aside className="col-span-12 lg:col-span-3 bg-[#0a0c20]/40 border border-blue-500/20 rounded-[2rem] p-8 h-[650px] backdrop-blur-md">
          <h3 className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.3em] mb-8">Navegação</h3>
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-blue-400 font-bold"><Database size={18}/> DB_PROD_01</div>
            <div className="flex items-center gap-3 text-slate-300 ml-5 text-sm hover:text-white cursor-pointer"><Folder size={16} className="text-indigo-400"/> Schemas</div>
            <div className="ml-10 space-y-4 border-l border-white/5 pl-4">
              {['Location', 'Analytics', 'System_Logs'].map(table => (
                <div key={table} className="text-slate-500 hover:text-blue-400 cursor-pointer flex items-center gap-3 text-xs transition-colors">
                  <Table2 size={14}/> {table}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ÁREA CENTRAL */}
        <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* WELCOME CARD (Foco central com brilho) */}
          <div className="bg-gradient-to-br from-blue-600/20 to-transparent border-2 border-blue-500/30 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center shadow-[0_0_40px_rgba(59,130,246,0.1)]">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase leading-none">Query Sniffer</h2>
            <p className="text-slate-400 text-sm mb-10 max-w-[280px]">Gerencie a performance do seu banco de dados com IA.</p>
            <div className="w-full space-y-4">
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2">
                Iniciar Nova Análise <ArrowRight size={16}/>
              </button>
            </div>
          </div>

          {/* EXPLORER / TABELA */}
          <div className="bg-[#0a0c20]/60 border border-blue-500/20 rounded-[2.5rem] p-8">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-5">
              <div className="flex gap-8 text-[10px] font-black uppercase text-slate-500">
                <span className="text-blue-400 border-b-2 border-blue-400 pb-5">Explorador</span>
                <span className="hover:text-slate-200 cursor-pointer">Logs de Query</span>
              </div>
              <Settings size={18} className="text-slate-500 cursor-pointer" />
            </div>
            <div className="space-y-2">
               {[1,2,3,4].map(i => (
                 <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center hover:border-blue-500/30 transition-all cursor-pointer">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                     <span className="text-xs text-slate-300 font-medium tracking-wide">Query_Execution_00{i}</span>
                   </div>
                   <span className="text-[10px] text-slate-500 font-bold">24ms</span>
                 </div>
               ))}
            </div>
          </div>

          {/* FERRAMENTAS RÁPIDAS (Azul Profundo) */}
          <div className="col-span-1 md:col-span-2 bg-[#0a0c20]/40 border border-blue-500/20 rounded-[2.5rem] p-10 mt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: LayoutGrid, label: 'Esquema' },
                { icon: Search, label: 'Consultar' },
                { icon: Zap, label: 'Otimizar' },
                { icon: CalendarClock, label: 'Backups' },
              ].map((tool, idx) => (
                <button key={idx} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-blue-600/5 border border-blue-500/10 hover:border-blue-500/50 hover:bg-blue-600/10 transition-all group">
                  <tool.icon className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" size={28} />
                  <span className="text-[10px] font-black text-slate-500 group-hover:text-blue-400 uppercase tracking-widest">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}