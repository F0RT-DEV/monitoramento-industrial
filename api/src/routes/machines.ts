import { Router } from "express";
import { pool } from "../db/pool";

export const machinesRouter = Router();


machinesRouter.get("/", async (_req, res) => {
  try {
    
    const query = `
      SELECT 
        m.id AS "machineId",
        m.name AS "machineName",
        m.sector,
        m.operational_status AS "operationalStatus",
        m.created_at AS "createdAt",
        s.id AS "sensorId",
        s.type AS "sensorType",
        s.unit,
        rd.value AS "lastValue",
        rd.read_at AS "lastReadAt"
      FROM machines m
      LEFT JOIN sensors s ON m.id = s.machine_id
      LEFT JOIN LATERAL (
        SELECT value, read_at
        FROM readings
        WHERE sensor_id = s.id
        ORDER BY read_at DESC
        LIMIT 1
      ) rd ON true
      ORDER BY m.id, s.id;
    `;

    const result = await pool.query(query);

    
    const machinesMap = new Map();

    for (const row of result.rows) {
      if (!machinesMap.has(row.machineId)) {
        machinesMap.set(row.machineId, {
          id: row.machineId,
          name: row.machineName,
          sector: row.sector,
          operationalStatus: row.operationalStatus,
          createdAt: row.createdAt,
          sensors: [],
        });
      }

      if (row.sensorId) {
        machinesMap.get(row.machineId).sensors.push({
          id: row.sensorId,
          type: row.sensorType,
          unit: row.unit,
          lastReading: row.lastValue !== null ? {
            value: row.lastValue,
            readAt: row.lastReadAt,
          } : null,
        });
      }
    }

    res.json({
      count: machinesMap.size,
      data: Array.from(machinesMap.values()),
    });
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


machinesRouter.get("/:id", async (req, res) => {
  const machineId = Number(req.params.id);

  if (isNaN(machineId) || machineId <= 0) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "O ID da máquina deve ser um número inteiro positivo",
      },
    });
    return;
  }

  try {
    const machineQuery = `
      SELECT 
        id AS "machineId",
        name AS "machineName",
        sector,
        operational_status AS "operationalStatus",
        created_at AS "createdAt"
      FROM machines
      WHERE id = $1;
    `;

    const machineResult = await pool.query(machineQuery, [machineId]);

    if (machineResult.rowCount === 0) {
      res.status(404).json({
        error: {
          code: "MACHINE_NOT_FOUND",
          message: `Máquina com ID ${machineId} não encontrada`,
        },
      });
      return;
    }

    const machine = machineResult.rows[0];

    const sensorsQuery = `
      SELECT 
        id AS "sensorId",
        type,
        unit
      FROM sensors
      WHERE machine_id = $1;
    `;

    const sensorsResult = await pool.query(sensorsQuery, [machineId]);

    res.json({
      ...machine,
      sensors: sensorsResult.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes da máquina:", (error as Error).message);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno ao buscar detalhes da máquina",
      },
    });
  }
});