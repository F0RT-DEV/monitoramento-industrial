import type { Response } from "express";
import type { z } from "zod";

// Resposta padrão para dados inválidos (400)
export function sendValidationError(res: Response, error: z.ZodError) {
  res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    },
  });
}