import "dotenv/config";
import express from "express";
import { checkConnection } from "./db/pool";
import { healthRouter } from "./routes/health";
import { readingsRouter } from "./routes/readings";
import { machinesRouter } from "./routes/machines";
import { alertsRouter } from "./routes/alerts";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use("/health", healthRouter);
app.use("/readings", readingsRouter);
app.use("/machines", machinesRouter);
app.use("/alerts", alertsRouter);
app.use(errorHandler);
app.use(notFoundHandler);

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