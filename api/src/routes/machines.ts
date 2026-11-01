import { Router } from "express";
import { z } from "zod";
import { findMachine, listMachines } from "../services/machines";
import { sendValidationError } from "../utils/http-errors";

export const machinesRouter = Router();

// GET /machines: todas as máquinas, com status e última leitura de cada sensor
machinesRouter.get("/", async (_req, res) => {
  try {
    const machines = await listMachines();
    res.json({ count: machines.length, data: machines });
  } catch (error) {
    console.error("Erro ao listar máquinas:", (error as Error).message);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno ao listar as máquinas",
      },
    });
  }
});

// GET /machines/:id: uma máquina, com sensores e regras
const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "id deve ser um número" })
    .int("id deve ser um número inteiro")
    .positive("id deve ser maior que zero"),
});

machinesRouter.get("/:id", async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);

  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  try {
    const machine = await findMachine(parsed.data.id);

    if (!machine) {
      res.status(404).json({
        error: {
          code: "MACHINE_NOT_FOUND",
          message: `Máquina ${parsed.data.id} não existe`,
        },
      });
      return;
    }

    res.json(machine);
  } catch (error) {
    console.error("Erro ao buscar máquina:", (error as Error).message);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno ao buscar a máquina",
      },
    });
  }
});