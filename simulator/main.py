import itertools
import json
import math
import os
import random
import time

import requests


def carregar_config(caminho="config.json"):
    with open(caminho, encoding="utf-8") as arquivo:
        return json.load(arquivo)


def ler_numero(nome, padrao, tipo, minimo):
    # Lê uma variável de ambiente. Se não existir, usa o valor padrão da config.
    texto = os.getenv(nome)
    if texto is None or texto == "":
        return padrao
    try:
        valor = tipo(texto)
    except ValueError:
        raise SystemExit(f"{nome} inválida: '{texto}' não é um número válido.")
    if valor < minimo:
        raise SystemExit(f"{nome} inválida: precisa ser pelo menos {minimo}.")
    return valor


def buscar_sensores(api_url, num_maquinas=None):
    # A lista de sensores vem da própria API (GET /machines)
    resposta = requests.get(f"{api_url}/machines", timeout=5)
    resposta.raise_for_status()

    maquinas = resposta.json()["data"]
    if num_maquinas is not None:
        maquinas = maquinas[:num_maquinas]

    sensores = []
    for maquina in maquinas:
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
    perfis = config["perfis"]
    anomalias = config["anomalias"]

    # Variáveis de ambiente têm prioridade sobre o config.json
    api_url = os.getenv("API_URL") or config["api_url"]
    intervalo = ler_numero("INTERVALO", config["intervalo"], float, 0)
    ciclos = ler_numero("CICLOS", config["ciclos"], int, 0)  # 0 = não para
    num_maquinas = ler_numero("NUM_MAQUINAS", None, int, 1)  # vazio = todas

    try:
        sensores = buscar_sensores(api_url, num_maquinas)
    except requests.exceptions.RequestException as erro:
        print(f"Não consegui buscar os sensores na API: {erro}")
        return

    sensores = [s for s in sensores if s["tipo"] in perfis]
    duracao = f"{ciclos} ciclos" if ciclos > 0 else "sem limite de ciclos"
    print(f"API {api_url} | {len(sensores)} sensores | {duracao} | intervalo {intervalo}s. Ctrl+C para parar.")

    try:
        for ciclo in (range(ciclos) if ciclos > 0 else itertools.count()):
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

            time.sleep(intervalo)
    except KeyboardInterrupt:
        print("\nParado.")


if __name__ == "__main__":
    main()