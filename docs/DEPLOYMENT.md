# Deploy interno do Jarvis e integracao com n8n

Do lado do Jarvis, este projeto sobe os containers `server`, `web`, `migrate`, `postgres` (o banco do Jarvis, com pgvector) e `postgres-backup` (dump diario do banco), alem de Redis e Securo. Nenhum deles publica porta para a internet: so o `postgres` publica a 5432 no `127.0.0.1` da VPS, para dev e tunel SSH. Eles se comunicam pela rede Docker privada `jarvis-internal`; ela tambem permite saidas necessarias do backend, como WhatsApp e chamadas a APIs externas (OpenAI, Groq).

O n8n deve ser conectado a essa rede para receber chamadas do backend em `http://n8n:5678`. O n8n continua tambem na sua rede `bridge` padrao, preservando o acesso dele a APIs externas.

## 1. Preparar e subir na VPS

Na sua maquina, envie o codigo para o repositorio Git normalmente. Na VPS, execute:

```bash
git clone <URL_DO_SEU_REPOSITORIO> jarvis
cd jarvis
cp server/.env.example server/.env
nano server/.env
nano .env
```

No `.env` da raiz (interpolacao do `compose.yml`), defina `JARVIS_DB_PASSWORD`, a senha do Postgres do Jarvis. Ela entra numa URL de conexao, entao precisa ser URL-safe; gere com `openssl rand -hex 24`. Sem ela o `docker compose` recusa subir. Opcionalmente, `JARVIS_DB_HOST_PORT` troca a porta publicada no `127.0.0.1` (padrao `5432`).

No arquivo `server/.env`, preencha `WHATSAPP_AUTH_ENCRYPTION_KEY` e `ASSISTANT_WORKFLOW_KEY`. Defina ainda `AI_EXTRACTION_PROVIDER` (`openai` ou `groq`, gera nome e descricao das bases de conhecimento), `AI_EMBEDDING_PROVIDER=openai` (embeddings do RAG das bases) e `OPENAI_API_KEY`, que e sempre obrigatoria; `GROQ_API_KEY` so e exigida com `AI_EXTRACTION_PROVIDER=groq`. Sem as chaves o servidor nao sobe, e a variavel antiga `AI_PROVIDER` sozinha tambem derruba o boot. A `DATABASE_URL` do `server/.env` so vale para o dev local (`localhost:5432`): no Docker o compose injeta em `server` e `migrate` a URL do servico `postgres`.

Depois suba o projeto:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f server
```

O primeiro inicio sobe o `postgres`, espera ele ficar saudavel e aplica as migrations antes de subir o backend (a migration `20261111151719_add_knowledge_rag` habilita a extensao `vector`, que ja vem na imagem `pgvector/pgvector:pg16`). Confirme que o container `migrate` terminou com codigo zero; ele pode aparecer como `exited (0)`, o que e esperado.

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

Sempre que o `n8n.json` do repositorio mudar (por exemplo, o no *Build prompt*), reimporte o workflow no n8n por esse tunel: o deploy do CI nao atualiza o n8n.

## 4. Banco do Jarvis (Postgres local) e backup

O banco do Jarvis e o servico `postgres` do `compose.yml` (container `jarvis-postgres`, imagem `pgvector/pgvector:pg16`, database e usuario `jarvis`, senha `JARVIS_DB_PASSWORD`, dados no volume `postgres-data`). O Securo continua com o proprio `securo-db`, separado. O compose injeta a `DATABASE_URL` (`postgresql://jarvis:<senha>@postgres:5432/jarvis`) em `server` e `migrate`, sobrescrevendo a do `server/.env`.

Para abrir o banco a partir da sua maquina, use um tunel SSH (a porta so escuta no `127.0.0.1` da VPS):

```bash
ssh -N -L 5432:127.0.0.1:5432 <USUARIO>@<IP_DA_VPS>
# em outro terminal: postgresql://jarvis:<JARVIS_DB_PASSWORD>@localhost:5432/jarvis
```

Na propria VPS: `docker compose exec postgres psql -U jarvis -d jarvis`.

### Backup

O servico `postgres-backup` roda `infra/postgres/backup.sh` em loop: um `pg_dump` em formato custom por dia, gravado no volume `postgres-backups`.

- `/backups/daily/jarvis-<timestamp UTC>.dump`: mantidos por 7 dias.
- `/backups/weekly/jarvis-<timestamp UTC>.dump`: copia feita aos domingos, mantida por 28 dias (4 semanais).

O dump e escrito primeiro como `.partial` e so e renomeado se o `pg_dump` terminar bem, entao um arquivo `.dump` e sempre um backup completo. Acompanhe com `docker compose logs postgres-backup`. O CI nao sobe esse servico: suba-o uma vez com `docker compose up -d postgres-backup` (ele reinicia sozinho depois, `restart: unless-stopped`).

Para um backup avulso (antes de uma operacao arriscada):

