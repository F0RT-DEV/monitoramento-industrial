import { Router } from "express";
import { z } from "zod";
import { acknowledgeAlert, listAlerts } from "../services/alerts";
import { AppError, parseOrThrow } from "../utils/errors";

export const alertsRouter = Router();

const listAlertsSchema = z.object({
  status: z
    .enum(["open", "acknowledged"], {
      error: "status deve ser 'open' ou 'acknowledged'",
    })
    .optional(),
  limit: z.coerce
    .number({ error: "limit deve ser um número" })
    .int("limit deve ser um número inteiro")
    .min(1, "limit deve ser no mínimo 1")
    .max(1000, "limit deve ser no máximo 1000")
    .default(100),
});

alertsRouter.get("/", async (req, res) => {
  const { status, limit } = parseOrThrow(listAlertsSchema, req.query);

  const alerts = await listAlerts(status, limit);
  res.json({ count: alerts.length, data: alerts });
});


const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "id deve ser um número" })
    .int("id deve ser um número inteiro")
    .positive("id deve ser maior que zero"),
});

alertsRouter.patch("/:id/ack", async (req, res) => {
  const { id } = parseOrThrow(idParamSchema, req.params);

  const alert = await acknowledgeAlert(id);

  if (!alert) {
    throw new AppError(404, "ALERT_NOT_FOUND", `Alerta ${id} não existe`);
  }

  res.json(alert);
});