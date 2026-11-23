# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Monorepo without a workspace tool — each app manages its own `node_modules`:

- `server/` — NestJS 11 backend (the bulk of the code), Prisma 7 + PostgreSQL (the `postgres` compose service, pgvector), Baileys WhatsApp client
- `web/` — React 19 + Vite frontend (login / password reset / profile pages via better-auth)
- `ui ux/` — static design mockups (PNG), not code
- `vibe-git/`, `vibe-git.config.json` — third-party commit/PR tooling config (conventional commits in English, PR bodies in pt-BR)

`docs/DEPLOYMENT.md` (pt-BR) is the source of truth for VPS deploy, the CI/CD pipeline and the n8n network wiring.

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

Docker (repo root): `docker compose up -d --build`. The Jarvis database is the `postgres` service (`pgvector/pgvector:pg16`, db/user `jarvis`, password `JARVIS_DB_PASSWORD` from the root `.env`, URL-safe; volume `postgres-data`; published only on `127.0.0.1:${JARVIS_DB_HOST_PORT:-5432}` for local dev and SSH tunnels). Compose injects `DATABASE_URL` into `server` and `migrate` (`x-jarvis-database-url` anchor), overriding `server/.env`, whose `DATABASE_URL` (`localhost:5432`) is for local dev only. Securo keeps its own `securo-db`. There is no automatic backup of it; manual dump/restore steps are in `docs/DEPLOYMENT.md`. The `migrate` service waits for `postgres` to be healthy and runs `prisma migrate deploy`; the `server` service waits for it to exit 0 and for `postgres` and `redis` to become healthy. Never run `docker compose down -v` in production: it deletes the database volume.

CI/CD (`.github/workflows/deploy.yml`, on push to `main`) has one job per stage: `test` (server unit tests) → `version` (tag `<VERSION>-<short sha>`, SemVer from the root `VERSION` file; no `latest`) → `build` (push `jarvis-server` / `jarvis-migrate` (`builder` stage) / `jarvis-web` to Docker Hub) → `deploy` (SSH into the VPS: `docker compose pull`, `run migrate`, `up -d --no-deps server web`) → `health` (health check with rollback to the previous tag) → `status` (`docker ps` on the VPS, informational) → `notify` (always runs; posts the outcome to the owner's WhatsApp via the app's own `POST /v1/messages`, `JARVIS_API_KEY` secret; the failure reason comes from the failed job's name and, inside `deploy`, the failed step's name, so keep those names in sync with its `case`). `compose.yml` resolves those images through `JARVIS_IMAGE_NAMESPACE` / `JARVIS_VERSION` (defaults: `jarvis/*:local`). Bump `VERSION` with user-visible changes.

Prisma reads its config from `server/prisma.config.ts` (schema path, seed command, `DATABASE_URL`) — `schema.prisma` has no `url` in its datasource block.

## Architecture

### Message flow (the core loop)

WhatsApp is the primary interface; there is no chat UI.

1. `WhatsappConnectionService` (`OnModuleInit`) opens a Baileys socket and wires `messages.upsert` → `WhatsappReceiverService`, which filters to `type === 'notify'` and non-`fromMe` messages. An `audioMessage` (voice note or audio file) travels as `audio: { mimetype, seconds, download() }` on `IncomingMessageDto`; the download is lazy (Baileys `downloadMediaMessage`).
2. `AssistantMainService.receiveMessage` resolves the `Profile` by `jid`. **No profile → `AssistantConnectionService`**: it looks for a 10-char alphanumeric token in the message body and, if it matches a `Profile.token`, binds that profile's `jid` to the sender. That's the entire onboarding path.
3. With a profile, `AssistantRunService.start` opens an `AssistantRun` (`assistant_runs`: `profileId`, `waMessageId` = Baileys `key.id`, status `PROCESSING → COMPLETED | FAILED`, `error`). `@@unique([profileId, waMessageId])` is the idempotency guard: a redelivered message hits `P2002` and is skipped without calling n8n. An audio is downloaded and transcribed only now, after the profile and the run exist (`assistant/services/assistant-audio.service.ts`: limits of 10 min / 24 MB, then `TranscriptionProvider`); a failure throws `AssistantAudioError`, the run goes `FAILED` and the user gets a specific notice. Then it persists the user message (with `runId` and `contentType` `TEXT` | `AUDIO`; for audio the content is the transcription) and POSTs **only `{ runId }`** to the **external n8n workflow** (`ASSISTANT_WORKFLOW_URL`, `x-api-key: ASSISTANT_WORKFLOW_KEY`).
4. n8n reads everything back by `runId` from `assistant/controllers/assistant-m2m.controller.ts`: `GET /assistant-m2m/runs/:runId/context` (`directive` = `DEFAULT_DIRECTIVE` only, `profileContext`, `currentMessage`, `currentMessageType` = `TEXT` | `AUDIO`, `lastMessages` = 10 before the current one, newest first, each with its `contentType`, `knowledge`, `now`/`nowHuman`/`timezone`) and `GET /assistant-m2m/runs/:runId/tools` (`tools` filtered by plan + `reference`, the rendered "# Ferramentas disponíveis"). It builds the prompt (XML blocks; audio is marked `tipo="audio"` on `<mensagem_atual>` / `<mensagem>`) and runs the agent; `n8n.json` at the repo root is the workflow export. There is no memory node: the history is only the backend's `<historico_recente>` (`sessionKey` is still in the context but unused).
5. The agent talks to the user **during** the run: every message is a call to `POST /assistant-m2m/runs/:runId/messages` `{ content }` (trimmed, 1..4096 chars, `SendRunMessageDto`) → `{ sent: true }`. `AssistantMessageService` (`sendForRun`, `deliver`, `hasReplied`) sends on WhatsApp first and only then persists the `AI` message (with `runId`); a run may send several. No `jid` → 409 `conflict`, WhatsApp down → 503 `unavailable`. The agent's final text is discarded.
6. The webhook answers only `{ "status": "COMPLETED" }` (Zod, `assistant/entities/receive-message-worflow-output.ts`); anything else or a non-2xx fails the run. Safety net in `AssistantMainService`: `COMPLETED` with no `AI` message in the run → the backend sends `ASSISTANT_FALLBACK_REPLY` and completes; a failed run that sent nothing gets the same fallback (or the audio notice), best effort, after being marked `FAILED`; if something was already sent, nothing more. Constants in `assistant/constants/assistant-message.constant.ts`. `AssistantRunService.complete` / `fail` are idempotent (`updateMany` on `status: PROCESSING`, return a boolean). No retries; a run stuck in `PROCESSING` is never reprocessed (on purpose, to avoid doing an action twice).

