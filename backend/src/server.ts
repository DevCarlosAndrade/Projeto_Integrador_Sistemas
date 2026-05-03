import "dotenv/config";
import express from "express";
import cors from "cors";
import queryRoutes from "./routes/queries";
import aiRoutes from "./routes/ai";
import { ensureStatsTable } from "./config/db";

const app = express();

//middlewares
app.use(cors());
// limite aumentado pra aguentar o import de bases SQLite pro Postgres
app.use(express.json({ limit: "100mb" }));

//rotas
app.use("/queries", queryRoutes);
app.use("/ai", aiRoutes);

//rota teste
app.get("/", (req, res) => {
  res.send("API rodando");
});

const PORT = 3002;

//pro Docker
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Backend rodando na porta ${PORT}`);
  try {
    await ensureStatsTable();
  } catch (err) {
    console.error("[startup] falha ao garantir editor_query_stats:", err);
  }
});
