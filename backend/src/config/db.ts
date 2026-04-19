import { Pool } from "pg";

export const pool = new Pool({
  user: "admin",
  host: "postgres",
  database: "monitoramento",
  password: "admin",
  port: 5432,
});
