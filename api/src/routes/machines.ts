import { Router } from "express";
import { z } from "zod";
import { findMachine, listMachines } from "../services/machines";
import { AppError, parseOrThrow } from "../utils/errors";

export const machinesRouter = Router();

machinesRouter.get("/", async (_req, res) => {
  const machines = await listMachines();
  res.json({ count: machines.length, data: machines });
});

const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "id deve ser um número" })
    .int("id deve ser um número inteiro")
    .positive("id deve ser maior que zero"),
});

machinesRouter.get("/:id", async (req, res) => {
  const { id } = parseOrThrow(idParamSchema, req.params);

  const machine = await findMachine(id);

  if (!machine) {
    throw new AppError(404, "MACHINE_NOT_FOUND", `Máquina ${id} não existe`);
  }

  res.json(machine);
});