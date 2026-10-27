import "dotenv/config";
import express from "express";
import { checkConnection } from "./db/pool";
import { healthRouter } from "./routes/health";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use("/health", healthRouter);

async function start() {
  try {
    await checkConnection();
  } catch (error) {
    console.error("Não foi possível conectar ao banco:", (error as Error).message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
  });
}

start();