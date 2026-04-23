"use client";

import { useEffect, useState } from "react";
import { Database, LogOut, Zap } from "lucide-react";

export default function QueriesPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [querySelecionada, setQuerySelecionada] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:3002/queries/slow")
      .then(res => res.json())
      .then(data => {
        setQueries(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  //botao para conectar a analise da query pela ia depois
  const analisarQuery = (query: string) => {
    console.log("Analisar:", query);
    setQuerySelecionada(query);
  };

  return (
    <main className="min-h-screen bg-[#04040a] text-slate-100 font-sans p-6">

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

      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-[2rem] p-8">
          <h2 className="text-3xl font-black flex items-center gap-2">
            <Zap className="text-yellow-400"/> Queries Lentas
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Monitoramento em tempo real via pg_stat_statements
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <p className="text-center text-slate-400">Carregando...</p>
        )}

        {/* TABELA */}
        {!loading && queries.length > 0 && (
          <div className="bg-[#0a0c20]/60 border border-blue-500/20 rounded-[2rem] overflow-hidden">

            <table className="w-full text-sm">
              <thead className="bg-blue-500/10 text-blue-400 text-xs uppercase">
                <tr>
                  <th className="p-4 text-left">#</th>
                  <th className="p-4 text-left">Query</th>
                  <th className="p-4 text-right">Tempo</th>
                  <th className="p-4 text-center">Ação</th>
                </tr>
              </thead>

              <tbody>
                {queries.map((q, i) => (
                  <tr
                    key={i}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="p-4 text-slate-400">
                      Query {i + 1}
                    </td>

                    <td
                      className="p-4 font-mono text-xs text-slate-300 max-w-[700px] truncate"
                      title={q.query}
                    >
                      {q.query}
                    </td>

                    <td className={`p-4 text-right font-bold ${
                      q.mean_exec_time > 100
                        ? "text-red-500"
                        : "text-green-400"
                    }`}>
                      {q.mean_exec_time.toFixed(2)} ms
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => analisarQuery(q.query)}
                        className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs"
                      >
                        Analisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}

        {!loading && queries.length === 0 && (
          <p className="text-center text-slate-400">
            Nenhuma query encontrada
          </p>
        )}

      </div>

      {/*MODAL SIMPLES */}
      {querySelecionada && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#0a0c20] p-6 rounded-2xl w-[600px] border border-blue-500/20">
            <h3 className="text-lg font-bold mb-4">Query selecionada</h3>

            <pre className="text-xs bg-black/40 p-4 rounded mb-4 overflow-x-auto">
              {querySelecionada}
            </pre>

            <button
              onClick={() => setQuerySelecionada(null)}
              className="bg-red-500 px-4 py-2 rounded text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </main>
  );
}