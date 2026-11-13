-- Verificação do simulador (tarefa 4.7)
-- Uso: psql ... -v ultimo_id=NUMERO -f verificacao_simulador.sql
-- ultimo_id = maior id de readings ANTES de rodar o simulador
-- (SELECT max(id) FROM readings;). Assim só entram as leituras da rodada.

-- 1) Quantas leituras cada sensor enviou e como ficaram os valores
SELECT s.id AS sensor, m.name AS maquina, s.type AS tipo,
       count(*)                AS leituras,
       round(min(r.value), 2)  AS minimo,
       round(avg(r.value), 2)  AS media,
       round(max(r.value), 2)  AS maximo
FROM readings r
JOIN sensors s  ON s.id = r.sensor_id
JOIN machines m ON m.id = s.machine_id
WHERE r.id > :ultimo_id
GROUP BY s.id, m.name, s.type
ORDER BY s.id;

-- 2) Maior intervalo entre duas leituras seguidas de cada sensor (procura buracos)
SELECT sensor_id AS sensor, max(read_at - anterior) AS maior_intervalo
FROM (
  SELECT sensor_id, read_at,
         lag(read_at) OVER (PARTITION BY sensor_id ORDER BY read_at) AS anterior
  FROM readings
  WHERE id > :ultimo_id
) t
GROUP BY sensor_id
ORDER BY sensor_id;

-- 3) Leituras que violaram alguma regra (as anomalias injetadas)
SELECT s.id AS sensor, ru.severity AS severidade, count(*) AS leituras
FROM readings r
JOIN sensors s ON s.id = r.sensor_id
JOIN rules ru  ON ru.sensor_id = s.id
              AND ru.active
              AND ((ru.operator = '>' AND r.value > ru.threshold)
                OR (ru.operator = '<' AND r.value < ru.threshold))
WHERE r.id > :ultimo_id
GROUP BY s.id, ru.severity
ORDER BY s.id, ru.severity;

-- 4) Valores impossíveis (deve dar 0)
SELECT count(*) AS valores_negativos
FROM readings
WHERE id > :ultimo_id AND value < 0;