import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/errors";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Rota ${req.method} ${req.path} não encontrada`,
    },
  });
};


export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined && { details: error.details }),
      },
    });
    return;
  }

  const type = (error as { type?: string }).type;

  if (type === "entity.parse.failed") {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "O corpo da requisição não é um JSON válido",
      },
    });
    return;
  }

  if (type === "entity.too.large") {
    res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "O corpo da requisição é grande demais",
      },
    });
    return;
  }

  console.error("Erro não tratado:", error);

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Erro interno do servidor",
    },
  });
};