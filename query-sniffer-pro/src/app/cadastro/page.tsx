"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Importação dos ícones do Lucide
import { ShieldCheck, Mail, Lock, UserPlus } from 'lucide-react';
// Firebase imports
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function CadastroPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuário cadastrado com sucesso!");
      // Redirecionar para dashboard após cadastro
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6 relative font-sans">

      <Link href="/" className="absolute top-8 left-8 text-slate-500 hover:text-sky-400 transition-colors text-sm font-bold">
        ← VOLTAR PARA O INÍCIO
      </Link>

      {/* Card Principal */}
      <div className="w-full max-w-[480px] bg-slate-900/80 border border-blue-500/30 p-12 rounded-[2rem] shadow-2xl backdrop-blur-sm">

        {/* Ícone de Usuário no Topo */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20">
            <UserPlus className="text-blue-500" size={40} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-white text-2xl font-black uppercase tracking-widest">Criar Conta</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Junte-se ao Query Sniffer.</p>
        </div>

        <form onSubmit={handleCadastro} className="space-y-6">

          {/* CAMPOS */}
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" size={20} />
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" size={20} />
              <input
                type="password"
                placeholder="Senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" size={20} />
              <input
                type="password"
                placeholder="Confirmar Senha"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center font-bold animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 uppercase tracking-widest"
          >
            {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
          </button>
        </form>

        {/* LINK PARA LOGIN */}
        <div className="mt-10 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-xs font-bold">
            Já tem uma conta? <Link href="/login" className="text-sky-500 hover:underline">Faça o login</Link>
          </p>
        </div>
      </div>
    </main>
  );
}