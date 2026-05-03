// ──────────────────────────────────────────────
// Carrega o sql.js (WASM) via CDN sob demanda. Mantemos como singleton
// em window.SQL pra nao recarregar em cada upload de banco.
// ──────────────────────────────────────────────

const CDN = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3";

export function carregarSqlJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("carregarSqlJs so funciona no browser"));
      return;
    }
    const w = window as any;
    if (w.SQL) {
      resolve(w.SQL);
      return;
    }

    const inicializar = (initFn: any) => {
      initFn({ locateFile: () => `${CDN}/sql-wasm.wasm` })
        .then((SQL: any) => {
          w.SQL = SQL;
          resolve(SQL);
        })
        .catch(reject);
    };

    if (!document.getElementById("sqljs-script")) {
      const script = document.createElement("script");
      script.id = "sqljs-script";
      script.src = `${CDN}/sql-wasm.js`;
      script.async = true;
      document.head.appendChild(script);
      script.onload = () => inicializar(w.initSqlJs);
      script.onerror = () => reject(new Error("Falha ao carregar sql.js"));
    } else {
      const aguardar = setInterval(() => {
        if (w.initSqlJs) {
          clearInterval(aguardar);
          inicializar(w.initSqlJs);
        }
      }, 100);
    }
  });
}
