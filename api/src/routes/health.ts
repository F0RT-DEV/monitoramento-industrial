import { Router } from "express";
import { pool } from "../db/pool";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "up" });
  } catch (error) {
    console.error("Health check falhou:", (error as Error).message);
    res.status(503).json({ status: "error", database: "down" });
  }
});