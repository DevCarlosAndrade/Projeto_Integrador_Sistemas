import { Router } from "express";
import { pool } from "../config/db";

const router = Router();

//pega so o top 10 de queries mais lentas, talvez seja interessante criar um endpoint pra pegar as queries mais frequentes, ou as que mais gastam tempo total, etc
router.get("/slow", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        query,
        calls,
        total_exec_time,
        mean_exec_time
      FROM pg_stat_statements
      ORDER BY mean_exec_time DESC
      LIMIT 10;
    `);

    res.json(result.rows);

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;