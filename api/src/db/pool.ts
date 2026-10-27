import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Variável DATABASE_URL não definida. Crie o arquivo api/.env (veja api/.env.example)."
  );
}

export const pool = new Pool({ connectionString });

export async function checkConnection(): Promise<void> {
  const result = await pool.query<{ db: string }>(
    "SELECT current_database() AS db"
  );
  console.log(`Conectado ao PostgreSQL (banco: ${result.rows[0].db})`);
}