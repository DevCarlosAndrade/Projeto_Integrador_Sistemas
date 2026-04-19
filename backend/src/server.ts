import express from "express";
import cors from "cors";
import uploadRoute from "./routes/upload";
import databaseRoutes from "./routes/database";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/upload", uploadRoute);
app.use("/databases", databaseRoutes);

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});