import { Router, Request, Response } from "express";
import multer from "multer";
// @ts-ignore
import initSqlJs from "sql.js";
import { pool } from "../config/db";

const router = Router();
const upload = multer();

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.Multer.File;

    if (!file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const SQL = await initSqlJs({
      locateFile: (file: string) => require.resolve(`sql.js/dist/${file}`)
    });

    const db = new SQL.Database(new Uint8Array(file.buffer));

    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table';");

    const tabelas = result[0]
      ? result[0].values.map((v: any[]) => v[0])
      : [];

    //salvando no pg
    await pool.query(
      "INSERT INTO uploaded_databases (name, tables) VALUES ($1, $2)",
      [file.originalname, JSON.stringify(tabelas)]
    );

    return res.json({
      success: true,
      tabelas
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao processar arquivo" });
  }
});

export default router;