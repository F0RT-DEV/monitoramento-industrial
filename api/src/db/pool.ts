import { Pool, types } from "pg";

types.setTypeParser(types.builtins.INT8, (value) => Number(value));
types.setTypeParser(types.builtins.NUMERIC, (value) => Number(value));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Variável DATABASE_URL não definida. Crie o arquivo api/.env (veja api/.env.example)."
  );
}

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 3000,
});


pool.on("error", (error) => {
  console.error("Erro em conexão ociosa do banco:", error.message);
});

export async function checkConnection(): Promise<void> {
  const result = await pool.query<{ db: string }>(
    "SELECT current_database() AS db"
  );
  console.log(`Conectado ao PostgreSQL (banco: ${result.rows[0].db})`);
}