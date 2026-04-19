import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM uploaded_databases ORDER BY created_at DESC"
    );

    return res.json(result.rows);

  } catch (err: any) {
    console.error("ERRO:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;