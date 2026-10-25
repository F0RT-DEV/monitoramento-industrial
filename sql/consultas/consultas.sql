SELECT
    m.name AS machine_name,
    s.type AS sensor_type,
    rd.value,
    s.unit,
    rd.read_at
FROM (
    SELECT DISTINCT ON (sensor_id)
        sensor_id, value, read_at
    FROM readings
    ORDER BY sensor_id, read_at DESC
) rd
JOIN sensors s ON rd.sensor_id = s.id
JOIN machines m ON s.machine_id = m.id
ORDER BY m.name, s.type;


SELECT
    date_trunc('hour', rd.read_at) AS hour_bucket,
    round(avg(rd.value), 2) AS avg_value,
    s.unit,
    m.name AS machine_name,
    s.type AS sensor_type
FROM readings rd
JOIN sensors s ON rd.sensor_id = s.id
JOIN machines m ON s.machine_id = m.id
WHERE m.name = 'Prensa Hidráulica 01'
  AND s.type = 'temperature'
  AND rd.read_at >= now() - interval '24 hours'
GROUP BY hour_bucket, s.unit, m.name, s.type
ORDER BY hour_bucket DESC;


SELECT
    a.id AS alert_id,
    m.name AS machine_name,
    s.type AS sensor_type,
    r.severity,
    a.message,
    a.created_at
FROM alerts a
JOIN rules r ON a.rule_id = r.id
JOIN sensors s ON r.sensor_id = s.id
JOIN machines m ON s.machine_id = m.id
WHERE a.acknowledged_at IS NULL
ORDER BY
    CASE r.severity WHEN 'critical' THEN 1 ELSE 2 END,
    a.created_at DESC;


SELECT
    m.id,
    m.name AS machine_name,
    m.sector,
    max(rd.read_at) AS last_reading_at
FROM machines m
LEFT JOIN sensors s ON m.id = s.machine_id
LEFT JOIN readings rd ON s.id = rd.sensor_id
GROUP BY m.id, m.name, m.sector
HAVING max(rd.read_at) < now() - interval '45 minutes'
    OR max(rd.read_at) IS NULL;


SELECT
    m.name AS machine_name,
    r.severity,
    count(a.id) AS total_alerts
FROM alerts a
JOIN rules r ON a.rule_id = r.id
JOIN sensors s ON r.sensor_id = s.id
JOIN machines m ON s.machine_id = m.id
WHERE a.created_at >= now() - interval '24 hours'
GROUP BY m.name, r.severity
ORDER BY m.name,
    CASE r.severity WHEN 'critical' THEN 1 ELSE 2 END;