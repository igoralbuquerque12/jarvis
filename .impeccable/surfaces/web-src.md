---
version: 1
slug: "web-src"
primary_target: "web/src"
related_targets: []
---

# Jarvis web app (all authenticated screens + auth)

Scope: the whole `web/` app — shell, dashboard, lembretes, finanças (4 tabs + settings), planos, perfil, configurações (API, Sentinela, Conhecimento, Documentação), login and reset. Mode: **Operate** (auth screens: Operate, minimal).

Audience and job: Jarvis clients reviewing and correcting what the WhatsApp assistant recorded; short path to "see my month / register a transaction / check the next reminder".

Constraints: keep every route, component API, copy and behaviour; fluid content width; 4 finance tabs; forms in modals; SVG icons only; pt-BR.

## Direction contract

THESIS: A Linear-grade working panel for a chat assistant: quiet, dense, precise. It refuses the retro-80s costume (Orbitron caps, sunset stripes, synthwave grid, orange glow) and the uppercase-tracked label on every element.

OWN-WORLD: Two themes from one system. Dark: true black ground #08090A, inset canvas #0E0F11, cards #131416, white-alpha hairlines, ink #F2F3F5, periwinkle accent #93A8F5 derived from the navy. Light: cream ground #EEE8DC, canvas #F7F3EB, cards #FDFBF6, navy-tinted hairlines, navy ink #0F1A30, navy accent #1E3566. Inter for everything (sentence case, -0.02em on headings, tabular numerals), Michroma only in the wordmark. 6–8px controls, 12px cards, 1px borders, no wide shadows.

STORY: The client opens the panel, sees greeting, WhatsApp state, the month and next reminders in one scan, registers a transaction from the header, and reads every status the same way everywhere.

FIRST VIEWPORT: Left sidebar on the ground (mono Jarvis mark + wordmark, 6 compact nav items, user + theme toggle + sign-out at the foot); content in an inset rounded canvas: page title row with WhatsApp status chip and the primary "Nova transação" button top right, then the KPI row, then two columns of cards. Login: centred 360px column on the bare ground, mark, title, one-line pitch, Entrar/Criar conta switch, form; theme toggle top right.

FORM: Linear's inset-canvas app shell with dot-led status labels as the signature move (every state — reminder, pairing, plan, rule, API check, knowledge index — is a hairline chip with a coloured leading dot, sentence case). seed: none (pinned) — "Quero que o estilo do projeto se assemelhe ao 'grok' e o 'grok bot'. acredito que seja: Linear App. gostaria de ter 2 versões: uma dark no preto e outra num off white / creme / pastel + azul que combine (um marinho)" + "gere uma refatoração de todo o design desse projeto" (existing surfaces and layouts are the first-surface experience) + confirmed answer for the login: "Minimalista tipo Grok".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisions confirmed with the user (2026-11-26)

- Icon monochrome (light on dark, navy on cream); wordmark stays Michroma; orange leaves the app.
- Dark accent: light blue derived from the navy.
- Theme follows the OS by default; toggle in sidebar and on auth screens, remembered.
- Login: minimal, Grok-style (no side panel, no chat mock, no retro sun/grid).
