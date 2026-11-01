import { pool } from "../db/pool";

type AlertLevel = "normal" | "warning" | "critical";

interface MachineRow {
  id: number;
  name: string;
  sector: string | null;
  operationalStatus: string;
  createdAt: Date;
}

interface SensorRow {
  id: number;
  machineId: number;
  type: string;
  unit: string;
  lastValue: number | null;
  lastReadAt: Date | null;
}

interface AlertSummaryRow {
  machineId: number;
  openAlerts: number;
  hasCritical: boolean;
}

interface RuleRow {
  id: number;
  sensorId: number;
  severity: string;
  operator: string;
  threshold: number;
  active: boolean;
}

// Carrega máquinas (todas, ou só uma) com sensores, última leitura e nível de alerta.
// $1 NULL = sem filtro; $1 preenchido = só aquela máquina.
async function loadMachines(machineId: number | null) {
  const machines = await pool.query<MachineRow>(
    `SELECT id, name, sector,
            operational_status AS "operationalStatus",
            created_at AS "createdAt"
     FROM machines
     WHERE ($1::bigint IS NULL OR id = $1)
     ORDER BY name`,
    [machineId]
  );

  // LATERAL: para cada sensor, busca só a leitura mais recente (usa o índice
  // de readings e continua rápido mesmo com muitas leituras).
  const sensors = await pool.query<SensorRow>(
    `SELECT s.id, s.machine_id AS "machineId", s.type, s.unit,
            lr.value AS "lastValue", lr.read_at AS "lastReadAt"
     FROM sensors s
     LEFT JOIN LATERAL (
       SELECT r.value, r.read_at
       FROM readings r
       WHERE r.sensor_id = s.id
       ORDER BY r.read_at DESC
       LIMIT 1
     ) lr ON true
     WHERE ($1::bigint IS NULL OR s.machine_id = $1)
     ORDER BY s.machine_id, s.type`,
    [machineId]
  );

  // Alertas abertos (acknowledged_at IS NULL) por máquina
  const alerts = await pool.query<AlertSummaryRow>(
    `SELECT s.machine_id AS "machineId",
            count(*) AS "openAlerts",
            bool_or(ru.severity = 'critical') AS "hasCritical"
     FROM alerts a
     JOIN rules ru ON ru.id = a.rule_id
     JOIN sensors s ON s.id = ru.sensor_id
     WHERE a.acknowledged_at IS NULL
       AND ($1::bigint IS NULL OR s.machine_id = $1)
     GROUP BY s.machine_id`,
    [machineId]
  );

  const alertsByMachine = new Map(alerts.rows.map((row) => [row.machineId, row]));

  return machines.rows.map((machine) => {
    const summary = alertsByMachine.get(machine.id);

    // O nível do painel não é guardado: é calculado a partir dos alertas abertos
    let alertLevel: AlertLevel = "normal";
    if (summary) {
      alertLevel = summary.hasCritical ? "critical" : "warning";
    }

    return {
      ...machine,
      alertLevel,
      openAlerts: summary?.openAlerts ?? 0,
      sensors: sensors.rows
        .filter((sensor) => sensor.machineId === machine.id)
        .map((sensor) => ({
          id: sensor.id,
          type: sensor.type,
          unit: sensor.unit,
          lastReading:
            sensor.lastReadAt === null
              ? null
              : { value: sensor.lastValue, readAt: sensor.lastReadAt },
        })),
    };
  });
}

export async function listMachines() {
  return loadMachines(null);
}

// Uma máquina, com as regras de cada sensor. Devolve null se não existir.
export async function findMachine(id: number) {
  const [machine] = await loadMachines(id);

  if (!machine) {
    return null;
  }

  const sensorIds = machine.sensors.map((sensor) => sensor.id);

  const rules = await pool.query<RuleRow>(
    `SELECT id, sensor_id AS "sensorId", severity, operator, threshold, active
     FROM rules
     WHERE sensor_id = ANY($1::bigint[])
     ORDER BY sensor_id, severity, operator`,
    [sensorIds]
  );

  return {
    ...machine,
    sensors: machine.sensors.map((sensor) => ({
      ...sensor,
      rules: rules.rows
        .filter((rule) => rule.sensorId === sensor.id)
        .map(({ id, severity, operator, threshold, active }) => ({
          id,
          severity,
          operator,
          threshold,
          active,
        })),
    })),
  };
}