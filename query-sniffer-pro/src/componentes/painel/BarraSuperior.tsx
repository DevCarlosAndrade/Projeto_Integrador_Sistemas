"use client";

import { Database, LogOut, Activity } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/src/lib/firebase";

export function BarraSuperior() {

  async function handleLogout() {
    try {
      await signOut(auth); // encerra sessão firebase de verdade
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-[#0a0c20]/60 border-b border-blue-500/20 backdrop-blur-xl shrink-0">

      <div className="flex items-center gap-3">
        <Database className="text-blue-400" size={20} />
        <h1 className="text-xl font-black uppercase tracking-tight">
          Query <span className="text-blue-500">Sniffer</span>
        </h1>
      </div>

      <div className="flex items-center gap-6">

        <a
          href="http://localhost:3000/d/rYdddlPWk/node-exporter-full?orgId=1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 font-bold flex items-center gap-2 text-sm hover:text-blue-300 transition-colors"
        >
          Monitoramento <Activity size={15}/>
        </a>

        <button
          onClick={handleLogout}
          className="text-red-500 font-bold flex items-center gap-2 text-sm hover:text-red-400 transition-colors"
        >
          Sair <LogOut size={14}/>
        </button>

      </div>
    </nav>
  );
}