import { Database, LogOut } from "lucide-react";

// Barra superior fixa do painel. Sem estado proprio.
export function BarraSuperior() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-[#0a0c20]/60 border-b border-blue-500/20 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-3">
        <Database className="text-blue-400" size={20} />
        <h1 className="text-xl font-black uppercase tracking-tight">
          Query <span className="text-blue-500">Sniffer</span>
        </h1>
      </div>
      <a
        href="/login"
        className="text-red-500 font-bold flex items-center gap-2 text-sm hover:text-red-400 transition-colors"
      >
        Sair <LogOut size={14} />
      </a>
    </nav>
  );
}
