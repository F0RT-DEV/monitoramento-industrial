import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { AppError, parseOrThrow } from "../utils/errors";

export const readingsRouter = Router();

const createReadingSchema = z.object(
  {
    sensorId: z
      .number({ error: "sensorId deve ser um número" })
      .int("sensorId deve ser um número inteiro")
      .positive("sensorId deve ser maior que zero"),
    value: z.number({ error: "value deve ser um número" }),
    readAt: z.iso
      .datetime({
        offset: true,
        error: "readAt deve ser uma data ISO 8601, ex.: 2026-10-28T15:00:00Z",
      })
      .optional(),
  },
  { error: "O corpo da requisição deve ser um JSON com sensorId e value" }
);

readingsRouter.post("/", async (req, res) => {
  const { sensorId, value, readAt } = parseOrThrow(createReadingSchema, req.body);

  try {
    const result = await pool.query(
      `INSERT INTO readings (sensor_id, value, read_at)
       VALUES ($1, $2, COALESCE($3::timestamptz, now()))
       RETURNING id, sensor_id AS "sensorId", value, read_at AS "readAt"`,
      [sensorId, value, readAt ?? null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    
    if ((error as { code?: string }).code === "23503") {
      throw new AppError(404, "SENSOR_NOT_FOUND", `Sensor ${sensorId} não existe`);
    }

    throw error;
  }
});


const listReadingsSchema = z
  .object({
    sensorId: z.coerce
      .number({ error: "sensorId é obrigatório e deve ser um número" })
      .int("sensorId deve ser um número inteiro")
      .positive("sensorId deve ser maior que zero"),
    from: z.iso
      .datetime({
        offset: true,
        error: "from deve ser uma data ISO 8601, ex.: 2026-10-28T00:00:00Z",
      })
      .optional(),
    to: z.iso
      .datetime({
        offset: true,
        error: "to deve ser uma data ISO 8601, ex.: 2026-10-29T00:00:00Z",
      })
      .optional(),
    limit: z.coerce
      .number({ error: "limit deve ser um número" })
      .int("limit deve ser um número inteiro")
      .min(1, "limit deve ser no mínimo 1")
      .max(1000, "limit deve ser no máximo 1000")
      .default(100),
  })
  .refine((q) => !q.from || !q.to || new Date(q.from) <= new Date(q.to), {
    error: "from deve ser anterior ou igual a to",
    path: ["from"],
  });

readingsRouter.get("/", async (req, res) => {
  const { sensorId, from, to, limit } = parseOrThrow(listReadingsSchema, req.query);

  const sensor = await pool.query("SELECT 1 FROM sensors WHERE id = $1", [sensorId]);

  if (sensor.rowCount === 0) {
    throw new AppError(404, "SENSOR_NOT_FOUND", `Sensor ${sensorId} não existe`);
  }

  const conditions = ["sensor_id = $1"];
  const params: unknown[] = [sensorId];

  if (from) {
    params.push(from);
    conditions.push(`read_at >= $${params.length}`);
  }

  if (to) {
    params.push(to);
    conditions.push(`read_at <= $${params.length}`);
  }

  params.push(limit);

  const result = await pool.query(
    `SELECT id, sensor_id AS "sensorId", value, read_at AS "readAt"
     FROM readings
     WHERE ${conditions.join(" AND ")}
     ORDER BY read_at DESC
     LIMIT $${params.length}`,
    params
  );

  res.json({ count: result.rowCount, data: result.rows });
});