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
3. With a profile, it loads the last 10 messages, persists the user message, and POSTs to an **external n8n workflow** (`ASSISTANT_WORKFLOW_URL`, `x-api-key: ASSISTANT_WORKFLOW_KEY`). The payload carries the system directive, `profileId`, `profile.about`, history, and `ASSISTANT_TOOLS`.
4. The n8n response is validated with a Zod schema, persisted as an `AI` message, and sent back over WhatsApp.

**No LLM runs in this repo.** The model, tool calling, and reasoning all live in n8n. The backend supplies the prompt (`assistant/config/guideline.config.ts`), the tool catalogue, and the M2M HTTP endpoints n8n calls back into.

### The tool catalogue

`assistant/tools/main.tools.ts` exports `ASSISTANT_TOOLS`, an array of `AssistantTool` descriptors (module, description, endpoints with method/path/whenToUse/request/response) shipped to n8n on every message. Adding a capability for the assistant means: build the `*-m2m` controller, then describe it as a tool here. `main.tools.spec.ts` asserts the catalogue's shape — update it when you add a tool.

M2M endpoints (`/events-m2m/*`) are unauthenticated at the app level; they are protected only by the private `jarvis-internal` Docker network. Never expose them publicly.

### Events (scheduling)

Two-table split: `EventSeries` holds the rule (`UNIQUE` | `RECURRENCE`, interval, mode), `EventExecution` holds one concrete firing with status `PENDING → PROCESSING → COMPLETED | FAILED | CANCELLED`.

- `EventsSchedule` runs `@Cron(EVERY_10_MINUTES)`: claims due pendings by bulk-marking them `PROCESSING`, sends each via WhatsApp, then writes the terminal status. Failure reasons go into the `observabilitys` column. **No retries.**
- Every scheduled instant is rounded to the nearest 10 minutes (ties round forward) by `normalizeScheduledAt` so it lines up with the cron tick.
- The next occurrence is created *after* a firing completes, looping `getNextScheduledAt` until strictly in the future. The `@@unique([eventSeriesId, scheduledAt])` constraint is the dedupe guard — Prisma `P2002` is caught and swallowed on purpose.
- Timezone is an IANA string on `Profile` (default `America/Sao_Paulo`), not on the series. All date math uses Luxon in the profile's zone, then stores UTC.

`server/src/events/docs/README.md` (pt-BR) documents endpoints and rules in more detail; keep it in sync with behavior changes.

### Auth

`better-auth` is mounted **outside** the Nest pipeline: `main.ts` creates the app with `bodyParser: false` and registers `toNodeHandler(authService.instance)` on `/api/auth` *before* `express.json()`. Adding global body parsing above that mount will break auth.

A `databaseHooks.user.create.after` hook calls `ProfileService.ensureAuthProfile`, so every signup gets a `Profile` with a generated 10-char token and (initially) the email as its `jid` placeholder — later overwritten when the user pairs over WhatsApp. Route protection is manual: controllers call `BetterAuthService.requireSession(request.headers)`; there is no guard.

### Persistence

`PrismaService` extends `PrismaClient` using the `@prisma/adapter-pg` driver adapter (required for the Neon pooler). Baileys session credentials are stored in the `whatsapp_auth` table, **AES-encrypted** by `WhatsappAuthCryptoService` with `WHATSAPP_AUTH_ENCRYPTION_KEY`. Losing that key means re-scanning the QR.

`RedisModule` is `@Global()` and connects on boot (`REDIS_URL`, injected by compose). Consumers: the events schedule cache and the finance module's Securo token cache.

### Finance (Securo)

`securo/` vendors the Securo open-source finance manager (FastAPI + Postgres + Celery); the root compose runs its backend, migrations, and celery worker/beat on `jarvis-internal` (DB in the `securo-pgdata` volume, Redis shared with Jarvis on database 1, port published only on `127.0.0.1:8000`). `server/src/finance/` proxies it per profile: every `Profile` gets its own Securo user, provisioned in background on signup (better-auth hook) and lazily self-healed on first use. Credentials are deterministic (`HMAC(SECURO_PROVISION_SECRET, profileId)` — never stored); JWTs are cached in Redis for 23h. User creation goes through Securo's admin API (`SECURO_ADMIN_*` env vars; the admin itself is bootstrapped via `/api/setup/create-admin` on first boot). Two facades expose the same operations: `/finance-m2m/:profileId/*` for n8n tools and `/finance/me/*` for the web (session). Amounts are always positive with direction in `type` (`debit`/`credit`), money is sent as 2-decimal strings, dates are `YYYY-MM-DD`, and Securo's unvalidated enums are enforced in the DTOs (`securo-vocab.constant.ts`). `FINANCE.md` (pt-BR, repo root) is the detailed doc — keep it in sync with behavior changes.

## Conventions

- Modules follow `controllers/ services/ dto/ entities/ utils/ schedules/`; tests are `*.spec.ts` colocated next to the unit under test (`rootDir` is `src`).
- Global `ValidationPipe` uses `whitelist`, `forbidNonWhitelisted`, `transform` — every request body/query needs a `class-validator` DTO or it will be rejected.
- Inbound external payloads (the n8n response) are validated with Zod; internal HTTP DTOs use class-validator. Both patterns coexist by design.
- User-facing strings, prompts, and module docs are pt-BR; code identifiers, comments in newer files, and commit messages are English.
- `WhatsappModule` ↔ `AssistantModule` is a circular dependency resolved with `forwardRef` on both sides.