**No LLM runs the assistant in this repo.** The model, tool calling, and reasoning all live in n8n. The backend supplies the prompt (`assistant/config/guideline.config.ts`; how to talk to the user is its section "# Como você fala com o usuário"), the tool catalogue, and the M2M HTTP endpoints n8n calls back into. The only direct model calls are in `ai/` (extraction, embeddings, audio transcription).

The webhook response contract changed with the message endpoint, so the backend and the n8n workflow must be deployed together. After editing `n8n.json`, copy the changed nodes (*Build prompt*, `enviar_mensagem`, the *Respond* nodes) into the production workflow; do not import the whole export, whose *Config* node points at a dev tunnel.

### The tool catalogue

`assistant/tools/main.tools.ts` exports `ASSISTANT_TOOLS`, an array of `AssistantTool` descriptors (`name`, `description`, `whenToUse`, optional `minPlan`, structured `operations[]` with fields/example/notes). Today: `events`, `finance`, `database_information`. `renderToolsReference` (`assistant/utils/build-system-prompt.ts`) renders them as the `reference` text of the tools endpoint. n8n has a **single** node for the whole catalogue, `executar_ferramenta` (`tool`, `operation`, `data` via `$fromAI`, `data` always a JSON string), that calls `POST /assistant-m2m/runs/:runId/tools/execute` with `{ tool, operation, data }` (`data` object or JSON string, parsed by `ExecuteOperationDto`). `AssistantToolDispatcherService` routes it to the handler registered for `tool`.

Two more n8n tool nodes are **direct** tools, outside `ASSISTANT_TOOLS` and `executar_ferramenta`, available on every plan: `enviar_mensagem` (`content`; calls `POST /assistant-m2m/runs/:runId/messages`, the only way the model reaches the user) and `browser_search` (Groq web search, no backend call). Their reference blocks live in the *Build prompt* node of `n8n.json`, not in `renderToolsReference`.

Handlers implement `AssistantToolHandler` (`assistant/tools/tool-handler.ts`; `execute(profileId, operation, data, context?)`, where `context` is `{ runId }` from the run) and are marked `@AssistantToolHandlerFor('<name>')`; `AssistantToolRegistry` discovers them via `DiscoveryService` on boot and **the app fails to start** if a tool in `ASSISTANT_TOOLS` has no handler (or two). Current handlers: `events/services/events-tool.service.ts`, `finance/services/finance-tool.service.ts`, `database-information/services/database-information-tool.service.ts`. Adding a tool = descriptor in `assistant/tools/` + entry in `main.tools.ts` + decorated handler in its module; **nothing changes in n8n**. `main.tools.spec.ts` asserts the catalogue's shape — update it when you add a tool.

The `/assistant-m2m/runs/*` endpoints (`GET :runId/context`, `GET :runId/tools`, `POST :runId/tools/execute`, `POST :runId/messages`) are guarded by `AssistantToolGuard` (`ASSISTANT_WORKFLOW_KEY` via `x-api-key` or `Authorization: Bearer`), use `M2mExceptionFilter` (`{ error: { code, message, fields? } }`), and should only be reached over the private `jarvis-internal` Docker network. Never expose them publicly. A `runId` is only valid while its run is `PROCESSING` (missing → `not_found`, finished → `conflict`). The profile always comes from the run, never from the model, and the plan is re-checked on every execute (tool outside the plan or operation of another tool → `unsupported_operation`).

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

