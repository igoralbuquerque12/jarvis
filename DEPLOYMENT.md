# Deploy interno do Jarvis e integracao com n8n

Este projeto sobe dois containers: `server` e `migrate`. Nenhum deles publica porta no host. Eles se comunicam pela rede Docker privada `jarvis-internal`; ela tambem permite saidas necessarias do backend, como a conexao com o PostgreSQL do Neon, WhatsApp e chamadas a APIs externas.

O n8n deve ser conectado a essa rede para receber chamadas do backend em `http://n8n:5678`. O n8n continua tambem na sua rede `bridge` padrao, preservando o acesso dele a APIs externas.

## 1. Preparar e subir na VPS

Na sua maquina, envie o codigo para o repositorio Git normalmente. Na VPS, execute:

```bash
git clone <URL_DO_SEU_REPOSITORIO> jarvis
cd jarvis
cp server/.env.example server/.env
nano server/.env
```

No arquivo `server/.env`, cole a `DATABASE_URL` de pooler fornecida pelo Neon (ela deve conter `sslmode=require`). Preencha tambem `WHATSAPP_AUTH_ENCRYPTION_KEY` e `ASSISTANT_WORKFLOW_KEY`.

Depois suba o projeto:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f server
```

O primeiro inicio aplica as migrations antes de subir o backend. Confirme que o container `migrate` terminou com codigo zero; ele pode aparecer como `exited (0)`, o que e esperado.

## 2. Conectar o n8n a rede interna

Execute uma unica vez na VPS, depois de o `docker compose up` ter criado a rede:

```bash
docker network connect jarvis-internal n8n
docker network inspect jarvis-internal
```

Se o comando disser que o endpoint ja existe, a conexao ja esta correta. No n8n, o backend fica acessivel por `http://server:3000`; no backend, use o webhook n8n por `http://n8n:5678/webhook/<caminho>`.

Configure no `server/.env` a URL de producao do webhook, por exemplo:

```dotenv
ASSISTANT_WORKFLOW_URL=http://n8n:5678/webhook/jarvis-assistant
```

Depois de alterar esse arquivo:

```bash
docker compose up -d --force-recreate server
```

## 3. Abrir o n8n apenas durante a configuracao

O modo recomendado nao abre a porta para a internet: a porta fica presa ao `localhost` da VPS e voce entra por um tunel SSH.

Na VPS, recrie o n8n mantendo o volume atual:

```bash
docker stop n8n
docker rm n8n
docker run -d --name n8n --restart unless-stopped -p 127.0.0.1:5678:5678 -e GENERIC_TIMEZONE="America/Sao_Paulo" -e TZ="America/Sao_Paulo" -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true -e N8N_RUNNERS_ENABLED=true -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
docker network connect jarvis-internal n8n
```

Na sua maquina local (nao na VPS), mantenha este comando aberto:

```bash
ssh -N -L 5678:127.0.0.1:5678 <USUARIO>@<IP_DA_VPS>
```

Abra `http://localhost:5678` no navegador. Ao terminar a configuracao, retire a publicacao da porta e mantenha a conexao interna:

```bash
docker stop n8n
docker rm n8n
docker run -d --name n8n --restart unless-stopped -e GENERIC_TIMEZONE="America/Sao_Paulo" -e TZ="America/Sao_Paulo" -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true -e N8N_RUNNERS_ENABLED=true -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
docker network connect jarvis-internal n8n
```

O volume `n8n_data` nao e removido nesses comandos, portanto credenciais, usuarios e workflows sao preservados.

## Operacao

```bash
# Atualizar codigo na VPS
git pull
docker compose up -d --build

# Ver logs do backend
docker compose logs -f server

# Parar sem apagar dados
docker compose down
```

Nao use `docker compose down -v` em producao: ele removeria o volume do banco do Jarvis.
