# Jarvis Server

Backend do Jarvis, implementado em NestJS. Este documento trata somente do `server`; para subir a plataforma inteira, configurar n8n, Securo e Docker, consulte a [documentação global](../docs/README.md).

## Responsabilidades

O server concentra o domínio e as integrações de backend:

- autenticação web por sessão com better-auth;
- perfis, assinaturas e pareamento de usuários com o WhatsApp;
- recebimento e envio de mensagens com Baileys;
- runs do assistente (uma por mensagem recebida, idempotentes), contexto e ferramentas servidos ao workflow n8n;
- eventos, recorrências e execução agendada de lembretes;
- integração financeira com a API interna do Securo;
- criação e validação de chaves `jrv_…`;
- API pública versionada em `/v1`;
- persistência no PostgreSQL com Prisma e cache no Redis.

## Stack

- Node.js 22 e TypeScript
- NestJS 11
- Prisma 7 com PostgreSQL
- Redis 7
- better-auth
- Baileys
- Jest, ESLint e Prettier

## Organização do código

```text
server/
├── prisma/
│   ├── schema.prisma       # modelo de dados
│   ├── migrations/         # migrations versionadas
│   └── seed.ts             # seed opcional de perfil
├── src/
│   ├── api-keys/           # chaves da API pública
│   ├── assistant/          # runs, prompt, tools, /assistant-m2m e cliente do n8n
│   ├── auth/               # better-auth e sessões
│   ├── core/               # contratos compartilhados
│   ├── events/             # lembretes, recorrência e scheduler
│   ├── finance/            # adaptação dos domínios do Securo
│   ├── messages/           # histórico da conversa
│   ├── profile/            # perfil e token de pareamento
│   ├── public-api/         # superfície pública /v1
│   ├── redis/              # cliente Redis global
│   ├── subscription/       # planos
│   ├── whatsapp/           # conexão, sessão e envio pelo WhatsApp
│   ├── app.module.ts
│   └── main.ts
├── test/                   # testes e2e
├── .env.example
└── Dockerfile
```

Os módulos normalmente separam `controllers`, `services`, `dto`, `entities`, `utils`, `schedules` e testes colocados junto ao código.

## Dependências locais

Para executar o server fora do Docker, tenha disponíveis:

- um PostgreSQL acessível por `DATABASE_URL`;
- Redis em `REDIS_URL`;
- a API do Securo em `SECURO_API_URL` para recursos financeiros;
- um webhook n8n em `ASSISTANT_WORKFLOW_URL` para respostas do assistente.

O passo a passo para subir Redis, Securo e n8n está na seção [Rodando o projeto](../docs/README.md#rodando-o-projeto) da documentação global.

## Desenvolvimento local

```bash
cd server
npm ci
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run dev
```

A API fica em `http://localhost:3000` por padrão. Preencha o `.env` antes de iniciar; o processo se conecta ao PostgreSQL, ao Redis e tenta restaurar a sessão do WhatsApp durante o bootstrap.

Para criar dados iniciais sem passar pelo cadastro do painel:

```bash
# preencha SEED_PROFILE_NAME, SEED_PROFILE_TOKEN e SEED_PROFILE_JID
npm run db:seed
```

## Variáveis de ambiente

Use [`.env.example`](.env.example) como base.

| Variável | Uso |
|---|---|
| `PORT` | Porta HTTP; padrão `3000`. |
| `DATABASE_URL` | Conexão PostgreSQL usada pelo Prisma. |
| `REDIS_URL` | Conexão com o Redis. |
| `BETTER_AUTH_URL` | URL base pública da autenticação. |
| `BETTER_AUTH_SECRET` | Assinatura das sessões. |
| `WEB_ORIGIN` | Origem permitida pelo CORS e pelo better-auth. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login Google opcional. |
| `WHATSAPP_AUTH_ENCRYPTION_KEY` | Chave de 32 bytes em base64 que cifra a sessão do WhatsApp. |
| `WHATSAPP_ADMIN_API_KEY` | Protege os endpoints administrativos (`/whatsapp`). |
| `ASSISTANT_WORKFLOW_URL` | Webhook do agente no n8n. |
| `ASSISTANT_WORKFLOW_KEY` | Chave enviada pelo server ao webhook e exigida nos endpoints que o n8n chama (`/assistant-m2m`). |
| `AI_PROVIDER` | Provedor de IA usado na extração de bases de conhecimento (`openai` ou `groq`). |
| `OPENAI_API_KEY`, `GROQ_API_KEY` | Chave do provedor escolhido; sem ela o server não sobe. |
| `SECURO_API_URL` | Base da API interna do Securo. |
| `SECURO_ADMIN_EMAIL`, `SECURO_ADMIN_PASSWORD` | Credenciais administrativas do Securo. |
| `SECURO_PROVISION_SECRET` | Segredo para derivar as credenciais de cada perfil no Securo. |
| `SEED_PROFILE_*` | Dados opcionais usados por `npm run db:seed`. |

Consulte a seção global de [variáveis de ambiente](../docs/README.md#variáveis-de-ambiente) para detalhes operacionais e cuidados com os segredos.

## Superfícies HTTP

O backend expõe quatro tipos de interface:

| Público | Autenticação | Prefixos principais |
|---|---|---|
| Painel web | cookie de sessão | `/api/auth`, `/profile/me`, `/events/me`, `/finance/me`, `/api-keys/me` |
| Agente (n8n) | `x-api-key` ou `Authorization: Bearer` com `ASSISTANT_WORKFLOW_KEY` | `/assistant-m2m/runs/:runId/*` |
| Administração | `x-admin-key` com `WHATSAPP_ADMIN_API_KEY` | `/whatsapp` |
| Integrações externas | `Authorization: Bearer jrv_…` | `/v1` |

Os endpoints com sessão nunca recebem o `profileId` do cliente; ele é obtido da sessão. As rotas do agente também não: recebem só o `runId`, o perfil vem da run (que só vale enquanto está `PROCESSING`), e são destinadas à rede interna. Todas as ferramentas do assistente passam por `POST /assistant-m2m/runs/:runId/tools/execute`.

## Banco e Prisma

```bash
npx prisma generate
npx prisma migrate dev --name <nome-da-migration>
npx prisma migrate deploy
npm run db:seed
```

Não edite uma migration já aplicada. Mudanças de modelo começam em `prisma/schema.prisma` e devem gerar uma nova migration.

## Testes e qualidade

```bash
npm test
npm test -- get-next-scheduled-at
npm test -- -t "nome do teste"
npm run test:e2e
npm run test:cov
npm run lint
npm run build
```

`npm run lint` aplica correções automaticamente. Revise o diff depois de executá-lo.

## Docker

O [`Dockerfile`](Dockerfile) gera o Prisma Client e compila o NestJS no estágio `builder`. A imagem final instala apenas dependências de produção e inicia `dist/src/main.js` como usuário `node`.

O `compose.yml` da raiz injeta URLs internas para Redis e Securo e aguarda a conclusão das migrations antes de iniciar o container `server`. Veja o [guia de deploy](../DEPLOYMENT.md) para a operação completa.

## Documentação do backend

- [Eventos e scheduler](src/events/docs/README.md)
- [Chaves de API](src/api-keys/docs/README.md)
- [API pública](src/public-api/docs/README.md)
- [Integração financeira](../FINANCE.md)
- [Assistente e engenharia de prompt](../ASSISTANT.md)
- [Arquitetura completa do sistema](../docs/ARCHITECTURE.md)

## Documentação relacionada

- [Projeto completo](../docs/README.md)
- [Frontend](../web/README.md)
