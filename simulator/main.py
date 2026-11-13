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


def requisitar(metodo, url, retry, **kwargs):
    
    tentativas = retry["tentativas"]
    motivo = ""

    for tentativa in range(1, tentativas + 1):
        try:
            resposta = requests.request(metodo, url, timeout=5, **kwargs)
            if resposta.status_code < 500:
                return resposta
            motivo = f"HTTP {resposta.status_code}"
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as erro:
            motivo = type(erro).__name__

        if tentativa < tentativas:
            espera = retry["espera"] * 2 ** (tentativa - 1)  
            print(f"  falhou ({motivo}). Tentativa {tentativa}/{tentativas}, nova em {espera}s")
            time.sleep(espera)

    raise requests.exceptions.RequestException(f"{motivo} depois de {tentativas} tentativas")


def buscar_sensores(api_url, retry, num_maquinas=None):
    
    resposta = requisitar("GET", f"{api_url}/machines", retry)
    resposta.raise_for_status()

    lista = resposta.json()["data"]
    if num_maquinas is not None:
        lista = lista[:num_maquinas]

    maquinas = {}
    sensores = []
    for maquina in lista:
        maquinas[maquina["id"]] = {
            "id": maquina["id"],
            "nome": maquina["name"],
            "status": maquina["operationalStatus"],
            
            "restante": 1,
        }
        for sensor in maquina["sensors"]:
            sensores.append(
                {
                    "id": sensor["id"],
                    "tipo": sensor["type"],
                    "maquina_id": maquina["id"],
                    "maquina": maquina["name"],
                    "fase": random.uniform(0, 2 * math.pi),
                    "anomalia_restante": 0,
                    "anomalia_delta": 0.0,
                }
            )
    return maquinas, sensores


def gerar_valor(perfil, passo, sensor, anomalias):
    onda = perfil["variacao"] * math.sin(passo / 10 + sensor["fase"])
    ruido = random.gauss(0, perfil["ruido"])
    valor = perfil["base"] + onda + ruido

    
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


def enviar_leitura(api_url, retry, sensor_id, valor):
    resposta = requisitar(
        "POST",
        f"{api_url}/readings",
        retry,
        json={"sensorId": sensor_id, "value": valor},
    )
    return resposta.status_code


def trocar_status(api_url, retry, maquina, novo_status, ciclo):
    
    try:
        resposta = requisitar(
            "PATCH",
            f"{api_url}/machines/{maquina['id']}/status",
            retry,
            json={"status": novo_status},
        )
    except requests.exceptions.RequestException as erro:
        print(f"[ciclo {ciclo}] {maquina['nome']}: não consegui mudar o status ({erro})")
        return

    if resposta.status_code == 200:
        maquina["status"] = novo_status
        print(f"[ciclo {ciclo}] {maquina['nome']} -> status {novo_status}")
    else:
        print(f"[ciclo {ciclo}] {maquina['nome']}: API recusou o status ({resposta.status_code})")


def atualizar_status(api_url, retry, maquina, config_status, ciclo):
    if maquina["status"] == "running":
        
        if random.random() < config_status["probabilidade"]:
            maquina["restante"] = random.randint(
                config_status["duracao_min"], config_status["duracao_max"]
            )
            trocar_status(api_url, retry, maquina, random.choice(["stopped", "maintenance"]), ciclo)
    else:
        
        maquina["restante"] -= 1
        if maquina["restante"] <= 0:
            trocar_status(api_url, retry, maquina, "running", ciclo)


def main():
    config = carregar_config()
    perfis = config["perfis"]
    anomalias = config["anomalias"]
    config_status = config["status_maquina"]

    
    api_url = os.getenv("API_URL") or config["api_url"]
    intervalo = ler_numero("INTERVALO", config["intervalo"], float, 0)
    ciclos = ler_numero("CICLOS", config["ciclos"], int, 0)  
    num_maquinas = ler_numero("NUM_MAQUINAS", None, int, 1)  
    retry = {
        "tentativas": ler_numero("TENTATIVAS", config["tentativas"], int, 1),
        "espera": config["espera"],
    }

    try:
        maquinas, sensores = buscar_sensores(api_url, retry, num_maquinas)
    except requests.exceptions.RequestException as erro:
        print(f"Não consegui buscar os sensores na API: {erro}")
        return

    sensores = [s for s in sensores if s["tipo"] in perfis]
    duracao = f"{ciclos} ciclos" if ciclos > 0 else "sem limite de ciclos"
    print(f"API {api_url} | {len(maquinas)} máquinas | {len(sensores)} sensores | {duracao} | intervalo {intervalo}s. Ctrl+C para parar.")

    enviadas = 0
    perdidas = 0

    try:
        for ciclo in (range(ciclos) if ciclos > 0 else itertools.count()):
            for maquina in maquinas.values():
                atualizar_status(api_url, retry, maquina, config_status, ciclo + 1)

            for sensor in sensores:
                
                if maquinas[sensor["maquina_id"]]["status"] != "running":
                    continue

                valor, em_anomalia = gerar_valor(perfis[sensor["tipo"]], ciclo, sensor, anomalias)
                marca = "  <-- ANOMALIA" if em_anomalia else ""

                try:
                    status = enviar_leitura(api_url, retry, sensor["id"], valor)
                    enviadas += 1
                    print(
                        f"[ciclo {ciclo + 1}] {sensor['maquina']} / "
                        f"{sensor['tipo']} (id {sensor['id']}): {valor} -> {status}{marca}"
                    )
                except requests.exceptions.RequestException as erro:
                    perdidas += 1
                    print(f"[ciclo {ciclo + 1}] sensor {sensor['id']}: leitura perdida ({erro})")

            time.sleep(intervalo)
    except KeyboardInterrupt:
        print("\nParado.")

    
    for maquina in maquinas.values():
        if maquina["status"] != "running":
            trocar_status(api_url, retry, maquina, "running", "fim")

    print(f"Resumo: {enviadas} leituras enviadas, {perdidas} perdidas.")


if __name__ == "__main__":
    main()