```bash
docker compose exec postgres-backup sh -c 'pg_dump --format=custom --no-owner --file=/backups/manual-$(date -u +%Y%m%dT%H%M%SZ).dump'
```

Arquivos `manual-*` nao entram na rotacao e ficam ate voce apagar.

**Pendencia: os dumps ainda nao saem da VPS.** Se o disco ou a VPS se perderem, os backups vao junto. Ate existir uma copia automatica fora da VPS, copie de tempos em tempos um dump para outro lugar:

```bash
docker compose cp postgres-backup:/backups/daily/<arquivo>.dump ./
scp <USUARIO>@<IP_DA_VPS>:<PASTA_DO_JARVIS>/<arquivo>.dump .   # na sua maquina
```

### Restauracao

Pare o backend antes, para ninguem escrever no banco durante a restauracao, e suba de novo no fim:

```bash
docker compose stop server
```

Restaurar um dump do volume de backups (o `postgres-backup` ja monta o volume e tem as variaveis `PG*` configuradas):

```bash
docker compose run --rm --entrypoint sh postgres-backup
# dentro do container:
ls /backups/daily /backups/weekly
pg_restore --clean --if-exists --no-owner -d jarvis /backups/daily/jarvis-<timestamp>.dump
exit
```

Restaurar um dump que esta fora do volume (por exemplo, a copia que voce guardou):

```bash
docker compose cp ./<arquivo>.dump postgres:/tmp/restore.dump
docker compose exec -T postgres pg_restore --clean --if-exists --no-owner -U jarvis -d jarvis /tmp/restore.dump
docker compose exec postgres rm /tmp/restore.dump
```

Depois: `docker compose start server`. O dump inclui a sessao do WhatsApp (`whatsapp_auth`, cifrada): ela so volta a funcionar com a mesma `WHATSAPP_AUTH_ENCRYPTION_KEY`; se a chave for outra, leia o QR de novo.

### Trocar a senha do banco

O `JARVIS_DB_PASSWORD` so e aplicado quando o volume `postgres-data` e criado. Trocar o valor no `.env` depois **nao** muda a senha dentro do banco, e o `server` passa a falhar ao conectar. Para trocar:

```bash
docker compose exec postgres psql -U jarvis -d jarvis -c "ALTER USER jarvis PASSWORD '<nova senha URL-safe>'"
# edite JARVIS_DB_PASSWORD no .env da raiz com o mesmo valor
docker compose up -d --no-deps --force-recreate server postgres-backup
```

## 5. CI/CD (GitHub Actions + Docker Hub)

Depois do primeiro `docker compose up`, as atualizacoes nao sao mais feitas a mao. Todo `git push` na `main` dispara `.github/workflows/deploy.yml`, que roda tres jobs em sequencia:

1. **Test**: `npm ci`, `prisma generate` e `npm test` do `server/`. Se falhar, nada e publicado.
2. **Build & push**: gera as imagens `jarvis-server` (stage `production`), `jarvis-migrate` (stage `builder`, que tem o CLI do Prisma) e `jarvis-web` (com `VITE_API_URL` embutido) e envia ao Docker Hub. As imagens sao **so `linux/arm64`**, porque a VPS e ARM; o build roda num runner ARM nativo (`ubuntu-24.04-arm`, gratuito em repositorio publico). Se a VPS mudar para x86, troque `platforms` para `linux/amd64` e o runner para `ubuntu-latest`.
3. **Deploy**: entra na VPS por SSH, atualiza o checkout (`git pull`, que traz o `compose.yml`), baixa as imagens novas, roda as migrations e recria **apenas** os containers `server` e `web`. Redis, Securo, Traefik, `postgres` e `postgres-backup` nao sao recriados; o `docker compose run migrate` so sobe o `postgres` (pelo `depends_on`) se ele nao estiver de pe.

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
| Secret | `JARVIS_API_KEY` | Opcional. Chave da API publica do Jarvis (`jrv_...`) usada para avisar o resultado do deploy no WhatsApp. Sem ela, o aviso e pulado. |

Os repositorios do Docker Hub sao criados no primeiro push. Se ficarem privados, o deploy faz `docker login` na VPS com o mesmo token antes do `pull`.

### Health check e rollback

Vinte segundos depois de subir, o deploy confere se o `jarvis-server` esta `running` sem reinicios. Se nao estiver, imprime os logs, volta `server` e `web` para a versao anterior e marca o job como falho. As migrations ja aplicadas **nao** sao desfeitas, entao mantenha as migrations compativeis com a versao anterior (adicionar colunas/tabelas, nunca remover no mesmo deploy).

### Aviso no WhatsApp

O ultimo job (`notify`) roda sempre, mesmo quando uma etapa anterior falha, e manda o resultado para o WhatsApp do dono da `JARVIS_API_KEY` usando a propria API publica do Jarvis (`POST https://<API_DOMAIN>/v1/messages`). Em todos os casos de falha a versao antiga (ou a restaurada pelo rollback) continua no ar para entregar a mensagem.

