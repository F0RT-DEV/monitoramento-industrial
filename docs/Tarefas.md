# Plano de tarefas — Etapas 2 a 8

> Cada tarefa tem no máximo 3h. Horas são estimativas; prazos seguem o cronograma do projeto.
> **Como usar:** crie as issues de uma etapa só quando ela estiver perto de começar, com os campos Etapa, Prazo e Horas preenchidos.

## Etapa 2 — Dados (21/10 a 23/10) · ~6,5h

| # | Tarefa | Horas | Prazo |
|---|---|---|---|
| 2.1 | Desenhar o diagrama entidade-relacionamento (máquinas, sensores, leituras, regras, alertas) | 1,5 | 21/10 |
| 2.2 | Escrever o script SQL de criação das tabelas, com chaves e índices | 1,5 | 22/10 |
| 2.3 | Subir o PostgreSQL com Docker e rodar o script | 1 | 22/10 |
| 2.4 | Escrever o script de dados iniciais (máquinas, sensores e regras) | 1 | 23/10 |
| 2.5 | Escrever 5 consultas de prática e salvar em `sql/` | 1,5 | 23/10 |

## Etapa 3 — API (26/10 a 06/11) · ~21h

| # | Tarefa | Horas | Prazo |
|---|---|---|---|
| 3.1 | Iniciar projeto Node.js + TypeScript + Express (pastas, tsconfig, scripts) | 2 | 26/10 |
| 3.2 | Conectar ao PostgreSQL com variáveis de ambiente | 2 | 27/10 |
| 3.3 | Criar a rota `GET /health` | 1 | 27/10 |
| 3.4 | Criar `POST /readings` com validação (Zod) | 3 | 28/10 |
| 3.5 | Criar `GET /readings` com filtros de sensor e período | 2 | 29/10 |
| 3.6 | Criar `GET /machines` com o último status | 2 | 30/10 |
| 3.7 | Criar `GET /machines/:id` com os sensores | 1 | 30/10 |
| 3.8 | Criar `GET /alerts` com filtro por status | 1,5 | 03/11 |
| 3.9 | Criar `PATCH /alerts/:id/ack` | 1,5 | 03/11 |
| 3.10 | Padronizar erros e códigos HTTP (middleware) | 2 | 04/11 |
| 3.11 | Documentar os endpoints em um arquivo `.http` | 2 | 05/11 |
| 3.12 | Testar manualmente todos os endpoints | 1 | 06/11 |

## Etapa 4 — Simulador (09/11 a 13/11) · ~8,5h

| # | Tarefa | Horas | Prazo |
|---|---|---|---|
| 4.1 | Criar a estrutura do script Python (ambiente virtual e `requests`) | 1 | 09/11 |
| 4.2 | Gerar leituras normais com ruído para um sensor | 2 | 10/11 |
| 4.3 | Simular várias máquinas e sensores a partir de uma configuração | 1,5 | 11/11 |
| 4.4 | Injetar anomalias ocasionais (pico de temperatura, queda de pressão) | 1,5 | 12/11 |
| 4.5 | Parametrizar URL, intervalo e quantidade de máquinas por variáveis de ambiente | 1 | 12/11 |
| 4.6 | Tratar falhas de rede com nova tentativa | 1 | 13/11 |
| 4.7 | Rodar por 10 minutos e conferir os dados no banco | 0,5 | 13/11 |

## Etapa 5 — Dashboard (16/11 a 27/11) · ~21h

