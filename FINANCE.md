# Módulo financeiro (Securo como motor em segundo plano)

Este documento explica tudo que foi feito para integrar o [Securo](https://docs.usesecuro.com/docs) — gestor financeiro open source (FastAPI + PostgreSQL + Celery) — como **motor financeiro invisível** do Jarvis. O usuário nunca vê o Securo: ele conversa com o assistente no WhatsApp ou usa o front do Jarvis, e o backend faz tudo pela API HTTP do Securo rodando na rede interna do Docker.

## Visão geral da arquitetura

```
Usuário (WhatsApp) ──> n8n ──tools──> Jarvis server ──HTTP──> Securo backend ── Postgres local
Usuário (front web) ─────sessão─────> Jarvis server            (rede jarvis-internal)
```

- **Nenhuma porta do Securo é exposta publicamente.** O backend do Securo publica apenas `127.0.0.1:8000` (útil para dev local); dentro do Docker os serviços conversam pela rede privada `jarvis-internal`.
- **Cada `Profile` do Jarvis tem um usuário próprio no Securo**, criado automaticamente em segundo plano no signup. Isso dá isolamento real por usuário (workspace, contas, categorias e regras próprias).
- **O banco do Securo é local** (volume Docker `securo-pgdata`). Não há nenhuma integração externa (Pluggy, Enable Banking etc.) — só a base do Securo.

## O que foi adicionado

### 1. Docker Compose (`compose.yml`)

Cinco serviços novos, todos na rede `jarvis-internal`:

| Serviço | Papel |
|---|---|
| `securo-db` | PostgreSQL 16 (imagem `pgvector/pgvector:pg16`, a padrão do Securo), volume `securo-pgdata` |
| `securo-migrate` | Roda `alembic upgrade head` e termina — mesmo padrão do serviço `migrate` do Jarvis |
| `securo-backend` | API FastAPI na porta 8000 (publicada só em `127.0.0.1:8000`) |
| `securo-celery-worker` | Jobs em background do Securo |
| `securo-celery-beat` | Agendador: gera transações recorrentes (salário) e aplica regras de crescimento de ativos **a cada hora** |

Decisões:

- O **Redis do Jarvis é reaproveitado** pelo Securo no database 1 (`redis://redis:6379/1`) — um container a menos; os dados não se misturam com o cache do Jarvis (database 0). Atenção: o Redis é dependência dura do login do Securo (rate limiting).
- O `server` do Jarvis recebe `SECURO_API_URL=http://securo-backend:8000` via compose e passa a depender de `securo-backend`.
- `SECRET_KEY` do Securo vem da variável de interpolação `SECURO_SECRET_KEY` (defina no ambiente ou num `.env` na raiz ao lado do `compose.yml`); há um default apenas para dev.
- O frontend do Securo **não sobe** — o Jarvis é a única interface.

### 2. Banco do Jarvis (Prisma)

Novo model `SecuroAccount` (migration `20260813120000_add_securo_accounts`, escrita à mão porque o Neon estava inacessível no momento — será aplicada pelo `migrate deploy` do compose ou no próximo `npx prisma migrate dev`):

```prisma
model SecuroAccount {
  profileId        String  @unique   // 1:1 com Profile (cascade delete)
  email            String  @unique   // profile-<profileId>@jarvis.internal
  securoUserId     String?           // id do usuário no Securo
  workspaceId      String?           // workspace pessoal no Securo
  defaultAccountId String?           // conta "Carteira" padrão
  status           SecuroAccountStatus // PENDING | ACTIVE | FAILED
  observabilitys   String?           // motivo da última falha de provisioning
}
```

**Nenhuma senha é armazenada**: a senha do usuário no Securo é derivada deterministicamente por `HMAC-SHA256(SECURO_PROVISION_SECRET, profileId)`. Perdeu-se nada se o banco vazar; trocar o segredo invalida todas as senhas (seria preciso reprovisionar).

### 3. Módulo `server/src/finance/`

```
finance/
  finance.module.ts                       # imports: AuthModule (forwardRef), ProfileModule
  constants/                              # chaves de cache, defaults (BRL, pt-BR), vocabulário Securo
  entities/securo-api.schemas.ts          # Zod para as respostas críticas do Securo (auth/workspace/conta)
  services/
    securo-api.service.ts                 # client HTTP baixo nível (fetch, Bearer, X-Workspace-Id, erros -> Nest exceptions)
    securo-provisioning.service.ts        # cria contas Securo, tokens, bootstrap do admin
    finance.service.ts                    # operações de domínio por profileId (traduz DTO -> payload Securo)
  controllers/
    finance-m2m.controller.ts             # /finance-m2m/:profileId/... (n8n, sem auth — rede interna)
    finance.controller.ts                 # /finance/me/... (front, sessão better-auth)
  dto/                                    # 17 DTOs class-validator (create/update/find por área)
```

#### Provisionamento automático (o "em segundo plano")

1. **Signup no Jarvis** → hook `databaseHooks.user.create.after` do better-auth cria o `Profile` (como antes) e agora dispara `SecuroProvisioningService.provisionInBackground(profile)` — fire-and-forget: o signup nunca espera nem falha por causa do Securo.
2. O provisioning:
   - Garante o **usuário de serviço admin** no Securo: no primeiro boot (`GET /api/setup/status` → sem usuários) chama `POST /api/setup/create-admin` com `SECURO_ADMIN_EMAIL/PASSWORD` (moeda BRL, idioma pt-BR); depois disso, faz login normal.
   - Cria o usuário do perfil via **`POST /api/admin/users`** (caminho admin: sem rate limit e sem depender de registro aberto — o `POST /api/auth/register` público é limitado a 3/hora por IP, inviável para o server). O Securo então cria sozinho: workspace **"Pessoal"**, conta **"Carteira"** (BRL), **16 categorias padrão em pt-BR** (mercado, transporte, salário…) e ~6 regras universais (Uber, streaming…).
   - Faz login como o usuário, descobre o `workspaceId` e o id da "Carteira" e grava tudo em `securo_accounts` com status `ACTIVE`.
3. **Autocorreção (lazy)**: toda operação financeira chama `ensureSecuroAccount` antes — se o perfil ainda não tem conta `ACTIVE` (perfis antigos, falha anterior, Securo fora do ar na hora do signup), o provisioning roda na hora. Falhas ficam registradas em `status = FAILED` + `observabilitys`.

#### Autenticação e cache

- O Securo emite **JWT com 24h de validade, sem refresh**. Os tokens (admin e por perfil) são cacheados no **Redis** por 23h (`finance:securo:user-token:<profileId>` / `finance:securo:admin-token`) — primeiro uso real do `RedisService` fora do cache de eventos.
- Login do Securo é `application/x-www-form-urlencoded` e tem rate limit de **5 tentativas/min por IP**; com o cache, cada perfil loga no máximo ~1x/dia.
- Toda chamada de domínio envia `Authorization: Bearer <token>` e `X-Workspace-Id` explícito.

#### Tradução Jarvis ⇄ Securo (regras importantes)

- **Valores sempre positivos**; a direção é o campo `type`: `debit` = despesa, `credit` = receita. O Securo **não valida** esses enums (string livre no banco dele), então os DTOs validam com `@IsIn(...)` antes de enviar.
- Dinheiro é enviado como **string com 2 casas** (`"50.50"`) para evitar ruído de float — o Securo usa `Numeric(15,2)`.
- Datas são **`YYYY-MM-DD`** (sem hora, sem timezone).
- DTOs em camelCase → payload snake_case (`categoryId` → `category_id`); campos não informados são omitidos (PATCH do Securo é `exclude_unset`: omitido = não mexe).
- `accountId` omitido em transações/recorrências → usa a **"Carteira"** padrão do perfil.
- Moeda default **BRL** em contas, metas, recorrências e ativos; em transações a moeda default é a da conta.

### 4. Endpoints

Duas fachadas com os mesmos recursos:

- **M2M para o n8n** (sem auth de app, protegido pela rede interna — mesmo modelo do `events-m2m`): `/finance-m2m/:profileId/...`
- **Front com sessão** (better-auth, padrão `requireSession` + `ensureAuthProfile`): `/finance/me/...`

| Área | Rotas (sufixo após o prefixo) |
|---|---|
| Contas | `GET/POST .../accounts` |
| Transações | `POST/GET .../transactions`, `PATCH/DELETE .../transactions/:transactionId` |
| Categorias | `GET/POST .../categories`, `PATCH/DELETE .../categories/:categoryId` |
| Regras | `GET/POST .../rules`, `PATCH/DELETE .../rules/:ruleId` |
| Metas | `GET/POST .../goals`, `PATCH/DELETE .../goals/:goalId` |
| Recorrências (salário) | `GET/POST .../recurring-transactions`, `PATCH/DELETE .../recurring-transactions/:recurringTransactionId` |
| Investimentos | `GET/POST .../assets`, `POST .../assets/:assetId/values`, `GET/POST .../assets/:assetId/trades`, `DELETE .../assets/:assetId` |

O `GET .../transactions` aceita `from`, `to`, `type`, `categoryId`, `accountId`, `q`, `page`, `limit` e devolve o envelope do Securo `{ items, total, page, limit, summary }` — o `summary` traz `income`, `expense` e `net` de todo o período filtrado (perfeito para "quanto gastei esse mês").

### 5. Tools do assistente (`assistant/tools/finance.tools.ts`)

Sete tools novas publicadas em `ASSISTANT_TOOLS` (enviadas ao n8n em toda mensagem), com descrições em pt-BR ensinando o vocabulário ao modelo. O tipo `AssistantToolEndpoint` ganhou o método `PATCH`.

| Tool | Endpoints |
|---|---|
| `finance-accounts` | `list_accounts`, `create_account` |
| `finance-transactions` | `create_transaction`, `list_transactions`, `update_transaction`, `delete_transaction` |
| `finance-categories` | `list_categories`, `create_category`, `update_category`, `delete_category` |
| `finance-rules` | `list_rules`, `create_rule`, `update_rule`, `delete_rule` |
| `finance-goals` | `list_goals`, `create_goal`, `update_goal`, `delete_goal` |
| `finance-recurring` | `list_recurring_transactions`, `create_recurring_transaction`, `update_recurring_transaction`, `delete_recurring_transaction` |
| `finance-investments` | `list_assets`, `create_asset`, `add_asset_value`, `list_asset_trades`, `record_asset_trade`, `delete_asset` |

Notas de comportamento que as tools já explicam ao modelo:

- **Salário** = recorrência com `type: credit`, `frequency: monthly` e `dayOfMonth` no dia do pagamento. O celery-beat do Securo materializa a transação real automaticamente (a cada hora) quando vence.
- **Regras**: `create_rule` aplica retroativamente por padrão (`applyToExisting: true`) sem sobrescrever categorias manuais. O endpoint destrutivo `apply-all` do Securo (reseta notas/categorias) **não foi exposto** de propósito.
- **Metas**: progresso manual — o modelo atualiza `currentAmount` quando o usuário diz que guardou dinheiro.
- **Investimentos**: `record_asset_trade` recalcula preço médio, custo e ganho realizado; vender mais do que possui é rejeitado pelo Securo (422).

### 6. Variáveis de ambiente novas (`server/.env`)

```dotenv
SECURO_API_URL=http://localhost:8000        # no Docker o compose injeta http://securo-backend:8000
SECURO_ADMIN_EMAIL=admin@jarvis.internal    # usuário de serviço criado no primeiro boot do Securo
SECURO_ADMIN_PASSWORD=<senha forte>
SECURO_PROVISION_SECRET=<segredo longo>     # deriva as senhas por perfil; NÃO trocar depois de provisionar
```

E opcionalmente, na raiz (interpolação do compose): `SECURO_SECRET_KEY=<segredo do JWT do Securo>`.

### 7. Testes

- `finance.service.spec.ts` — mapeamento de payloads (conta padrão, dinheiro como string, snake_case, PATCH só com campos enviados, defaults BRL).
- `securo-provisioning.service.spec.ts` — curto-circuito de conta ACTIVE, fluxo completo de provisioning, marcação de FAILED, cache de token.
- `main.tools.spec.ts` — catálogo completo das 7 tools financeiras + garantia de que toda tool usa `/finance-m2m/:profileId`.

`npm test`: 6 suítes, 34 testes passando. `npm run build` e `npm run lint` limpos.

## Como subir

```bash
# 1. Preencha server/.env com as variáveis SECURO_* (ver acima)
# 2. Na raiz:
docker compose up -d --build
```

O primeiro `up` builda o backend do Securo, roda as migrations dele (`securo-migrate`) e as do Jarvis (`migrate`). No primeiro request financeiro (ou primeiro signup), o Jarvis cria o admin do Securo sozinho — não é preciso acessar o Securo manualmente.

Dev local sem Docker para o server: suba só o Securo (`docker compose up -d securo-backend securo-celery-worker securo-celery-beat redis`) e use `SECURO_API_URL=http://localhost:8000`.

## Limitações e escolhas conscientes

- **Sem integrações bancárias** (Pluggy etc.) — só a base do Securo, como pedido.
- **Metas com tracking manual** — os modos de tracking vinculado a conta/ativo do Securo existem, mas não foram expostos para manter o fluxo simples.
- **Transferências entre contas, orçamentos (budgets) e importação de arquivos** do Securo não foram expostos ainda — são candidatos naturais a próximas tools.
- Provisioning não tem fila/retry automático além do lazy ensure: se o Securo estiver fora do ar, a conta fica `FAILED` e é reprovisionada na próxima operação financeira do perfil.
- O front web ainda não tem telas financeiras; os endpoints `/finance/me/*` já estão prontos para isso.
