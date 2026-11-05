# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Monorepo without a workspace tool — each app manages its own `node_modules`:

- `server/` — NestJS 11 backend (the bulk of the code), Prisma 7 + PostgreSQL (Neon), Baileys WhatsApp client
- `web/` — React 19 + Vite frontend (login / password reset / profile pages via better-auth)
- `ui ux/` — static design mockups (PNG), not code
- `vibe-git/`, `vibe-git.config.json` — third-party commit/PR tooling config (conventional commits in English, PR bodies in pt-BR)

`DEPLOYMENT.md` (pt-BR) is the source of truth for VPS deploy and the n8n network wiring.

## Commands

All server commands run from `server/`:

```bash
npm run dev            # nest start --watch
npm run build          # nest build
npm run lint           # eslint with --fix
npm run format         # prettier
npm test               # jest (unit, *.spec.ts under src/)
npm test -- get-next-scheduled-at        # single test file by path substring
npm test -- -t "rounds to the nearest"   # single test by name
npm run test:e2e       # jest --config ./test/jest-e2e.json
npm run db:seed        # prisma db seed (needs SEED_PROFILE_* env vars)
npx prisma migrate dev --name <name>     # create + apply migration
npx prisma generate    # after any schema.prisma change
```

Web commands run from `web/`: `npm run dev` (port 5173), `npm run build`, `npm run lint`.

Docker (repo root): `docker compose up -d --build`. The `migrate` service runs `prisma migrate deploy` and the `server` service waits for it to exit 0 and for `redis` to become healthy. Never run `docker compose down -v` in production.

Prisma reads its config from `server/prisma.config.ts` (schema path, seed command, `DATABASE_URL`) — `schema.prisma` has no `url` in its datasource block.

## Architecture

### Message flow (the core loop)

WhatsApp is the primary interface; there is no chat UI.

1. `WhatsappConnectionService` (`OnModuleInit`) opens a Baileys socket and wires `messages.upsert` → `WhatsappReceiverService`, which filters to `type === 'notify'` and non-`fromMe` messages.
2. `AssistantMainService.receiveMessage` resolves the `Profile` by `jid`. **No profile → `AssistantConnectionService`**: it looks for a 10-char alphanumeric token in the message body and, if it matches a `Profile.token`, binds that profile's `jid` to the sender. That's the entire onboarding path.
3. With a profile, `AssistantRunService.start` opens an `AssistantRun` (`assistant_runs`: `profileId`, `waMessageId` = Baileys `key.id`, status `PROCESSING → COMPLETED | FAILED`, `error`). `@@unique([profileId, waMessageId])` is the idempotency guard: a redelivered message hits `P2002` and is skipped without calling n8n. Then it persists the user message (with `runId`) and POSTs **only `{ runId }`** to the **external n8n workflow** (`ASSISTANT_WORKFLOW_URL`, `x-api-key: ASSISTANT_WORKFLOW_KEY`).
4. n8n reads everything back by `runId` from `assistant/controllers/assistant-m2m.controller.ts`: `GET /assistant-m2m/runs/:runId/context` (`directive` = `DEFAULT_DIRECTIVE` only, `profileContext`, `currentMessage`, `lastMessages` = 10 before the current one, newest first, `knowledge`, `now`/`nowHuman`/`timezone`) and `GET /assistant-m2m/runs/:runId/tools` (`tools` filtered by plan + `reference`, the rendered "# Ferramentas disponíveis"). It builds the prompt (XML blocks) and runs the agent; `n8n.json` at the repo root is the workflow export.
5. The n8n response is validated with a Zod schema, persisted as an `AI` message (with `runId`), sent back over WhatsApp, and the run is marked `COMPLETED`. Any error after the run exists marks it `FAILED` with the message. No retries; a run stuck in `PROCESSING` is never reprocessed (on purpose, to avoid doing an action twice).

**No LLM runs in this repo.** The model, tool calling, and reasoning all live in n8n. The backend supplies the prompt (`assistant/config/guideline.config.ts`), the tool catalogue, and the M2M HTTP endpoints n8n calls back into.

### The tool catalogue

`assistant/tools/main.tools.ts` exports `ASSISTANT_TOOLS`, an array of `AssistantTool` descriptors (`name`, `description`, `whenToUse`, optional `minPlan`, structured `operations[]` with fields/example/notes). Today: `events`, `finance`, `database_information`. `renderToolsReference` (`assistant/utils/build-system-prompt.ts`) renders them as the `reference` text of the tools endpoint. n8n has a **single** tool node, `executar_ferramenta` (`tool`, `operation`, `data` via `$fromAI`, `data` always a JSON string), that calls `POST /assistant-m2m/runs/:runId/tools/execute` with `{ tool, operation, data }` (`data` object or JSON string, parsed by `ExecuteOperationDto`). `AssistantToolDispatcherService` routes it to the handler registered for `tool`.

