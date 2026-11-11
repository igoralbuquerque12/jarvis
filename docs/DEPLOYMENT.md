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

No arquivo `server/.env`, cole a `DATABASE_URL` de pooler fornecida pelo Neon (ela deve conter `sslmode=require`). Preencha tambem `WHATSAPP_AUTH_ENCRYPTION_KEY` e `ASSISTANT_WORKFLOW_KEY`. Defina ainda `AI_PROVIDER` (`openai` ou `groq`) e a chave do provedor escolhido (`OPENAI_API_KEY` ou `GROQ_API_KEY`): sem ela o servidor nao sobe.

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

## 4. CI/CD (GitHub Actions + Docker Hub)

Depois do primeiro `docker compose up`, as atualizacoes nao sao mais feitas a mao. Todo `git push` na `main` dispara `.github/workflows/deploy.yml`, que roda tres jobs em sequencia:

1. **Test**: `npm ci`, `prisma generate` e `npm test` do `server/`. Se falhar, nada e publicado.
2. **Build & push**: gera as imagens `jarvis-server` (stage `production`), `jarvis-migrate` (stage `builder`, que tem o CLI do Prisma) e `jarvis-web` (com `VITE_API_URL` embutido) e envia ao Docker Hub.
3. **Deploy**: entra na VPS por SSH, baixa as imagens novas, roda as migrations e recria **apenas** os containers `server` e `web`. Redis, Securo e Traefik nao sao tocados.

### Versao da imagem

A tag e `<VERSION>-<hash curto do commit>`, por exemplo `1.4.2-a3f9c1b`. O SemVer vem do arquivo `VERSION` na raiz: suba o numero nesse arquivo no mesmo commit da mudanca (correcao = patch, funcionalidade = minor, quebra de compatibilidade = major). Nao existe tag `latest`; a versao em execucao fica gravada em `JARVIS_VERSION` no `.env` da raiz da VPS e tambem nos labels da imagem (`docker inspect jarvis-server`).

### Configuracao no GitHub (Settings → Secrets and variables → Actions)

| Tipo | Nome | Valor |
|---|---|---|
| Variable | `DOCKERHUB_USERNAME` | Usuario (ou organizacao) do Docker Hub; vira o prefixo das imagens. |
| Secret | `DOCKERHUB_TOKEN` | Access token do Docker Hub com permissao *Read & Write*. |
| Variable | `API_DOMAIN` | Mesmo valor do `.env` da VPS; vai para o build do frontend. |
| Variable | `VITE_WHATSAPP_NUMBER` | Opcional, mesmo valor do `.env` da VPS. |
| Secret | `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` | Acesso SSH a VPS (ja usados antes). |

Os repositorios do Docker Hub sao criados no primeiro push. Se ficarem privados, o deploy faz `docker login` na VPS com o mesmo token antes do `pull`.

### Health check e rollback

Vinte segundos depois de subir, o deploy confere se o `jarvis-server` esta `running` sem reinicios. Se nao estiver, imprime os logs, volta `server` e `web` para a versao anterior e marca o job como falho. As migrations ja aplicadas **nao** sao desfeitas, entao mantenha as migrations compativeis com a versao anterior (adicionar colunas/tabelas, nunca remover no mesmo deploy).

Rollback manual para qualquer versao ainda presente no Docker Hub:

```bash
JARVIS_VERSION=1.4.1-9b2e0d4 docker compose up -d --no-deps server web
```

Depois edite `JARVIS_VERSION` no `.env` para que os proximos comandos manuais usem a mesma versao.

## Operacao

```bash
# Atualizar: basta dar push na main. Para refazer o deploy sem commit novo,
# use "Run workflow" na aba Actions.
# Na VPS, nao use `--build` em server/web: isso gravaria uma imagem local com a tag da versao publicada.

# Ver logs do backend
docker compose logs -f server

# Parar sem apagar dados
docker compose down
```

Nao use `docker compose down -v` em producao: ele removeria o volume do banco do Jarvis.
