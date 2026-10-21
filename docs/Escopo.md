\# Escopo — Plataforma de Monitoramento Industrial (v1.0)

\#\# 1\. Visão geral  
Plataforma web de monitoramento industrial que recebe leituras simuladas de máquinas (temperatura, vibração e status), guarda o histórico em um banco de dados, gera alertas quando um valor passa do limite e mostra tudo em um painel que se atualiza quase em tempo real (atualização a cada poucos segundos)

\#\# 2\. Problema  
Em uma fábrica, uma máquina que quebra de repente para a produção e gera prejuízo. Sem um sistema que acompanhe os dados e avise, alguém precisa conferir máquina por máquina, e o problema só é percebido quando já aconteceu. 

\#\# 3\. Usuários  
\- \*\*Operador de Chão de Fábrica:\*\* Acompanha o status atual das máquinas, visualiza alertas visuais e reconhece anomalias na interface.  
\- \*\*Gestor de Manutenção:\*\* Consulta o histórico temporal de leituras, analisa tendências de desgaste e recebe notificações externas de emergência.

\#\# 4\. Funcionalidades da versão 1.0  
\- Como operador, quero ver a lista de máquinas com o status atual, para saber rápido quais precisam de atenção.  
\- Como operador, quero ver um gráfico das leituras de uma máquina ao longo do tempo, para entender a evolução do desgaste.  
\- Como gestor, quero receber uma notificação automática (via e-mail ou Telegram) quando uma leitura passar do limite crítico, para agir antes de uma parada.  
\- Como operador, quero poder reconhecer (\*acknowledge\*) um alerta ativo no painel, para indicar que a equipe já está ciente do problema.

\#\# 5\. Fora do escopo (v1.0)  
\- Sensores físicos reais (todos os dados são gerados via script simulador).  
\- Atualização via WebSocket (o painel utiliza atualizações periódicas por polling).  
\- Múltiplos perfis de usuário com controle granular de permissões (RBAC).  
\- Hospedagem paga em nuvem e recursos de Inteligência Artificial (etapa opcional futura).  
\- Tela de cadastro de máquinas e sensores (os cadastros são feitos por script de carga inicial no banco) 

\#\# 6\. Restrições e decisões  
\- Custo financeiro zero (stack open-source e ferramentas locais).  
\- Geração de dados simulada por script Python independente.  
\- Stack tecnológica definida: Node.js/TypeScript (Express), PostgreSQL, React, n8n e Docker.

\#\# 7\. Critérios de pronto  
\- O comando \`docker compose up\` sobe banco, API, painel e n8n em um ambiente limpo.  
\- O simulador Python envia leituras contínuas e elas aparecem no painel em poucos segundos.  
\- Uma leitura anômala aciona o fluxo do n8n e gera a notificação.  
\- O painel lista as máquinas, mostra o gráfico e os alertas e permite reconhecer um alerta.  
\- As rotas protegidas exigem login com JWT.  
\- Testes automatizados cobrem as regras de validação e de alerta.  
\- O README tem diagrama e instruções para rodar.  
\- Há um vídeo de demonstração de 2 a 3 minutos.

\#\# 8\. Cronograma  
\- Planejado e acompanhado no \[quadro do projeto no GitHub\] [https\://github.com/users/F0RT-DEV/projects/2](https://github.com/users/F0RT-DEV/projects/2) . Entrega prevista da v1.0: 18/12/2026.

