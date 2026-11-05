import { Router } from "express";
import { z } from "zod";
import { findMachine, listMachines, updateMachineStatus } from "../services/machines";
import { AppError, parseOrThrow } from "../utils/errors";

export const machinesRouter = Router();

// GET /machines: todas as máquinas, com status e última leitura de cada sensor
machinesRouter.get("/", async (_req, res) => {
  const machines = await listMachines();
  res.json({ count: machines.length, data: machines });
});

// GET /machines/:id: uma máquina, com sensores e regras
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

// PATCH /machines/:id/status: troca o status operacional da máquina
const updateStatusSchema = z.object({
  status: z.enum(["running", "stopped", "maintenance"], {
    error: "status deve ser 'running', 'stopped' ou 'maintenance'",
  }),
});

machinesRouter.patch("/:id/status", async (req, res) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const { status } = parseOrThrow(updateStatusSchema, req.body);

  const machine = await updateMachineStatus(id, status);

  if (!machine) {
    throw new AppError(404, "MACHINE_NOT_FOUND", `Máquina ${id} não existe`);
  }

  res.json(machine);
});