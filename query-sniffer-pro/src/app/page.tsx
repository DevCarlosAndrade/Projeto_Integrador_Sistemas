"use client";

import Link from 'next/link';
import { Database, ArrowRight, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden font-sans">
      
      {/* --- CAMADA 0: VÍDEO DE FUNDO --- */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-25 pointer-events-none"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        Seu navegador não suporta vídeos.
      </video>

      {/* --- CAMADA 1: OVERLAY DE GRADIENTE --- */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950 z-[1] pointer-events-none"></div>

      {/* --- CAMADA 2: CONTEÚDO (Z-10) --- */}
      <nav className="absolute top-0 w-full p-8 flex justify-between items-center z-10 max-w-7xl">
        <div className="flex items-center gap-2">
          <Database className="text-blue-500" size={24} />
          <span className="text-white font-black tracking-tighter text-xl uppercase">Query Sniffer</span>
        </div>
        <Link 
          href="/sobre" 
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold text-xs transition-all shadow-lg shadow-blue-900/40 uppercase tracking-widest"
        >
          Sobre
        </Link>
      </nav>

      <div className="text-center z-10 max-w-3xl">
        <div className="flex justify-center mb-6">
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1 rounded-full text-[10px] font-black tracking-[0.3em] uppercase">
            AI-Powered Database Optimization
          </span>
        </div>
        
       <h1 className="text-7xl md:text-5xl font-black text-white tracking-tighter mb-6 leading-tight uppercase">
  Otimização de Query com <br />
  <span className="text-blue-600">Inteligência Artificial</span>
</h1>
        
        <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          O Query Sniffer utiliza inteligência artificial para identificar gargalos e otimizar suas consultas SQL.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link 
            href="/login"
            className="bg-white text-slate-950 hover:bg-slate-200 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
          >
            Começar Agora <ArrowRight size={18} />
          </Link>
        </div>

        {/* Badges de Recursos */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 pt-10">
          <div className="flex flex-col items-center gap-3">
            <Zap className="text-blue-400" size={24} />
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Alta Performance</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Shield className="text-blue-400" size={24} />
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Segurança Total</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Database className="text-blue-400" size={24} />
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Multi-Database</span>
          </div>
        </div>
      </div>
    </main>
  );
}