# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who use Jarvis as a personal assistant over WhatsApp and are sold the service as end clients (not developers). They talk to Jarvis in chat day to day; they open the web app (`web/`) to sign in, pair their WhatsApp, and check or correct what the assistant recorded: reminders, transactions, recurring bills, savings goals, investments, plan and profile. A smaller group of power users uses the settings area: API keys and docs for the public `/v1` API, the API health-check "Sentinela", and knowledge bases the assistant searches. *(Inferred from CLAUDE.md, the routes in `web/src/App.tsx` and saved feedback; not interviewed.)*

## Product Purpose

Jarvis turns a WhatsApp conversation into a personal organiser: it schedules one-off and recurring reminders, records spending and income, tracks fixed bills, goals and investments, and answers from the user's own knowledge bases. The web app is the control panel for that conversation. Success: a client understands their month and their upcoming reminders at a glance, and can register or fix a transaction in a few steps.

## Positioning

The assistant lives inside the chat the user already has open all day; there is no app to learn for the daily work. The web panel exists to review and adjust, not to replace the conversation.

## Operating Context

- WhatsApp is the primary interface; the web has no chat UI.
- Onboarding: sign up on the web, then send a 10-character token to the assistant's WhatsApp number to pair (`isWhatsappLinked`).
- Plans gate features (`Subscription.plan`, `PlanLocked`); finance and events depend on the plan.
- Money is BRL, dates and copy are pt-BR, timezone per profile (default `America/Sao_Paulo`).
- Finance amounts can be hidden with the privacy toggle.

## Capabilities and Constraints

- Stack: React 19 + Vite + react-router, a single global stylesheet (`web/src/index.css`) with shared primitives in `web/src/components/ui/`, recharts for the monthly chart, better-auth for sessions.
- Finance navigation stays at four tabs (Visão geral, Transações with Lançamentos/Contas fixas toggle, Metas, Investimentos) plus a gear for accounts/categories/rules.
- Forms open in modals; buttons use SVG icons, never text arrows or emoji.
- Content area is fluid on desktop (no centered max-width column).

## Brand Commitments

- Name: Jarvis. Tagline: "Assistente pessoal por WhatsApp".
- Logo: the rounded-square "note" icon (dot top-left + three fading lines) and the JARVIS wordmark set in Michroma. As of 2026-11 the icon is rendered monochrome (light on dark, navy on cream) instead of the orange gradient; source PNGs in `images/` keep the original orange.
- The user explicitly asked (2026-11) for the app to resemble Linear / Grok, in two themes: one dark on black, one off-white / cream with a matching navy blue; the theme follows the OS and can be switched and remembered. The login is minimal, Grok-style.
- Copy is pt-BR, concrete and product-focused.

## Evidence on Hand

- Brand assets: `images/logo.png`, `images/marca.png`, `images/variacao.png`, `images/lookup-main.png`; SVG recreation in `web/src/components/ui/wordmark.tsx`.
- No testimonials, customer logos, metrics or pricing claims exist for the web; none may be invented. The login chat example is illustrative.

## Product Principles

1. The conversation is the product; the panel reviews and corrects it.
2. Short path to the common task: see the month, register or fix a transaction, check the next reminder.
3. Clients, not developers: no technical costume on client screens; technical depth stays in Configurações.
4. Nothing that looks generated: no decorative labels, badges or symbols standing in for real content.
