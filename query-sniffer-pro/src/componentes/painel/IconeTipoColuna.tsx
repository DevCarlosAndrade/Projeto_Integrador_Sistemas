import { Hash, ToggleLeft, Calendar, Braces, Type } from "lucide-react";

// Devolve o icone correspondente ao tipo de coluna (numerico, booleano,
// data, json/blob ou texto). Usado na barra lateral pra dar dica visual.
export function IconeTipoColuna({ type }: { type: string }) {
  const t = type.toUpperCase();
  if (
    t.includes("INT") ||
    t.includes("REAL") ||
    t.includes("NUMERIC") ||
    t.includes("FLOAT") ||
    t.includes("DOUBLE")
  )
    return <Hash size={12} className="text-blue-400 shrink-0" />;
  if (t.includes("BOOL"))
    return <ToggleLeft size={12} className="text-green-400 shrink-0" />;
  if (t.includes("DATE") || t.includes("TIME"))
    return <Calendar size={12} className="text-yellow-400 shrink-0" />;
  if (t.includes("JSON") || t.includes("BLOB"))
    return <Braces size={12} className="text-purple-400 shrink-0" />;
  return <Type size={12} className="text-slate-400 shrink-0" />;
}