- Sucesso: `Deploy feito com sucesso!` com a versao e o titulo do commit.
- Falha: `Deploy falhou.` com a versao, o commit, o motivo (testes, build, pull, migrations, troca dos containers ou health check) e o link dos logs. O motivo vem do nome do passo que falhou: por isso o deploy e dividido em quatro passos SSH, e os nomes deles nao devem mudar sem atualizar o `case` do job `notify`.

A API aceita 1 requisicao por minuto por chave, contando inclusive as que falham. Por isso, em `503` (WhatsApp ainda reconectando), `429`, `502`, `504` ou erro de rede, o job espera 65 s e tenta de novo, ate 4 vezes. Use uma chave so para o deploy, para nao disputar esse limite com outros usos. Se a mensagem nao sair, o job `notify` fica vermelho, mas o deploy em si ja terminou.

Rollback manual para qualquer versao ainda presente no Docker Hub:

```bash
JARVIS_VERSION=1.4.1-9b2e0d4 docker compose up -d --no-deps server web
```

Depois edite `JARVIS_VERSION` no `.env` para que os proximos comandos manuais usem a mesma versao.

## 6. Corte do Neon para o Postgres local (versao 1.1.0)

Ate a versao 1.0.x o banco do Jarvis era o Neon. A partir da 1.1.0 ele e o servico `postgres` do compose (secao 4). **Nao ha migracao de dados**: o banco novo comeca zerado e todas as migrations rodam do zero. Isso apaga, na pratica, usuarios, perfis, eventos, bases de conhecimento, chaves de API e a sessao do WhatsApp. O Securo nao muda (continua no `securo-db`), mas os usuarios novos do Jarvis ganham usuarios novos no Securo.

### Antes do deploy (na VPS)

1. No `.env` da raiz, adicione `JARVIS_DB_PASSWORD` (gere com `openssl rand -hex 24`). Sem ela o `docker compose` recusa interpolar o arquivo e o deploy para no passo *Pull images*, com a versao antiga no ar.
2. No `server/.env`:
   - renomeie `AI_PROVIDER` para `AI_EXTRACTION_PROVIDER` (a antiga sozinha derruba o boot);
   - adicione `AI_EMBEDDING_PROVIDER=openai`;
   - garanta `OPENAI_API_KEY` preenchida (agora sempre obrigatoria, por causa dos embeddings);
   - a `DATABASE_URL` do Neon pode ficar no arquivo, mas deixa de ser usada no Docker (o compose sobrescreve).

### Deploy

3. Faca o push na `main` (ou "Run workflow"). O deploy normal do CI resolve o resto: o `docker compose run migrate` sobe o `postgres` pelo `depends_on`, espera o healthcheck e aplica todas as migrations no banco vazio; em seguida o `up -d --no-deps server web` funciona porque o `postgres` ja esta de pe.
4. **O aviso do `notify` desse primeiro deploy vai falhar**: a API key do secret `JARVIS_API_KEY` existia so no Neon. O deploy em si nao e afetado.

### Depois do deploy

5. Suba o backup: `docker compose up -d postgres-backup` e confira `docker compose logs postgres-backup` (o primeiro dump sai na hora).
6. Leia o QR do WhatsApp de novo, porque a tabela `whatsapp_auth` comecou vazia: `curl -s https://<API_DOMAIN>/whatsapp/qr -H "x-admin-key: <WHATSAPP_ADMIN_API_KEY>"` e abra a *data URL* devolvida. `GET /whatsapp/status` confirma a conexao.
7. Todos os usuarios precisam se cadastrar de novo no painel e parear o WhatsApp com o token novo. So o Free Tier (plano 1) e recriado sozinho; se havia outros planos ou perfis em plano superior, recrie-os no banco novo (por exemplo, com `psql` no container `postgres`).
8. Recrie a sua API key em *Configuracoes → API* e atualize o secret `JARVIS_API_KEY` no GitHub.
9. Reimporte o `n8n.json` no n8n (secao 3): o no *Build prompt* ganhou o bloco "# Regra obrigatoria das bases de conhecimento".
10. Cadastre de novo as bases de conhecimento; cada uma deve chegar a "Pronta para busca" no painel.

### Desligar o Neon

Mantenha o projeto no Neon por alguns dias, ate o Postgres local estar estavel e com backups rodando; so entao desligue-o. **Nunca** use `docker compose down -v`: ele apaga `postgres-data` e `postgres-backups`.

Se precisar voltar atras, um rollback so da imagem (`JARVIS_VERSION=<1.0.x>`) nao basta: o `compose.yml` atualizado continua injetando a URL do `postgres` local. Para voltar ao Neon e preciso reverter tambem o `compose.yml` e o `server/.env`.

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

Nao use `docker compose down -v` em producao: ele removeria os volumes do banco do Jarvis (`postgres-data`), dos backups (`postgres-backups`) e do Securo (`securo-pgdata`).
