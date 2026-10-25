TRUNCATE alerts, readings, rules, sensors, machines RESTART IDENTITY CASCADE;

INSERT INTO machines (name, sector, operational_status) VALUES
('Prensa Hidráulica 01', 'Usinagem', 'running'),
('Esteira Transportadora 02', 'Montagem', 'running'),
('Torno CNC 03', 'Usinagem', 'running');

INSERT INTO sensors (machine_id, type, unit) 
SELECT m.id, t.type, t.unit
FROM machines m
CROSS JOIN (
    VALUES ('temperature', '°C'), ('vibration', 'mm/s')
) AS t(type, unit);

INSERT INTO rules (sensor_id, severity, operator, threshold, active)
SELECT 
    s.id,
    r.severity,
    '>',
    CASE 
        WHEN s.type = 'temperature' AND r.severity = 'warning' THEN 75.0
        WHEN s.type = 'temperature' AND r.severity = 'critical' THEN 90.0
        WHEN s.type = 'vibration' AND r.severity = 'warning' THEN 5.0
        WHEN s.type = 'vibration' AND r.severity = 'critical' THEN 8.0
    END,
    true
FROM sensors s
CROSS JOIN (
    VALUES ('warning'), ('critical')
) AS r(severity);

INSERT INTO readings (sensor_id, value, read_at)
SELECT 
    s.id,
    CASE 
        
        WHEN s.type = 'temperature' AND gs.read_time >= (now() - interval '3 hours') AND gs.read_time <= (now() - interval '2 hours 30 min') THEN 95.5
        WHEN s.type = 'vibration' AND gs.read_time >= (now() - interval '6 hours') AND gs.read_time <= (now() - interval '5 hours 30 min') THEN 6.2  
        WHEN s.type = 'temperature' THEN round((60.0 + (random() * 10))::numeric, 2)
        WHEN s.type = 'vibration' THEN round((2.0 + (random() * 2.5))::numeric, 2)
    END AS value,
    gs.read_time
FROM sensors s
CROSS JOIN generate_series(
    now() - interval '24 hours',
    now(),
    interval '30 minutes'
) AS gs(read_time);

INSERT INTO alerts (rule_id, reading_id, message, created_at, acknowledged_at)
SELECT 
    r.id AS rule_id,
    rd.id AS reading_id,
    format('Alerta [%s]: Sensor %s ultrapassou o limite de %s com valor %s', upper(r.severity), s.type, r.threshold, rd.value) AS message,
    rd.read_at AS created_at,
    CASE 
        WHEN rd.read_at < (now() - interval '4 hours') THEN rd.read_at + interval '10 minutes'
        ELSE NULL 
    END AS acknowledged_at
FROM readings rd
JOIN sensors s ON rd.sensor_id = s.id
JOIN rules r ON r.sensor_id = s.id
WHERE r.active = true 
  AND r.operator = '>' 
  AND rd.value > r.threshold;