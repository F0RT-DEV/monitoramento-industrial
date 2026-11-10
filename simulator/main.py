import math
import random
import time

import requests

API_URL = "http://localhost:3000"
SENSOR_ID = 1  
VALOR_BASE = 60.0   
VARIACAO_LENTA = 3.0  
RUIDO = 1.5         
INTERVALO = 2 
TOTAL_LEITURAS = 20


def gerar_valor(passo):
    # onda lenta + ruído aleatório (distribuição normal)
    onda = VARIACAO_LENTA * math.sin(passo / 10)
    ruido = random.gauss(0, RUIDO)
    return round(VALOR_BASE + onda + ruido, 2)


def enviar_leitura(valor):
    resposta = requests.post(
        f"{API_URL}/readings",
        json={"sensorId": SENSOR_ID, "value": valor},
        timeout=5,
    )
    return resposta.status_code


def main():
    print(f"Enviando {TOTAL_LEITURAS} leituras para o sensor {SENSOR_ID}. Ctrl+C para parar.")
    valores = []
    try:
        for passo in range(TOTAL_LEITURAS):
            valor = gerar_valor(passo)
            valores.append(valor)

            try:
                status = enviar_leitura(valor)
                print(f"[{passo + 1}/{TOTAL_LEITURAS}] valor={valor} -> {status}")
            except requests.exceptions.RequestException as erro:
                print(f"[{passo + 1}/{TOTAL_LEITURAS}] falha ao enviar: {erro}")

            time.sleep(INTERVALO)
    except KeyboardInterrupt:
        print("\nParado.")
    if valores:
        print(f"Resumo: menor={min(valores)} maior={max(valores)} amplitude={round(max(valores) - min(valores), 2)}")

if __name__ == "__main__":
    main()