<div align="center">

# JARVIS

**Assistente pessoal por WhatsApp.** Lembretes, rotinas e vida financeira em linguagem natural, com um painel web e uma API pública para integrar com o que você quiser.

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![n8n](https://img.shields.io/badge/n8n-AI%20Agent-EA4B71?logo=n8n&logoColor=white)](https://n8n.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Tests](https://img.shields.io/badge/jest-78%20testes%20%C2%B7%2019%20su%C3%ADtes-99424F?logo=jest&logoColor=white)](#testes-e-qualidade)

</div>

---

## Sumário

- [O que é o Jarvis](#o-que-é-o-jarvis)
- [Principais diferenciais](#principais-diferenciais)
- [Visão geral do sistema](#visão-geral-do-sistema)
- [Arquitetura](#arquitetura)
- [O fluxo principal, passo a passo](#o-fluxo-principal-passo-a-passo)
- [Stack](#stack)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Rodando o projeto](#rodando-o-projeto)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy com Docker](#deploy-com-docker)
- [Testes e qualidade](#testes-e-qualidade)
- [API pública](#api-pública)
- [Documentação complementar](#documentação-complementar)
- [Limitações conhecidas e roadmap](#limitações-conhecidas-e-roadmap)

---

## O que é o Jarvis

O Jarvis é um assistente pessoal que vive dentro do WhatsApp. O usuário conversa com ele como conversaria com uma pessoa:

> **Usuário:** me lembra amanhã às 9 de ligar pro dentista
> **Jarvis:** Anotado! Amanhã às 09:00 eu te lembro de ligar para o dentista.
>
> **Usuário:** gastei 50 no mercado
> **Jarvis:** Registrado: *R$ 50,00* no mercado, hoje.
>
> **Usuário:** quanto gastei esse mês?
> **Jarvis:** Até agora, neste mês, você gastou *R$ 1.230,50*. Os maiores foram mercado (R$ 480,00) e transporte (R$ 210,00).

Por trás disso existe uma plataforma completa:

- **Lembretes e rotinas** com recorrência por hora, dia, semana ou mês, executados por um scheduler próprio que respeita o fuso horário de cada usuário.
- **Gestão financeira** completa: contas, transações, categorias, regras automáticas de categorização, metas, transações recorrentes (salário, assinaturas) e carteira de investimentos.
- **Painel web** com login (e-mail/senha ou Google), dashboard, telas financeiras, perfil e gerenciamento de chaves de API.
- **API pública versionada** (`/v1`) para que scripts, CIs e automações do próprio usuário enviem mensagens pelo Jarvis.
- **Onboarding sem fricção**: o usuário se cadastra na web, recebe um token e manda esse token para o número do Jarvis. Pronto, a conta está pareada.

O projeto é um monorepo com backend NestJS, frontend React, um workflow n8n versionado e um `docker-compose` que sobe toda a plataforma numa VPS atrás do Traefik.

---

## Principais diferenciais

**1. O LLM fica fora do core.** O backend não chama nenhum modelo diretamente. Ele monta o system prompt, o catálogo de ferramentas e o contexto (perfil, histórico, data/hora no fuso do usuário) e entrega para um workflow n8n, que roda o agente com function calling e chama o backend de volta pelos endpoints M2M. Trocar o modelo (hoje `gpt-oss-120b` via Groq) é trocar um nó no n8n; nenhuma linha de TypeScript muda.

**2. Catálogo de ferramentas tipado e versionado no código.** As 30 operações que o agente pode executar (3 de eventos e 27 financeiras) são declaradas em TypeScript com nome, quando usar, campos, tipos, obrigatoriedade e exemplo. Esse catálogo é renderizado em Markdown para o prompt e coberto por testes que garantem a forma do contrato. Erros de validação do backend voltam para o modelo como texto legível, e o prompt manda corrigir e tentar de novo.

**3. Engenharia de prompt documentada.** O system prompt segue a estrutura recomendada pelo guia de prompting do GPT-4.1 (papel, instruções, raciocínio, formato, exemplos, lembrete final), com contexto em blocos XML, escape de `<` e `>` no histórico como defesa contra prompt injection, e um diagnóstico completo das falhas anteriores em [`ASSISTANT.md`](../ASSISTANT.md).

**4. Scheduler idempotente e barato.** Eventos são normalizados para múltiplos de 10 minutos e processados por um cron de 10 em 10 minutos que só consulta o banco quando um cache de 2 horas no Redis expira. O claim é um `updateMany` atômico (`PENDING → PROCESSING`), a próxima ocorrência é calculada com Luxon no fuso do perfil e a duplicidade é impedida por uma constraint `UNIQUE (seriesId, scheduledAt)`.

**5. Motor financeiro isolado por usuário.** O [Securo](https://github.com/usesecuro/securo) (gestor financeiro open source em FastAPI) roda como serviço interno com banco e workers próprios. Cada perfil do Jarvis vira um usuário do Securo, provisionado em segundo plano no cadastro e autocorrigido no primeiro uso. As senhas nunca são armazenadas: são derivadas por `HMAC-SHA256(segredo, profileId)`.

**6. Segurança em camadas.** Três mecanismos de autenticação distintos para três públicos (sessão para a web, API key com hash SHA-256 para sistemas externos, chave administrativa com comparação em tempo constante para a rede interna), credenciais do WhatsApp cifradas com AES-256-GCM no banco, e nenhuma porta de serviço interno publicada no host.

**7. Duas fachadas para o mesmo domínio.** Cada capacidade (eventos, finanças) é exposta duas vezes: `/*-m2m/:profileId/*` para o agente na rede privada e `/*/me/*` para a web com sessão, onde o `profileId` nunca vem do cliente.

---

## Visão geral do sistema

<p align="center">
  <img src="diagrams/01-context.svg" alt="Diagrama de contexto: usuário, WhatsApp, Jarvis, n8n, LLM, Securo, PostgreSQL e Redis" width="100%">
</p>

| Ator / sistema | Papel |
|---|---|
| **Usuário** | Conversa pelo WhatsApp e usa o painel web. |
| **WhatsApp** | Canal principal. O Jarvis se conecta como um cliente WhatsApp Web via [Baileys](https://github.com/WhiskeySockets/Baileys). Não há chat na web. |
| **Jarvis Core / API** | Backend NestJS: recebe mensagens, resolve o perfil, monta o contexto, persiste histórico, executa ferramentas, agenda envios, expõe a API web e a API pública. |
| **Web app** | React 19 + Vite. Login, dashboard, finanças, perfil, planos, chaves de API e documentação da API. |
| **n8n + LLM** | Orquestra o agente: valida o payload, monta o prompt, roda o modelo com function calling e devolve uma resposta em texto. |
| **Securo** | Motor financeiro invisível para o usuário. FastAPI + Postgres + Celery, rodando na rede interna. |
| **PostgreSQL (Neon)** | Banco do Jarvis: usuários, perfis, mensagens, eventos, chaves, credenciais do WhatsApp. |
| **Redis** | Cache do scheduler de eventos e dos tokens do Securo. Também é o broker do Celery do Securo (database 1). |
| **Sistemas externos** | Qualquer script do usuário autenticado com uma chave `jrv_…` na API pública. |

---

## Arquitetura

### É microserviços?

Não no sentido estrito, e isso é uma decisão consciente. O Jarvis é um **monólito modular com serviços satélites**:

- **O core de domínio é um único deployable** (NestJS) dividido em módulos com fronteiras claras (`assistant`, `events`, `finance`, `whatsapp`, `api-keys`, `public-api`, `profile`, `auth`, ...). Um único banco relacional guarda o domínio do Jarvis.
- **Responsabilidades que se beneficiam de isolamento real vivem em processos separados**, cada um com seu próprio ciclo de vida, linguagem e armazenamento: o orquestrador de IA (n8n, Node), o motor financeiro (Securo, Python, com seu próprio Postgres e workers Celery) e a infraestrutura compartilhada (Redis, Traefik).
- **A comunicação entre serviços é HTTP síncrono em uma rede Docker privada**, autenticado por chaves estáticas ou JWT por perfil. Não há message broker entre o core e os satélites.

Para um produto deste tamanho, isso entrega o principal benefício da separação (trocar o modelo de IA ou o motor financeiro sem tocar no core; escalar workers do Securo independentemente) sem pagar o custo de microserviços de verdade (múltiplos bancos de domínio, consistência eventual, observabilidade distribuída). A seção *Decisões de arquitetura* do [documento de arquitetura](ARCHITECTURE.md#18-decisões-de-arquitetura-e-trade-offs) detalha o que mudaria se o projeto precisasse ir para microserviços.

### Visão de containers e rede

<p align="center">
  <img src="diagrams/02-containers.svg" alt="Diagrama de containers: Traefik, jarvis-web, jarvis-server, migrate, redis, n8n, Securo e bancos" width="100%">
</p>

Pontos que valem destaque:

- **Nenhum serviço interno publica porta no host.** Só o Traefik fala com a internet, roteando `FRONTEND_DOMAIN` para o nginx do frontend e `API_DOMAIN` para o NestJS.
- **Ordem de subida garantida pelo compose**: o `server` só sobe depois que `migrate` (Prisma) terminou com código 0, `redis` está saudável e `securo-backend` iniciou; o Securo, por sua vez, espera suas próprias migrations Alembic.
- **O n8n é um container à parte**, conectado à rede `jarvis-internal` uma única vez (`docker network connect`). Ele chama o backend por `http://server:3000` e o backend o chama por `http://n8n:5678`. A configuração do n8n é feita por túnel SSH, sem expor a porta.
- **Um Redis, dois usos**: database 0 para o Jarvis, database 1 para o Securo. Persistência AOF em volume.
- **O banco do Jarvis é gerenciado (Neon)**; o do Securo é local, em volume Docker.

### Modelo de dados

<p align="center">
  <img src="diagrams/08-data-model.svg" alt="Diagrama entidade-relacionamento do banco do Jarvis" width="100%">
</p>

O `Profile` é o pivô de tudo. Ele é criado por um hook do better-auth no cadastro, nasce com um `token` de 10 caracteres e com o e-mail como `jid` provisório; o pareamento pelo WhatsApp troca o `jid` pelo número real. Eventos, chaves de API, conta no Securo e histórico de mensagens pendem dele.

---

## O fluxo principal, passo a passo

<p align="center">
  <img src="diagrams/03-message-flow.svg" alt="Diagrama de sequência do processamento de uma mensagem do WhatsApp" width="100%">
</p>

1. O socket Baileys emite `messages.upsert`. O receiver só aceita `type === 'notify'` (mensagens novas, não histórico) e descarta mensagens enviadas pelo próprio número ou sem texto.
2. `AssistantMainService` procura um `Profile` pelo `jid`. **Sem perfil**, o serviço de conexão procura um token de 10 caracteres na mensagem e, se encontrar, pareia a conta. Esse é todo o onboarding.
3. **Com perfil**, carrega as últimas 10 mensagens, persiste a mensagem atual e monta o payload: diretiva (prompt + catálogo de ferramentas, calculado uma vez por processo), `profileId`, o texto `about` do perfil, o histórico enxuto e a data/hora em dois formatos no fuso do usuário.
4. O payload vai por `POST` para o webhook do n8n, autenticado por `x-api-key`.
5. O n8n valida, monta o prompt final com blocos XML, roda o **AI Agent** (até 8 iterações) e, a cada tool call, chama `POST /events-m2m/:profileId/execute` ou `POST /finance-m2m/:profileId/execute` com `{ operation, data }`. Um `400` de validação volta para o modelo como texto e ele corrige os argumentos.
6. A resposta `{ response }` é validada com Zod, persistida como mensagem do tipo `AI` e enviada de volta pelo mesmo socket.

O diagrama de onboarding e os detalhes de cada etapa estão no [documento de arquitetura](ARCHITECTURE.md).

---

## Stack

| Camada | Tecnologia | Observações |
|---|---|---|
| Backend | **NestJS 11**, TypeScript 5.7, Node 22 | Módulos por domínio, `ValidationPipe` global com `whitelist` + `forbidNonWhitelisted`. |
| ORM / banco | **Prisma 7** + `@prisma/adapter-pg`, **PostgreSQL** (Neon) | Driver adapter obrigatório para o pooler do Neon. 10 migrations versionadas. |
| Cache | **Redis 7** (`redis` v6 client) | Janela do scheduler, tokens do Securo. |
| WhatsApp | **Baileys 7** | Sessão persistida no Postgres, cifrada com AES-256-GCM. |
| Autenticação | **better-auth 1.6** | E-mail/senha e Google. Montado fora do pipeline do Nest. |
| Validação | class-validator / class-transformer (DTOs internos), **Zod 4** (payloads externos) | Os dois padrões coexistem de propósito. |
| Datas | **Luxon** | Toda conta de data é feita no fuso IANA do perfil e gravada em UTC. |
| IA | **n8n** (AI Agent + `httpRequestTool`), **Groq** `openai/gpt-oss-120b` | Workflow versionado em [`n8n.json`](../n8n.json). |
| Finanças | **Securo** (FastAPI, SQLAlchemy, Celery, Postgres 16 + pgvector) | Vendorizado em `securo/`. |
| Frontend | **React 19**, **Vite 8**, React Router 7, Recharts 3 | Sem UI kit: design system próprio em CSS (tokens, Michroma/Orbitron/Space Grotesk). |
| Infra | **Docker Compose**, **Traefik** (TLS Let's Encrypt), nginx | Multi-stage builds, imagem final roda como usuário `node`. |
| Testes | **Jest 30** + ts-jest, supertest | 19 suítes, 78 testes unitários. |
| Qualidade | ESLint 9 (typescript-eslint), Prettier | Conventional commits em inglês. |

---

## Estrutura do repositório

```
jarvis/
├── server/                    # Backend NestJS (o grosso do código)
│   ├── prisma/                # schema.prisma, migrations, seed.ts
│   ├── prisma.config.ts       # Prisma 7 lê schema, seed e DATABASE_URL daqui
│   ├── src/
│   │   ├── main.ts            # bootstrap: better-auth montado ANTES do express.json()
│   │   ├── app.module.ts
│   │   ├── assistant/         # loop de mensagens, prompt, catálogo de tools, cliente do n8n
│   │   ├── whatsapp/          # socket Baileys, receiver, sender, auth store cifrado, admin guard
│   │   ├── events/            # séries, execuções, scheduler (@Cron), M2M e endpoints web
│   │   ├── finance/           # core (Securo client, provisioning) + 7 submódulos de domínio
│   │   ├── api-keys/          # ciclo de vida das chaves jrv_ + ApiKeyGuard
│   │   ├── public-api/        # /v1/* (protegido por API key)
│   │   ├── auth/              # BetterAuthService (hooks, sessão)
│   │   ├── profile/           # Profile, token de pareamento, view "me"
│   │   ├── subscription/      # planos (Free Tier padrão)
│   │   ├── messages/          # histórico de conversa
│   │   ├── prisma/ redis/     # módulos globais de infraestrutura
│   │   └── core/              # ExecuteOperationDto + validateDto (RPC dos M2M)
│   ├── Dockerfile             # multi-stage: builder → production
│   └── .env.example
├── web/                       # Frontend React + Vite
│   ├── src/
│   │   ├── features/          # auth, dashboard, finance, plans, profile, settings
│   │   ├── components/        # layout (AppShell, RequireAuth) e ui (design system)
│   │   ├── hooks/ services/   # hooks use-my-* e clientes HTTP por recurso
│   │   └── lib/               # apiFetch, authClient (better-auth/react), config, format
│   ├── Dockerfile             # build Vite → nginx
│   └── nginx.conf             # SPA fallback, sem cache para index.html
├── securo/                    # Securo vendorizado (só o backend é usado)
├── docs/                      # Esta documentação + diagramas (fontes .mmd, SVG e PNG)
├── compose.yml                # Toda a plataforma (10 serviços, 2 redes, 3 volumes)
├── n8n.json                   # Workflow do agente, importável no n8n
├── ASSISTANT.md               # Engenharia de prompt: diagnóstico e técnicas aplicadas
├── FINANCE.md                 # Integração com o Securo em detalhe
├── DEPLOYMENT.md              # Deploy na VPS e wiring do n8n
└── CLAUDE.md                  # Guia de arquitetura e convenções para agentes de código
```

Convenções: módulos seguem `controllers/ services/ dto/ entities/ utils/ schedules/ tests/`; strings voltadas ao usuário e docs de módulo são em pt-BR; identificadores, comentários e commits em inglês.

---

## Rodando o projeto

### Pré-requisitos

- **Node.js 22** e npm 10
- **Docker** com Compose v2
- Um **PostgreSQL** para o Jarvis. Pode ser um banco gratuito no [Neon](https://neon.tech) (use a URL do *pooler* com `sslmode=require`) ou um Postgres local qualquer.
- Uma **conta Groq** (ou outro provedor com function calling) para o modelo.
- Um **número de WhatsApp dedicado** ao assistente, num celular onde você consiga escanear um QR code.

### 1. Suba a infraestrutura de apoio (Redis + Securo)

O `compose.yml` não publica portas de serviço no host de propósito. Para desenvolver o backend fora do Docker, crie um `compose.override.yml` na raiz (o Compose carrega esse arquivo automaticamente e ele não precisa ir para o Git):

```yaml
# compose.override.yml (apenas dev local)
services:
  redis:
    ports: ["127.0.0.1:6379:6379"]
  securo-backend:
    ports: ["127.0.0.1:8000:8000"]
```

O `compose.yml` referencia uma rede externa `proxy` (do Traefik). Crie-a uma vez, mesmo em dev:

```bash
docker network create proxy
docker compose up -d redis securo-db securo-migrate securo-backend securo-celery-worker securo-celery-beat
```

### 2. Configure e rode o backend

```bash
cd server
npm ci
cp .env.example .env      # preencha conforme a tabela de variáveis abaixo
npx prisma migrate deploy # aplica as migrations no seu banco
npx prisma generate
npm run dev               # http://localhost:3000
```

Gere os segredos com:

```bash
# WHATSAPP_AUTH_ENCRYPTION_KEY: exatamente 32 bytes em base64
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# BETTER_AUTH_SECRET, WHATSAPP_ADMIN_API_KEY, ASSISTANT_WORKFLOW_KEY, SECURO_PROVISION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Pareie o número do assistente

Com o backend rodando, peça o QR code pelo endpoint administrativo e abra a *data URL* devolvida numa aba do navegador:

```bash
curl -s http://localhost:3000/whatsapp/qr -H "x-admin-key: $WHATSAPP_ADMIN_API_KEY"
# → { "connected": false, "qr": "data:image/png;base64,..." }
```

Escaneie com o WhatsApp do número do assistente (*Aparelhos conectados*). As credenciais ficam cifradas na tabela `whatsapp_auth`; nas próximas subidas a sessão é restaurada sem QR. `GET /whatsapp/status` confirma a conexão.

### 4. Suba o n8n e importe o workflow

```bash
docker run -d --name n8n -p 127.0.0.1:5678:5678 \
  -e GENERIC_TIMEZONE=America/Sao_Paulo -e TZ=America/Sao_Paulo \
  -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

Em `http://localhost:5678`:

1. Importe [`n8n.json`](../n8n.json).
2. Crie a credencial **Groq** e a credencial **Header Auth** com o header `x-api-key`. O valor precisa ser igual a `ASSISTANT_WORKFLOW_KEY` (o webhook valida com ele) **e** a `WHATSAPP_ADMIN_API_KEY` (as tools chamam os endpoints M2M com a mesma credencial). Na prática: use o mesmo valor nas duas variáveis, ou crie uma segunda credencial para os quatro nós de tool.
3. Nos quatro nós de tool, troque `http://server:3000` por `http://host.docker.internal:3000` (dev local).
4. Ative o workflow. O nó Webhook expõe o caminho `assistant`, então no `server/.env`:

```dotenv
ASSISTANT_WORKFLOW_URL=http://localhost:5678/webhook/assistant
```

### 5. Rode o frontend

```bash
cd web
npm ci
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:3000
npm run dev               # http://localhost:5173
```

Cadastre-se, copie a mensagem de conexão exibida no dashboard e envie para o número do assistente. O Jarvis responde confirmando o pareamento. A partir daí, converse.

### Comandos úteis

```bash
# server/
npm run dev              # nest start --watch
npm run build            # nest build
npm run lint             # eslint --fix
npm test                 # jest (unitários, *.spec.ts colocados junto ao código)
npm test -- get-next-scheduled-at        # uma suíte
npm test -- -t "rounds to the nearest"   # um teste
npm run test:e2e
npx prisma migrate dev --name <nome>     # nova migration
npm run db:seed          # cria um perfil a partir de SEED_PROFILE_* (útil sem web)

# web/
npm run dev | build | lint

# raiz
node docs/diagrams/render.mjs            # re-renderiza os diagramas desta documentação
```

---

## Variáveis de ambiente

### `server/.env`

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PORT` | não | Porta HTTP do NestJS. Padrão `3000`. |
| `DATABASE_URL` | **sim** | URL do PostgreSQL. No Neon, use o *pooler* com `?sslmode=require`. |
| `REDIS_URL` | **sim** | `redis://localhost:6379` em dev. O compose injeta `redis://redis:6379`. |
| `BETTER_AUTH_URL` | **sim** | URL pública da API (base dos endpoints `/api/auth`). O compose injeta `https://${API_DOMAIN}`. |
| `BETTER_AUTH_SECRET` | **sim** | Segredo de assinatura das sessões. |
| `WEB_ORIGIN` | **sim** | Origem do frontend, usada no CORS (`credentials: true`) e em `trustedOrigins`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | não | Habilitam o login com Google. Sem eles, só e-mail/senha. |
| `WHATSAPP_AUTH_ENCRYPTION_KEY` | **sim** | 32 bytes em base64. Cifra as credenciais do Baileys no banco. **Perder essa chave obriga a escanear o QR de novo.** |
| `WHATSAPP_ADMIN_API_KEY` | **sim** | Chave dos endpoints administrativos e M2M (`/whatsapp/*`, `/events-m2m/*`, `/finance-m2m/*`). |
| `ASSISTANT_WORKFLOW_URL` | **sim** | URL do webhook do n8n. Em produção `http://n8n:5678/webhook/assistant`. |
| `ASSISTANT_WORKFLOW_KEY` | **sim** | Enviada como `x-api-key` para o webhook. Deve bater com a credencial Header Auth do n8n. |
| `SECURO_API_URL` | **sim** | `http://localhost:8000` em dev. O compose injeta `http://securo-backend:8000`. |
| `SECURO_ADMIN_EMAIL` / `SECURO_ADMIN_PASSWORD` | **sim** | Usuário de serviço do Securo, criado automaticamente no primeiro boot. |
| `SECURO_PROVISION_SECRET` | **sim** | Deriva a senha de cada perfil no Securo. **Não trocar depois de provisionar usuários.** |
| `SEED_PROFILE_NAME` / `_TOKEN` / `_JID` / `_ACTIVE` | não | Só para `npm run db:seed`. |

### `web/.env`

| Variável | Descrição |
|---|---|
| `VITE_API_BASE_URL` | Base da API em dev (`http://localhost:3000`). No build Docker o compose passa `VITE_API_URL`. |
| `VITE_WHATSAPP_NUMBER` | Número do assistente só com dígitos (ex. `5511999999999`). Habilita o botão *Abrir no WhatsApp* com a mensagem de conexão pré-preenchida. |

### `.env` na raiz (interpolação do `compose.yml`)

| Variável | Descrição |
|---|---|
| `FRONTEND_DOMAIN` / `API_DOMAIN` | Hosts roteados pelo Traefik (ex. `app.seudominio.com`, `api.seudominio.com`). |
| `TRAEFIK_CERTRESOLVER` | Nome do resolver TLS no Traefik. Padrão `letsencrypt`. |
| `VITE_WHATSAPP_NUMBER` | Repassado como build arg para o frontend. |
| `NODE_ENV` | Padrão `development`; use `production` na VPS. |
| `SECURO_SECRET_KEY` | Segredo do JWT do Securo. Tem um default apenas para dev. |

---

## Deploy com Docker

Na VPS, com o Traefik já rodando e a rede `proxy` criada:

```bash
git clone https://github.com/igoralbuquerque12/jarvis.git && cd jarvis
cp server/.env.example server/.env && nano server/.env   # produção
nano .env                                                 # FRONTEND_DOMAIN, API_DOMAIN, ...
docker compose up -d --build
docker compose ps                                         # migrate deve aparecer como exited (0)
docker network connect jarvis-internal n8n                # uma única vez
docker compose logs -f server
```

Atualizar é `git pull && docker compose up -d --build`. **Nunca** rode `docker compose down -v` em produção: o volume do Postgres do Securo seria apagado. O passo a passo completo, incluindo como configurar o n8n por túnel SSH sem expor porta, está em [`DEPLOYMENT.md`](../DEPLOYMENT.md).

---

## Testes e qualidade

```
Test Suites: 19 passed, 19 total
Tests:       78 passed, 78 total
```

O que está coberto:

| Área | Suítes | O que garantem |
|---|---|---|
| Eventos | `get-next-scheduled-at`, `events-m2m.service`, `events.schedule` | Arredondamento para 10 min (empate arredonda para frente), próxima ocorrência sempre no futuro e no fuso certo, validação de recorrência, claim/estados do scheduler, invalidação do cache. |
| Assistente | `main.tools`, `build-system-prompt` | Forma do catálogo de tools (todo módulo aponta para `/*-m2m/:profileId`), renderização do prompt, contexto temporal com offset. |
| Finanças | 7 suítes de domínio + `securo-provisioning.service` | Tradução DTO → payload do Securo (dinheiro como string, snake_case, PATCH só com campos enviados, defaults BRL), curto-circuito de conta ativa, fluxo completo de provisioning, marcação `FAILED`, cache de token. |
| Chaves de API | `generate-api-key`, `extract-api-key`, `api-keys.service`, `api-key.guard` | Formato `jrv_`, hash, limite por perfil, recusa de chave inativa/perfil inativo, `lastUsedAt` best-effort. |
| API pública | `public-api.service` | `409` quando o perfil não pareou o WhatsApp. |
| WhatsApp | `whatsapp-admin.guard` | Headers aceitos, comparação em tempo constante. |

Além dos testes: `ValidationPipe` global rejeita qualquer campo não declarado em DTO; a fronteira com o n8n é validada com Zod nos dois sentidos; ESLint + Prettier no `npm run lint`.

---

## API pública

Qualquer usuário pode criar até 10 chaves em *Configurações → API*. A chave tem o formato `jrv_<32 chars>`, é exibida uma única vez e só o hash SHA-256 fica no banco.

```bash
curl -X POST https://api.seudominio.com/v1/messages \
  -H "Authorization: Bearer jrv_..." \
  -H "Content-Type: application/json" \
  -d '{"message":"Deploy finalizado com sucesso ✅"}'
# → 201 { "sent": true, "sentAt": "2026-09-10T15:04:05.000Z" }
```

A rota age sempre em nome do dono da chave: envia a mensagem para o WhatsApp dele. Respostas: `400` corpo inválido, `401` chave ausente/inválida, `409` perfil ainda sem WhatsApp pareado, `503` WhatsApp desconectado. Detalhes em [`server/src/public-api/docs/README.md`](../server/src/public-api/docs/README.md).

---

## Documentação complementar

| Documento | Conteúdo |
|---|---|
| [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | **Arquitetura e system design em profundidade**: todas as visões, cada fluxo, decisões e trade-offs. |
| [`ASSISTANT.md`](../ASSISTANT.md) | Diagnóstico do agente e as técnicas de engenharia de prompt aplicadas, com referências. |
| [`FINANCE.md`](../FINANCE.md) | Integração com o Securo: provisioning, tradução de payloads, endpoints e operações. |
| [`DEPLOYMENT.md`](../DEPLOYMENT.md) | Deploy na VPS, rede interna e n8n. |
| [`server/src/events/docs/README.md`](../server/src/events/docs/README.md) | Regras e endpoints do módulo de eventos. |
| [`server/src/api-keys/docs/README.md`](../server/src/api-keys/docs/README.md) | Ciclo de vida das chaves e o guard. |
| [`server/src/public-api/docs/README.md`](../server/src/public-api/docs/README.md) | Contrato da API pública e como estendê-la. |
| [`docs/diagrams/`](diagrams/) | Fontes Mermaid (`src/*.mmd`) e renders SVG/PNG de todos os diagramas. |

---

## Limitações conhecidas e roadmap

- **Sem retentativa no scheduler**: uma execução que falha no envio fica `FAILED` com o motivo registrado; a série recorrente continua normalmente.
- **Limite do plano ainda não é aplicado**: o `Subscription.limit` (100 mensagens/mês no Free Tier) existe no modelo e na UI, mas não há contagem nem bloqueio.
- **Reset de senha só loga o link**: o `sendResetPassword` do better-auth escreve a URL no log do servidor; não há provedor de e-mail configurado.
- **Uma instância do backend**: a sessão Baileys é única e o scheduler assume um único processo. Escalar horizontalmente exigiria extrair o gateway de WhatsApp e adotar lock distribuído no cron.
- **Só texto**: legendas de mídia são lidas, mas áudio, imagem e documentos não são interpretados.
- **Securo parcialmente exposto**: transferências entre contas, orçamentos e importação de extratos existem no Securo e ainda não viraram ferramentas.
- **Próximos passos naturais**: fila com retry para envios, contagem de uso por plano, e-mail transacional, transcrição de áudio, testes e2e cobrindo os endpoints M2M.

---

<div align="center">

Feito por **Igor Albuquerque** · [github.com/igoralbuquerque12/jarvis](https://github.com/igoralbuquerque12/jarvis)

</div>
