import type { Severidade } from "@/src/tipos/painel";

// limiares de tempo medio de execucao (em ms) para classificar uma query
export const SLOW_WARN_MS = 100;
export const SLOW_CRIT_MS = 500;

export function getSeveridade(meanMs: number): Severidade {
  if (meanMs >= SLOW_CRIT_MS) return "crit";
  if (meanMs >= SLOW_WARN_MS) return "warn";
  return "ok";
}

export const estilosSeveridade: Record<
  Severidade,
  {
    label: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    dotColor: string;
  }
> = {
  ok: {
    label: "Rápida",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    dotColor: "bg-green-400",
  },
  warn: {
    label: "Lenta",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    dotColor: "bg-yellow-400",
  },
  crit: {
    label: "Crítica",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    dotColor: "bg-red-400",
  },
};

// Limite de linhas que o React monta no DOM. Acima disso o navegador
// trava mesmo com os dados ja em memoria — o cap protege a UI.
export const MAX_RENDERED_ROWS = 1000;
