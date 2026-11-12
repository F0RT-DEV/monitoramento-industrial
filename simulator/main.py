import json
import math
import random
import time

import requests


def carregar_config(caminho="config.json"):
    with open(caminho, encoding="utf-8") as arquivo:
        return json.load(arquivo)


def buscar_sensores(api_url):
    # A lista de sensores vem da própria API (GET /machines)
    resposta = requests.get(f"{api_url}/machines", timeout=5)
    resposta.raise_for_status()

    sensores = []
    for maquina in resposta.json()["data"]:
        for sensor in maquina["sensors"]:
            sensores.append(
                {
                    "id": sensor["id"],
                    "tipo": sensor["type"],
                    "maquina": maquina["name"],
                    "fase": random.uniform(0, 2 * math.pi),
                    # estado da anomalia: quantos ciclos faltam e quanto ela soma ao valor
                    "anomalia_restante": 0,
                    "anomalia_delta": 0.0,
                }
            )
    return sensores


def gerar_valor(perfil, passo, sensor, anomalias):
    onda = perfil["variacao"] * math.sin(passo / 10 + sensor["fase"])
    ruido = random.gauss(0, perfil["ruido"])
    valor = perfil["base"] + onda + ruido

    # Anomalia: começa por sorteio e dura alguns ciclos seguidos
    if sensor["anomalia_restante"] == 0 and random.random() < anomalias["probabilidade"]:
        sensor["anomalia_restante"] = random.randint(
            anomalias["duracao_min"], anomalias["duracao_max"]
        )
        faixa = perfil["anomalia"]
        sensor["anomalia_delta"] = random.uniform(faixa["delta_min"], faixa["delta_max"])

    em_anomalia = sensor["anomalia_restante"] > 0
    if em_anomalia:
        valor += sensor["anomalia_delta"]
        sensor["anomalia_restante"] -= 1

    return round(max(valor, 0), 2), em_anomalia


def enviar_leitura(api_url, sensor_id, valor):
    resposta = requests.post(
        f"{api_url}/readings",
        json={"sensorId": sensor_id, "value": valor},
        timeout=5,
    )
    return resposta.status_code


def main():
    config = carregar_config()
    api_url = config["api_url"]
    perfis = config["perfis"]
    anomalias = config["anomalias"]

    try:
        sensores = buscar_sensores(api_url)
    except requests.exceptions.RequestException as erro:
        print(f"Não consegui buscar os sensores na API: {erro}")
        return

    sensores = [s for s in sensores if s["tipo"] in perfis]
    print(f"{len(sensores)} sensores, {config['ciclos']} ciclos. Ctrl+C para parar.")

    try:
        for ciclo in range(config["ciclos"]):
            for sensor in sensores:
                valor, em_anomalia = gerar_valor(perfis[sensor["tipo"]], ciclo, sensor, anomalias)
                marca = "  <-- ANOMALIA" if em_anomalia else ""

                try:
                    status = enviar_leitura(api_url, sensor["id"], valor)
                    print(
                        f"[ciclo {ciclo + 1}] {sensor['maquina']} / "
                        f"{sensor['tipo']} (id {sensor['id']}): {valor} -> {status}{marca}"
                    )
                except requests.exceptions.RequestException as erro:
                    print(f"[ciclo {ciclo + 1}] sensor {sensor['id']}: falha ao enviar ({erro})")

            time.sleep(config["intervalo"])
    except KeyboardInterrupt:
        print("\nParado.")


if __name__ == "__main__":
    main()