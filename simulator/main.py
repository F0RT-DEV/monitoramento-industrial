import requests

API_URL = "http://localhost:3000"


def main():
    
    try:
        resposta = requests.get(f"{API_URL}/health", timeout=5)
    except requests.exceptions.RequestException as erro:
        print(f"Não consegui falar com a API: {erro}")
        return

    print(f"Status: {resposta.status_code}")
    print(f"Corpo: {resposta.json()}")


if __name__ == "__main__":
    main()