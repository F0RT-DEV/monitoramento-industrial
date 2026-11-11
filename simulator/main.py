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
                    # fase aleatória: cada sensor sobe e desce em um momento diferente
                    "fase": random.uniform(0, 2 * math.pi),
                }
            )
    return sensores


def gerar_valor(perfil, passo, fase):
    onda = perfil["variacao"] * math.sin(passo / 10 + fase)
    ruido = random.gauss(0, perfil["ruido"])
    return round(perfil["base"] + onda + ruido, 2)


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

    try:
        sensores = buscar_sensores(api_url)
    except requests.exceptions.RequestException as erro:
        print(f"Não consegui buscar os sensores na API: {erro}")
        return

    # só simula sensores que tenham um perfil na configuração
    sensores = [s for s in sensores if s["tipo"] in perfis]
    print(f"{len(sensores)} sensores, {config['ciclos']} ciclos. Ctrl+C para parar.")

    try:
        for ciclo in range(config["ciclos"]):
            for sensor in sensores:
                valor = gerar_valor(perfis[sensor["tipo"]], ciclo, sensor["fase"])

                try:
                    status = enviar_leitura(api_url, sensor["id"], valor)
                    print(
                        f"[ciclo {ciclo + 1}] {sensor['maquina']} / "
                        f"{sensor['tipo']} (id {sensor['id']}): {valor} -> {status}"
                    )
                except requests.exceptions.RequestException as erro:
                    print(f"[ciclo {ciclo + 1}] sensor {sensor['id']}: falha ao enviar ({erro})")

            time.sleep(config["intervalo"])
    except KeyboardInterrupt:
        print("\nParado.")


if __name__ == "__main__":
    main()