`ai/` is the only place the backend talks to an LLM directly (the assistant itself still runs in n8n). `AiProvider` (abstract class, also the DI token) is the vendor-neutral contract: `extract({ content, instructions, schema })` validated by Zod. `openai/` and `groq/` are adapters over the OpenAI-compatible `/chat/completions` (plain `fetch`); `AiModule` picks one by `AI_EXTRACTION_PROVIDER` (`openai` | `groq`) and wraps it in `AiService`, a decorator that retries only `AiProviderError`s flagged `retryable` (`ai/utils/with-retry.util.ts`; shared HTTP in `ai/utils/provider-http.util.ts`). A second contract, `EmbeddingProvider` (also the DI token), produces the RAG vectors: `AI_EMBEDDING_PROVIDER` (`openai` only, `openai/openai-embedding.provider.ts`, `text-embedding-3-small`, 1536 dims) wrapped by `EmbeddingService` (batches + the same retry). A third contract, `TranscriptionProvider` (`ai/contracts/transcription-provider.contract.ts`, also the DI token), turns WhatsApp audios into text: `AI_TRANSCRIPTION_PROVIDER` (`groq` only, the default; `groq/groq-transcription.provider.ts`, `whisper-large-v3-turbo` over multipart `/audio/transcriptions`, language `pt`, 60s timeout) wrapped by `TranscriptionService` (same retry); `postToProvider` accepts a `FormData` body for it. The old `AI_PROVIDER` is refused on boot when `AI_EXTRACTION_PROVIDER` is missing. Models, base URLs, timeout and retry policy are constants, not env. Consumers import `AiModule` and inject `AiProvider` / `EmbeddingProvider` / `TranscriptionProvider` (`AssistantModule` imports it for audio); API keys are asserted on boot, so both `OPENAI_API_KEY` (embeddings) and `GROQ_API_KEY` (transcription) are always required.

`database-information/` stores up to 10 text bases per profile (`/database-information/me`, session-protected). Create/update call the LLM inside the request to extract `name` and `description`; on failure it answers 502 and saves nothing. After saving, the base is indexed for RAG in background (`KnowledgeIndexerService`): `indexStatus` `PENDING → PROCESSING → READY | FAILED` on `database_informations`, chunks with a `vector(1536)` embedding in `knowledge_chunks` (raw SQL; FK `ON DELETE CASCADE` to the base and the profile), a per-minute sweep (`KnowledgeIndexSchedule`) retrying `PENDING`, `FAILED` with < 3 attempts and `PROCESSING` stale for > 5 min; `POST /database-information/me/:id/reindex` retries manually. Search (`KnowledgeSearchService`) is hybrid: vector (min similarity 0.3) + `portuguese` full-text, fused by RRF, up to 5 chunks / 6000 chars, only `READY` bases of the profile, logged in `knowledge_search_logs`; no HNSW/GIN index on purpose (per-profile scans are small and exact). Tunables live in `database-information/constants/database-information.constant.ts`. See `database-information/docs/README.md`. The assistant uses the `database_information` tool with two operations, in this order: `search_knowledge` `{ query, databaseInformationId? }` → `{ query, found, results: [{ databaseInformationId, baseName, content }] }`, then `get_database_information` (whole base) when the search did not answer and a base's description suggests it helps. That rule is written in three places that must stay in sync: `assistant/config/guideline.config.ts`, the tool descriptor, and the *Build prompt* node of `n8n.json` (block "# Regra obrigatória das bases de conhecimento", only when the user has bases; after editing it, copy that node into the production workflow — do not import the whole export, whose *Config* node points at a dev tunnel). The run context (`GET /assistant-m2m/runs/:runId/context`) carries `knowledge: [{ id, name, description }]` for every base, indexed or not (empty when the plan lacks the tool); n8n renders it as `<bases_de_conhecimento>`.

### Persistence

`PrismaService` extends `PrismaClient` using the `@prisma/adapter-pg` driver adapter (over `pg`, works with any Postgres). The database needs the `vector` extension, enabled by the `add_knowledge_rag` migration (the `pgvector/pgvector` image ships it). Baileys session credentials are stored in the `whatsapp_auth` table, **AES-encrypted** by `WhatsappAuthCryptoService` with `WHATSAPP_AUTH_ENCRYPTION_KEY`. Losing that key means re-scanning the QR. On `messages`, `type` (`MessageType`: `user` | `AI`) is the author and `contentType` (`MessageContentType`: `TEXT` | `AUDIO`, default `TEXT`) is how the content arrived; `AUDIO` rows hold the transcription.

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
