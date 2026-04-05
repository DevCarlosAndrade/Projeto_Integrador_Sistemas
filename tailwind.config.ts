import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nova paleta de Azuis Escuros
        sniffer: {
          bg: "#020617",         // Slate 950 (Fundo profundo)
          card: "#0f172a",       // Slate 900 (Fundo do Card)
          input: "#1e293b",      // Slate 800 (Fundo dos Inputs)
          primary: "#38bdf8",    // Cyan 400 (Destaques e Botão)
          accent: "#7dd3fc",     // Cyan 300 (Hover e Links)
          text: "#f1f5f9",       // Slate 100 (Texto Principal)
          dim: "#94a3b8",        // Slate 400 (Texto Secundário)
        },
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at center, #1e293b 0%, #020617 80%)', // Gradiente radial azul escuro
      },
    },
  },
  plugins: [],
};
export default config;