| # | Tarefa | Horas | Prazo |
|---|---|---|---|
| 5.1 | Iniciar projeto React + TypeScript + Tailwind com Vite | 1,5 | 16/11 |
| 5.2 | Criar o cliente de API (funções de consulta e tipos) | 2 | 17/11 |
| 5.3 | Criar a tela de lista de máquinas com status em cores (normal, atenção, crítico) | 3 | 18/11 |
| 5.4 | Criar a tela de detalhe da máquina | 2 | 19/11 |
| 5.5 | Criar o gráfico de linha das leituras | 3 | 23/11 |
| 5.6 | Criar o seletor de período do gráfico | 1 | 24/11 |
| 5.7 | Criar o painel de alertas com filtro | 2,5 | 24/11 |
| 5.8 | Criar o botão de reconhecer alerta | 1 | 25/11 |
| 5.9 | Implementar a atualização periódica (polling) | 1 | 25/11 |
| 5.10 | Tratar estados de carregamento, erro e lista vazia | 1,5 | 26/11 |
| 5.11 | Ajustar o layout para celular | 1,5 | 26/11 |
| 5.12 | Testar o fluxo completo com o simulador rodando | 1 | 27/11 |

## Etapa 6 — n8n (30/11 a 04/12) · ~11h

| # | Tarefa | Horas | Prazo |
|---|---|---|---|
| 6.1 | Subir o n8n com Docker | 1 | 30/11 |
| 6.2 | Criar o webhook que recebe leituras | 1 | 30/11 |
| 6.3 | Fazer a API chamar o webhook depois de gravar uma leitura | 1 | 01/12 |
| 6.4 | Criar o nó de regra que compara a leitura com o limite | 2 | 01/12 |
| 6.5 | Gravar o alerta na API por HTTP Request | 1,5 | 02/12 |
| 6.6 | Enviar a notificação por e-mail ou Telegram | 2 | 03/12 |
| 6.7 | Evitar alertas repetidos (janela de 5 minutos) | 1,5 | 04/12 |
| 6.8 | Exportar o fluxo em `.json` e documentar como importar | 1 | 04/12 |

## Etapa 7 — Qualidade (07/12 a 11/12) · ~11,5h

| # | Tarefa | Horas | Prazo |
|---|---|---|---|
| 7.1 | Configurar o Vitest (ou Jest) na API | 1 | 07/12 |
| 7.2 | Escrever testes unitários das regras de alerta | 2 | 07/12 |
| 7.3 | Escrever testes dos endpoints principais com Supertest | 2,5 | 08/12 |
| 7.4 | Criar `/auth/login` com senha em hash (bcrypt) e JWT | 2 | 09/12 |
| 7.5 | Criar o middleware que protege as rotas | 1,5 | 10/12 |
| 7.6 | Mover segredos para `.env` e criar o `.env.example` | 0,5 | 10/12 |
| 7.7 | Criar a tela de login no painel | 2 | 11/12 |
| 7.8 | (Opcional) GitHub Actions rodando os testes a cada push | 1,5 | 11/12 |

## Etapa 8 — Entrega (14/12 a 18/12) · ~13,5h

| # | Tarefa | Horas | Prazo |
|---|---|---|---|
| 8.1 | Criar o Dockerfile da API | 1 | 14/12 |
| 8.2 | Criar os Dockerfiles do painel e do simulador | 1,5 | 14/12 |
| 8.3 | Criar o `docker-compose.yml` com todos os serviços | 2,5 | 15/12 |
| 8.4 | Escrever o README final (diagrama, capturas, como rodar, decisões e limitações) | 3 | 16/12 |
| 8.5 | Testar em uma pasta limpa seguindo só o README | 1 | 17/12 |
| 8.6 | Gravar o vídeo de demonstração (2 a 3 minutos) | 2 | 17/12 |
| 8.7 | Atualizar currículo, LinkedIn, GitHub fixado e portfólio | 2 | 18/12 |
| 8.8 | Publicar o post final com o vídeo | 0,5 | 18/12 |

---

## Resumo de horas

| Etapa | Horas |
|---|---|
| 2 — Dados | 6,5 |
| 3 — API | 21 |
| 4 — Simulador | 8,5 |
| 5 — Dashboard | 21 |
| 6 — n8n | 11 |
| 7 — Qualidade | 11,5 (+1,5 opcional) |
| 8 — Entrega | 13,5 |
| **Total** | **~93h** |