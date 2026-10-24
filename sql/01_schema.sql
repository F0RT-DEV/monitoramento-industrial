DROP TABLE IF EXISTS alerts, readings, rules, sensors, machines;

CREATE TABLE machines (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name               text        NOT NULL UNIQUE,
  sector             text,
  operational_status text        NOT NULL DEFAULT 'running',
  created_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT machines_operational_status_chk
    CHECK (operational_status IN ('running', 'stopped', 'maintenance'))
);

CREATE TABLE sensors (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  machine_id bigint NOT NULL REFERENCES machines (id),
  type       text   NOT NULL,
  unit       text   NOT NULL,

  CONSTRAINT sensors_machine_type_uq UNIQUE (machine_id, type),
  CONSTRAINT sensors_type_chk
    CHECK (type IN ('temperature', 'vibration'))
);

CREATE TABLE rules (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sensor_id bigint  NOT NULL REFERENCES sensors (id),
  severity  text    NOT NULL,
  operator  text    NOT NULL,
  threshold numeric NOT NULL,
  active    boolean NOT NULL DEFAULT true,

  CONSTRAINT rules_sensor_severity_operator_uq
    UNIQUE (sensor_id, severity, operator),
  CONSTRAINT rules_severity_chk
    CHECK (severity IN ('warning', 'critical')),
  CONSTRAINT rules_operator_chk
    CHECK (operator IN ('>', '<'))
);

CREATE TABLE readings (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sensor_id bigint      NOT NULL REFERENCES sensors (id),
  value     numeric     NOT NULL,
  read_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rule_id         bigint      NOT NULL REFERENCES rules (id),
  reading_id      bigint      NOT NULL REFERENCES readings (id),
  message         text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,

  CONSTRAINT alerts_rule_reading_uq UNIQUE (rule_id, reading_id),
  CONSTRAINT alerts_ack_after_created_chk
    CHECK (acknowledged_at IS NULL OR acknowledged_at >= created_at)
);

CREATE INDEX idx_readings_sensor_read_at
  ON readings (sensor_id, read_at DESC);

CREATE INDEX idx_alerts_open
  ON alerts (created_at DESC)
  WHERE acknowledged_at IS NULL;

CREATE INDEX idx_alerts_reading_id
  ON alerts (reading_id);