import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";

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
  const parsed = createReadingSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  const { sensorId, value, readAt } = parsed.data;

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
      res.status(404).json({
        error: {
          code: "SENSOR_NOT_FOUND",
          message: `Sensor ${sensorId} não existe`,
        },
      });
      return;
    }

    console.error("Erro ao gravar leitura:", (error as Error).message);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno ao gravar a leitura",
      },
    });
  }
});