Handlers implement `AssistantToolHandler` (`assistant/tools/tool-handler.ts`) and are marked `@AssistantToolHandlerFor('<name>')`; `AssistantToolRegistry` discovers them via `DiscoveryService` on boot and **the app fails to start** if a tool in `ASSISTANT_TOOLS` has no handler (or two). Current handlers: `events/services/events-tool.service.ts`, `finance/services/finance-tool.service.ts`, `database-information/services/database-information-tool.service.ts`. Adding a tool = descriptor in `assistant/tools/` + entry in `main.tools.ts` + decorated handler in its module; **nothing changes in n8n**. `main.tools.spec.ts` asserts the catalogue's shape — update it when you add a tool.

The `/assistant-m2m/runs/*` endpoints are guarded by `AssistantToolGuard` (`ASSISTANT_WORKFLOW_KEY` via `x-api-key` or `Authorization: Bearer`), use `M2mExceptionFilter` (`{ error: { code, message, fields? } }`), and should only be reached over the private `jarvis-internal` Docker network. Never expose them publicly. A `runId` is only valid while its run is `PROCESSING` (missing → `not_found`, finished → `conflict`). The profile always comes from the run, never from the model, and the plan is re-checked on every execute (tool outside the plan or operation of another tool → `unsupported_operation`).

### Events (scheduling)

Two-table split: `EventSeries` holds the rule (`UNIQUE` | `RECURRENCE`, interval, mode), `EventExecution` holds one concrete firing with status `PENDING → PROCESSING → COMPLETED | FAILED | CANCELLED`.

- `EventsSchedule` runs `@Cron(EVERY_10_MINUTES)`: claims due pendings by bulk-marking them `PROCESSING`, sends each via WhatsApp, then writes the terminal status. Failure reasons go into the `observabilitys` column. **No retries.**
- Every scheduled instant is rounded to the nearest 10 minutes (ties round forward) by `normalizeScheduledAt` so it lines up with the cron tick.
- The next occurrence is created *after* a firing completes, looping `getNextScheduledAt` until strictly in the future. The `@@unique([eventSeriesId, scheduledAt])` constraint is the dedupe guard — Prisma `P2002` is caught and swallowed on purpose.
- Timezone is an IANA string on `Profile` (default `America/Sao_Paulo`), not on the series. All date math uses Luxon in the profile's zone, then stores UTC.

`server/src/events/docs/README.md` (pt-BR) documents endpoints and rules in more detail; keep it in sync with behavior changes.

### Public API (API keys)

Users can call Jarvis from outside via a per-profile API key. Two modules:

- `api-keys/` — key lifecycle + `ApiKeyGuard`. Keys look like `jrv_<32 chars>`; only the SHA-256 `hash` and a display `prefix` are stored, the secret is returned once on `POST /api-keys/me`. Management endpoints (`/api-keys/me*`) are session-protected. The guard reads `Authorization: Bearer <key>` (or `x-api-key`), resolves the owner `Profile` onto `request.apiKeyProfile`, exposed via `@ApiKeyProfile()`.
- `public-api/` — the versioned public surface under `/v1`, class-level `@UseGuards(ApiKeyGuard)`. Today: `POST /v1/messages` sends a text to the key owner's own WhatsApp (`409` if not paired yet). Adding a public endpoint = DTO + service method + route here, then document it in both `public-api/docs/README.md` and the web docs page (`web/src/features/settings/pages/api-docs-page.tsx`).

### Auth

`better-auth` is mounted **outside** the Nest pipeline: `main.ts` creates the app with `bodyParser: false` and registers `toNodeHandler(authService.instance)` on `/api/auth` *before* `express.json()`. Adding global body parsing above that mount will break auth.

A `databaseHooks.user.create.after` hook calls `ProfileService.ensureAuthProfile`, so every signup gets a `Profile` with a generated 10-char token and `jid = null` — set when the user pairs over WhatsApp. `isWhatsappLinked` (`profile/entities/profile-me.view.ts`) is the null check; anything that sends to `profile.jid` must handle the unpaired case. Route protection is manual: controllers call `BetterAuthService.requireSession(request.headers)`; there is no session guard. Plan restrictions are the exception — see *Plans and access* below.

### Plans and access

`Subscription.plan` (unique Int) identifies a plan and ranks it: higher number = higher tier, access is `plan >= minimum`. New plans take the lowest unused number from 1, and plans are **never deleted** (`SubscriptionService.deactivate` sets `active = false`) so numbers keep their rank. `subscription/constants/subscription-plans.constant.ts` holds `FREE_TIER_PLAN` and `PLAN_FEATURE_MIN_PLAN` — the minimum plan of the core features only (events, full finance, unlimited messages); `getPlanFeatures(plan)` derives the booleans the web shows (`features` on `/subscriptions` and `/profile/me`). Other modules declare their minimum locally and are **not** added to that constant.

