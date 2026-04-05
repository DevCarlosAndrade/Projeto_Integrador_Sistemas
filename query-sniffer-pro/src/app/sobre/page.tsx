// src/app/sobre/page.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Zap, ChevronLeft } from 'lucide-react';

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-[#04040a] flex flex-col items-center justify-center p-6 relative font-sans overflow-hidden">
      
      {/* --- Efeitos de Iluminação de Fundo (Glow) --- */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* --- BOTÃO VOLTAR --- */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 text-slate-500 hover:text-cyan-400 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 z-20"
      >
        <ChevronLeft size={16} /> Voltar ao Painel
      </Link>

      {/* === CARD PRINCIPAL: NOSSA FILOSOFIA === */}
      <div className="w-full max-w-[680px] bg-[#0a0c20]/60 border-2 border-blue-500/20 p-12 md:p-16 rounded-[3rem] shadow-[0_0_50px_rgba(59,130,246,0.1)] backdrop-blur-xl z-10 text-center relative">
        
        {/* --- CONTAINER DO SELO (PUBLIC/IMAGENS/SELO_DIEGUINHO.PNG) --- */}
        <div className="flex justify-center mb-10">
          <div className="relative w-44 h-44 rounded-full border-2 border-cyan-500/30 p-1 shadow-[0_0_30px_rgba(34,211,238,0.2)] overflow-hidden group">
            <Image 
              src="/imagens/selo_dieguinho.png"
              alt="Selo Dieguinho - Filosofia de Desenvolvimento"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              priority
            />
          </div>
        </div>

        {/* --- TÍTULO --- */}
        <h1 className="text-white text-3xl font-black uppercase tracking-[0.3em] mb-10">
          Nossa <span className="text-blue-500">Filosofia</span>
        </h1>

        {/* --- TEXTO DE FILOSOFIA (CONFORME O PRINT) --- */}
        <div className="space-y-8 text-slate-400 text-lg leading-relaxed max-w-[520px] mx-auto">
          <p>
            Somos uma equipe de desenvolvimento focada em <br />
            <span className="text-white font-bold italic">soluções duvidosas</span> e práticas que desafiam as <br /> 
            normas de qualidade e segurança.
          </p>
          
          <p>
            Usamos metodologias ágeis como: <br />
            <span className="text-cyan-400 font-black uppercase tracking-wider">prazo curto de entrega</span> <br />
            e <span className="text-red-500 font-black uppercase tracking-wider">desespero durante a compilação</span>.
          </p>
        </div>

        {/* --- LINHA DIVISORA --- */}
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent my-12 mx-auto"></div>

        {/* --- SEÇÃO: STACKS DE PÂNICO --- */}
        <div className="space-y-8">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Nossas stacks de pânico:</h2>
          
          <div className="flex justify-center gap-8 md:gap-12">
            {[
              { emoji: '☕', label: 'Overdose de Cafeína' },
              { emoji: '🔥', label: 'Desespero' },
              { emoji: '💊', label: 'Ansiolíticos' },
            ].map((stack, i) => (
              <div key={i} className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-slate-950/80 border border-white/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300">
                  {stack.emoji}
                </div>
                <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-300 uppercase tracking-widest transition-colors">
                  {stack.label}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- MENSAGEM DE STATUS INFERIOR --- */}
      <div className="absolute bottom-10 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] z-10">
        Query Sniffer v1.0 // Status: <span className="text-red-900">Unstable</span>
      </div>

    </main>
  );
}