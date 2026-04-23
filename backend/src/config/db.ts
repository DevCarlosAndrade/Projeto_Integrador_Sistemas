import { Pool } from "pg";

export const pool = new Pool({
  user : "admin",
  host:  "localhost",
  database:  "monitoramento",
  password:  "admin",
  port: 5433,
});