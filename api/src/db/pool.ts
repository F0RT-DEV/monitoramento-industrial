import { Pool } from "pg";

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

// Conexões ociosas podem cair quando o banco reinicia.
// Sem este tratamento, o erro derruba a API inteira.
pool.on("error", (error) => {
  console.error("Erro em conexão ociosa do banco:", error.message);
});

export async function checkConnection(): Promise<void> {
  const result = await pool.query<{ db: string }>(
    "SELECT current_database() AS db"
  );
  console.log(`Conectado ao PostgreSQL (banco: ${result.rows[0].db})`);
}