- **Client routes (web session, `/v1` API key):** `@RequiresPlan(n)` on a controller or a route (route wins). It sets metadata + `PlanGuard`, which delegates to `PlanAccessService`: caller = `request.apiKeyProfile`, else the better-auth session; no identity → 401, plan too low → 403 `{ code: 'plan_required', requiredPlan, currentPlan }`. `SubscriptionModule` is `@Global()`, so no module import is needed. With `@UseGuards(ApiKeyGuard)` on the same class, write `@RequiresPlan` **above** it so the key is resolved first.
- **M2M (n8n):** no `PlanGuard`. `AssistantToolsService.forPlan(plan)` filters `ASSISTANT_TOOLS` by `minPlan` (on the tool and, optionally, on each operation) for `GET /assistant-m2m/runs/:runId/tools`, so the model only sees what the user's plan unlocks; `AssistantToolDispatcherService` checks the same filtered list on every execute.

### AI and knowledge bases

`ai/` is the only place the backend talks to an LLM directly (the assistant itself still runs in n8n). `AiProvider` (abstract class, also the DI token) is the vendor-neutral contract: `extract({ content, instructions, schema })` validated by Zod. `openai/` and `groq/` are adapters over the OpenAI-compatible `/chat/completions` (plain `fetch`); `AiModule` picks one by `AI_PROVIDER` and wraps it in `AiService`, a decorator that retries only `AiProviderError`s flagged `retryable`. Models, base URLs, timeout and retry policy are constants, not env. Consumers import `AiModule` and inject `AiProvider`; the chosen provider's API key is asserted on boot.

`database-information/` stores up to 10 text bases per profile (`/database-information/me`, session-protected). Create/update call the LLM inside the request to extract `name` and `description`; on failure it answers 502 and saves nothing. See `database-information/docs/README.md`. The assistant reads them through the `database_information` tool (operation `get_database_information`, via `executar_ferramenta`). The run context (`GET /assistant-m2m/runs/:runId/context`) carries `knowledge: [{ id, name, description }]` (empty when the plan lacks the tool); n8n renders it as `<bases_de_conhecimento>` so the model picks a base by description and passes the `id`.

### Persistence

`PrismaService` extends `PrismaClient` using the `@prisma/adapter-pg` driver adapter (required for the Neon pooler). Baileys session credentials are stored in the `whatsapp_auth` table, **AES-encrypted** by `WhatsappAuthCryptoService` with `WHATSAPP_AUTH_ENCRYPTION_KEY`. Losing that key means re-scanning the QR.

`RedisModule` is `@Global()` and connects on boot (`REDIS_URL`, injected by compose). Consumers: the events schedule cache and the finance module's Securo token cache.

### Finance (Securo)

`securo/` vendors the Securo open-source finance manager (FastAPI + Postgres + Celery); the root compose runs its backend, migrations, and celery worker/beat on `jarvis-internal` (DB in the `securo-pgdata` volume, Redis shared with Jarvis on database 1, port published only on `127.0.0.1:8000`). `server/src/finance/` proxies it per profile: every `Profile` gets its own Securo user, provisioned in background on signup (better-auth hook) and lazily self-healed on first use. Credentials are deterministic (`HMAC(SECURO_PROVISION_SECRET, profileId)` — never stored); JWTs are cached in Redis for 23h. User creation goes through Securo's admin API (`SECURO_ADMIN_*` env vars; the admin itself is bootstrapped via `/api/setup/create-admin` on first boot). Two facades expose the same operations: the `finance` assistant tool (`FinanceToolService`, via `/assistant-m2m/runs/:runId/tools/execute`) for n8n and `/finance/me/*` for the web (session). Amounts are always positive with direction in `type` (`debit`/`credit`), money is sent as 2-decimal strings, dates are `YYYY-MM-DD`, and Securo's unvalidated enums are enforced in the DTOs (`securo-vocab.constant.ts`). `docs/FINANCE.md` (pt-BR) is the detailed doc — keep it in sync with behavior changes.

## Conventions

- Modules follow `controllers/ services/ dto/ entities/ utils/ schedules/`; tests are `*.spec.ts` colocated next to the unit under test (`rootDir` is `src`).
- **Controllers contain no business logic.** They read the request (params, body, session), call a service method, and return its result — optionally mapped by an `entities/*.view.ts` helper. Rules, lookups, and branching belong in services. Guards follow the same rule: they read metadata and delegate the decision to a service.
- Global `ValidationPipe` uses `whitelist`, `forbidNonWhitelisted`, `transform` — every request body/query needs a `class-validator` DTO or it will be rejected.
- Inbound external payloads (the n8n response) are validated with Zod; internal HTTP DTOs use class-validator. Both patterns coexist by design.
- User-facing strings, prompts, and module docs are pt-BR; code identifiers, comments in newer files, and commit messages are English.
- `WhatsappModule` ↔ `AssistantModule` is a circular dependency resolved with `forwardRef` on both sides.
