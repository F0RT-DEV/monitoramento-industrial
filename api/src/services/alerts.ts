import { pool } from "../db/pool";

export type AlertStatus = "open" | "acknowledged";

interface AlertRow {
  id: number;
  message: string;
  createdAt: Date;
  acknowledgedAt: Date | null;
  ruleId: number;
  severity: string;
  operator: string;
  threshold: number;
  sensorId: number;
  sensorType: string;
  unit: string;
  machineId: number;
  machineName: string;
  readingId: number;
  readingValue: number;
  readingAt: Date;
}


const ALERT_SELECT = `
  SELECT a.id, a.message,
         a.created_at AS "createdAt",
         a.acknowledged_at AS "acknowledgedAt",
         ru.id AS "ruleId", ru.severity, ru.operator, ru.threshold,
         s.id AS "sensorId", s.type AS "sensorType", s.unit,
         m.id AS "machineId", m.name AS "machineName",
         rd.id AS "readingId", rd.value AS "readingValue", rd.read_at AS "readingAt"
  FROM alerts a
  JOIN rules ru ON ru.id = a.rule_id
  JOIN sensors s ON s.id = ru.sensor_id
  JOIN machines m ON m.id = s.machine_id
  JOIN readings rd ON rd.id = a.reading_id
`;


function toAlert(row: AlertRow) {
  return {
    id: row.id,
    status: row.acknowledgedAt === null ? "open" : "acknowledged",
    severity: row.severity,
    message: row.message,
    createdAt: row.createdAt,
    acknowledgedAt: row.acknowledgedAt,
    machine: { id: row.machineId, name: row.machineName },
    sensor: { id: row.sensorId, type: row.sensorType, unit: row.unit },
    rule: {
      id: row.ruleId,
      operator: row.operator,
      threshold: row.threshold,
    },
    reading: {
      id: row.readingId,
      value: row.readingValue,
      readAt: row.readingAt,
    },
  };
}

export async function listAlerts(status: AlertStatus | undefined, limit: number) {
 
  const conditions: string[] = [];

  if (status === "open") {
    conditions.push("a.acknowledged_at IS NULL");
  } else if (status === "acknowledged") {
    conditions.push("a.acknowledged_at IS NOT NULL");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query<AlertRow>(
    `${ALERT_SELECT}
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(toAlert);
}

export async function findAlert(id: number) {
  const result = await pool.query<AlertRow>(`${ALERT_SELECT} WHERE a.id = $1`, [id]);
  return result.rows[0] ? toAlert(result.rows[0]) : null;
}


export async function acknowledgeAlert(id: number) {
  const updated = await pool.query(
    `UPDATE alerts
     SET acknowledged_at = COALESCE(acknowledged_at, now())
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  if (updated.rowCount === 0) {
    return null;
  }

  return findAlert(id);
}