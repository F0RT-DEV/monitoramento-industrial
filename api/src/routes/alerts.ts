import { Router } from "express";
import { z } from "zod";
import { acknowledgeAlert, listAlerts } from "../services/alerts";
import { sendValidationError } from "../utils/http-errors";

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
  const parsed = listAlertsSchema.safeParse(req.query);

  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  try {
    const alerts = await listAlerts(parsed.data.status, parsed.data.limit);
    res.json({ count: alerts.length, data: alerts });
  } catch (error) {
    console.error("Erro ao listar alertas:", (error as Error).message);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno ao listar os alertas",
      },
    });
  }
});


const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "id deve ser um número" })
    .int("id deve ser um número inteiro")
    .positive("id deve ser maior que zero"),
});

alertsRouter.patch("/:id/ack", async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);

  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  try {
    const alert = await acknowledgeAlert(parsed.data.id);

    if (!alert) {
      res.status(404).json({
        error: {
          code: "ALERT_NOT_FOUND",
          message: `Alerta ${parsed.data.id} não existe`,
        },
      });
      return;
    }

    res.json(alert);
  } catch (error) {
    console.error("Erro ao reconhecer alerta:", (error as Error).message);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno ao reconhecer o alerta",
      },
    });
  }
});