"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Importação dos ícones do Lucide (Certifique-se de ter instalado: npm install lucide-react)
import { ShieldCheck, Mail, Lock } from 'lucide-react';
// Firebase imports
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
    const userCredential =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const token =
    await userCredential.user.getIdToken();

    document.cookie =
    `firebase-token=${token}; path=/; max-age=3600; SameSite=Lax`;
       console.log("Login autorizado!");
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result =
      await signInWithPopup(auth, provider);

      const token =
      await result.user.getIdToken();

      document.cookie =
      `firebase-token=${token}; path=/; max-age=3600; SameSite=Lax`;
      console.log("Login com Google autorizado!");
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
  setError('');
  setSuccess('');

  if (!email) {
    setError('Digite seu e-mail antes de recuperar a senha.');
    return;
  }

  try {
    setLoading(true);

    await sendPasswordResetEmail(auth, email);

    setSuccess(
    'Link de redefinição enviado para seu e-mail.'
    );

  } catch (err: any) {

    if (err.code === 'auth/user-not-found') {
      setError('Usuário não encontrado.');
    } else if (err.code === 'auth/invalid-email') {
      setError('E-mail inválido.');
    } else {
      setError('Erro ao enviar recuperação de senha.');
    }

  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6 relative font-sans">
      
      <Link href="/" className="absolute top-8 left-8 text-slate-500 hover:text-sky-400 transition-colors text-sm font-bold">
        ← VOLTAR PARA O INÍCIO
      </Link>

      {/* Card Principal com efeito de brilho suave na borda conforme imagem */}
      <div className="w-full max-w-[480px] bg-slate-900/80 border border-blue-500/30 p-12 rounded-[2rem] shadow-2xl backdrop-blur-sm">
        
        {/* Ícone de Escudo no Topo */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20">
            <ShieldCheck className="text-blue-500" size={40} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-white text-2xl font-black uppercase tracking-widest">Entrar no Query Sniffer</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Gerencie a performance do seu banco com IA.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* ÁREA CENTRAL: CAMPOS COM ÍCONES */}
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
          </div>

          {/* OPÇÕES ADICIONAIS */}
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
            <label className="flex items-center gap-2 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-sky-500 w-4 h-4 rounded" 
              /> 
              Lembrar dados
            </label>
            <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
            className="text-blue-700 hover:text-sky-400 transition-colors disabled:opacity-50"
          >
            Esqueceu a senha?
          </button>
          </div>

          {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 animate-pulse">
            <p className="text-red-400 text-xs text-center font-bold tracking-wide">
              {error}
            </p>
          </div>
          )}

          {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 animate-pulse">
            <p className="text-emerald-400 text-xs text-center font-bold tracking-wide">
              {success}
            </p>
          </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 uppercase tracking-widest"
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>

        {/* LOGIN SOCIAL */}
        <div className="mt-10 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Ou acesse com:</p>
          <div className="flex justify-center gap-6 mb-8">
            {/* Ícone customizado para Google via SVG para maior fidelidade */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              title="Login com Google"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.4-2.12 4.48-1.2 1.08-2.68 1.92-4.68 1.92-3.88 0-7.12-2.72-7.12-6.6s3.24-6.6 7.12-6.6c2.08 0 3.76.76 4.96 1.96l2.36-2.36C18.96 3.16 16.08 2 12.48 2 6.44 2 1.52 6.92 1.52 13s4.92 11 10.96 11c3.28 0 5.8-1.08 7.76-3.12 2-2.04 2.68-4.88 2.68-7.24 0-.52-.04-1.04-.12-1.48h-8.84z"/>
              </svg>
            </button>
        
          </div>
          <p className="text-slate-500 text-xs font-bold">
            Novo usuário? <Link href="/cadastro" className="text-sky-500 hover:underline">Cria uma conta</Link>
          </p>
        </div>
      </div>
    </main>
  );
}