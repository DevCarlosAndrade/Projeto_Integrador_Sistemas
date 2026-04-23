import express from "express";
import cors from "cors";
import queryRoutes from "./routes/queries";

const app = express();

//middlewares
app.use(cors());
app.use(express.json());

//rotas
app.use("/queries", queryRoutes);

//rota teste
app.get("/", (req, res) => {
  res.send("API rodando");
});

const PORT = 3002;

//pro Docker
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend rodando na porta ${PORT}`);
});