---
name: Jarvis
description: Assistente pessoal por WhatsApp; the web panel where clients review and correct what the assistant recorded.
colors:
  ground: "#eee8dc"
  bg: "#f7f3eb"
  surface: "#fdfbf6"
  surface-raised: "#ffffff"
  surface-hover: "rgba(15, 26, 48, 0.045)"
  surface-active: "rgba(15, 26, 48, 0.075)"
  ink: "#0f1a30"
  ink-soft: "#424c66"
  ink-faint: "#5f687e"
  line: "rgba(15, 26, 48, 0.1)"
  line-strong: "rgba(15, 26, 48, 0.17)"
  accent: "#1e3566"
  accent-hover: "#162a52"
  accent-ink: "#f7f3eb"
  accent-text: "#24407c"
  accent-soft: "rgba(30, 53, 102, 0.085)"
  accent-line: "rgba(30, 53, 102, 0.3)"
  success: "#1b7449"
  success-soft: "rgba(27, 116, 73, 0.1)"
  danger: "#b0352a"
  danger-soft: "rgba(176, 53, 42, 0.085)"
  danger-line: "rgba(176, 53, 42, 0.3)"
  warning: "#93620a"
  code-bg: "#0f1a30"
  code-ink: "#e8ecf5"
  bubble-bg: "#1e3566"
  ground-dark: "#08090a"
  bg-dark: "#0e0f11"
  surface-dark: "#131416"
  surface-raised-dark: "#18191c"
  surface-hover-dark: "rgba(255, 255, 255, 0.04)"
  surface-active-dark: "rgba(255, 255, 255, 0.07)"
  ink-dark: "#f2f3f5"
  ink-soft-dark: "#a0a4ad"
  ink-faint-dark: "#80858f"
  line-dark: "rgba(255, 255, 255, 0.075)"
  line-strong-dark: "rgba(255, 255, 255, 0.13)"
  accent-dark: "#93a8f5"
  accent-hover-dark: "#abbcf8"
  accent-ink-dark: "#0a1024"
  accent-text-dark: "#a6b7f7"
  accent-soft-dark: "rgba(147, 168, 245, 0.12)"
  accent-line-dark: "rgba(147, 168, 245, 0.34)"
  success-dark: "#4cb782"
  danger-dark: "#f07167"
  warning-dark: "#e2b35a"
  code-bg-dark: "#0a0a0b"
  bubble-bg-dark: "#1c2645"
  switch-on-dark: "#5f78d8"
typography:
  brand:
    fontFamily: "Michroma, Inter, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.3em"
  brand-lg:
    fontFamily: "Michroma, Inter, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.34em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  figure:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  title:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
  mono:
    fontFamily: "ui-monospace, SF Mono, Cascadia Code, JetBrains Mono, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  dialog: "14px"
  full: "999px"
spacing:
  hairline-gap: "2px"
  field: "6px"
  row: "10px"
  tight: "12px"
  form: "14px"
  card: "20px"
  page-gap: "20px"
  page-x: "clamp(16px, 2.6vw, 36px)"
  page-top: "28px"
  control-h: "34px"
  control-h-sm: "28px"
  sidebar-w: "232px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "{spacing.control-h}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-active}"
    textColor: "{colors.ink-faint}"
  button-ghost:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "{spacing.control-h}"
  button-subtle:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "{spacing.control-h}"
  button-subtle-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    height: "{spacing.control-h}"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
  button-sm:
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "{spacing.control-h-sm}"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.sm}"
    size: "30px"
  icon-button-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-text}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card}"
  stat:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    rounded: "{rounded.lg}"
    padding: "14px 16px 16px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  badge-status:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 8px"
    height: "22px"
  badge-status-danger:
    textColor: "{colors.danger}"
  badge-plain:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 8px"
    height: "22px"
  key-chip:
    backgroundColor: "{colors.surface-active}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.xs}"
    padding: "1px 6px"
  badge-count:
    backgroundColor: "{colors.surface-active}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 6px"
    height: "20px"
  segmented:
    backgroundColor: "{colors.surface-active}"
    rounded: "{rounded.md}"
    padding: "{spacing.hairline-gap}"
  segmented-option-selected:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "28px"
  sidebar-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "32px"
  sidebar-link-active:
    backgroundColor: "{colors.surface-active}"
    textColor: "{colors.ink}"
  sub-nav-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "30px"
  sub-nav-tab-active:
    backgroundColor: "{colors.surface-active}"
    textColor: "{colors.ink}"
  modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "18px 22px 22px"
    width: "500px"
---

# Design System: Jarvis

## Overview

**Creative North Star: "The Quiet Ledger"**

Jarvis's web panel is a working instrument, not a showcase. The client lives in WhatsApp; they come here to read back what the assistant wrote down and to fix it. So the panel is Linear-grade quiet: dense rows, 1px hairlines, one restrained accent, and type that does all the hierarchy work in a single family. Nothing glows, nothing is in costume. The retro-80s identity the brand started with (Orbitron caps, sunset stripes, orange glow) left the app; only the Michroma wordmark carries the brand's mechanical voice, and it appears once, in the lockup.

The system is one structure in two materials. Light is cream and navy: a warm cream ground, an even paler canvas, near-white cards, navy ink and a deep navy accent. Dark is black and periwinkle: a true-black ground, stepped charcoal surfaces, white-alpha hairlines, near-white ink and a light periwinkle accent derived from the same navy. The theme follows the operating system, can be pinned from the sidebar or the auth screens, and is applied before first paint.

Depth comes from tone, not shadow: the sidebar sits directly on the ground, content lives in an inset rounded canvas one step lighter, and cards are one step lighter again. Status is read the same way everywhere, through a hairline chip led by a small coloured dot, in sentence case.

**Key Characteristics:**
- Two themes from one token set; every colour is a custom property redefined under dark.
- Tonal layering: ground, canvas, card, field, each one step apart.
- Inter for everything, sentence case, tight negative tracking on headings, tabular numerals on every figure.
- 1px hairlines everywhere; shadows only on floating layers.
- Dot-led status chips as the signature device; dots belong to states only.
- Motion is short and functional; the modal is the only animated entrance.

## Colors

A near-monochrome working palette with one accent per theme and three semantic states, each shipped as solid, soft fill and line.

### Primary
- **Deep Navy** (`accent`, light): primary buttons, the switch's on state, goal progress fills, input focus borders. Text on it is the cream `accent-ink`.
- **Readable Navy** (`accent-text`, light): links, accent-coloured text, reminder times, selected toggles, method badges. One step lighter than the fill so it reads as text, not as a button.
- **Periwinkle** (`accent-dark`): the same roles in dark. Derived from the navy, light enough to carry dark-ink (`accent-ink-dark`) on primary buttons.

### Neutral
- **Cream Ground** (`ground`) / **True Black** (`ground-dark`): the floor. Holds the sidebar, the auth screens and the page background.
- **Cream Canvas** (`bg`) / **Charcoal Canvas** (`bg-dark`): the inset content canvas.
- **Paper Card** (`surface`) / **Card Charcoal** (`surface-dark`): cards, stat tiles, modals.
- **Field White** (`surface-raised`) / **Raised Charcoal** (`surface-raised-dark`): inputs, ghost buttons, the selected segment, date tiles.
- **Hover and Active Tints** (`surface-hover`, `surface-active`): translucent ink washes for row hover, the active nav item, segmented track, count badges and icon wells.
- **Navy Ink** (`ink`) / **Near-White Ink** (`ink-dark`): primary text. `ink-soft` carries secondary text and labels, `ink-faint` carries meta, hints, placeholders and resting icons.
- **Hairline** (`line`) and **Strong Hairline** (`line-strong`): ink-tinted alpha borders. `line` divides rows and outlines cards; `line-strong` outlines controls, chips and dashed empty states.

### Semantic
- **Ledger Green** (`success` / `success-dark`): credits, positive amounts, connected and monitoring states.
- **Ledger Red** (`danger` / `danger-dark`): debits, negative amounts, failures, destructive actions.
- **Amber** (`warning` / `warning-dark`): waiting and unpaired states only (the pairing pulse, the WhatsApp "off" dot).
- Each state ships as solid, `-soft` (10–12% fill) and `-line` (30–34% border) so tinted rows and alerts never invent their own alpha.

### Fixed pieces
- **Code Panel** (`code-bg`): code blocks and the one-time secret reveal stay dark in both themes (navy in light, near-black in dark).
- **Bubble** (`bubble-bg`): the WhatsApp message preview bubble; navy in light, a deep indigo in dark.
- **The mark** inverts per theme: the tile takes the ink, the glyph takes the ground.

### Named Rules
**The One Accent Rule.** Each theme has exactly one accent hue, navy or periwinkle. It marks the primary action, focus, selection and links; it is never used as decoration or as a background wash larger than a selected chip or a current plan card (4% mix).

**The Three-Part State Rule.** A semantic colour is used as a solid, a soft fill or a line, never at an ad-hoc alpha. Green and red mean money direction and health, amber means waiting; none of them is used for emphasis.

**The Both-Themes Rule.** A new colour is a custom property defined in `:root` and redefined in both dark blocks (the `prefers-color-scheme` block and `[data-theme='dark']`). A hex literal in a component is a defect.

## Typography

**Display Font:** none (the system has no display tier)
**Body Font:** Inter (with system-ui, -apple-system, Segoe UI), optical sizing on, weights 400–700
**Brand Font:** Michroma, wordmark only
**Mono Font:** the platform monospace stack (ui-monospace, SF Mono, Cascadia Code, JetBrains Mono, Consolas)

**Character:** One sober grotesque does everything, with hierarchy from size, weight (400/500/600) and tight negative tracking rather than from families or caps. Every heading tracks at -0.015em by default; page titles and the auth heading tighten to -0.025em, card titles relax to -0.01em. Michroma's wide mechanical caps appear only in the lockup, where they carry the brand.

### Hierarchy
- **Headline** (600, 1.375rem, 1.25, -0.025em): page titles in the page header and the auth heading. One per screen.
- **Figure** (600, 1.5rem, 1.15, -0.025em, tabular): KPI values and the money input. Plan prices step up to 1.875rem at -0.03em.
- **Title** (600, 0.9375rem, -0.01em): card titles and modal titles. Docs section headings use 1.0625rem.
- **Body** (400, 0.875rem, 1.5): base text, table cells, row content (rows set it at 500). Docs prose runs at 1.6 with a 72ch measure.
- **Body small** (500, 0.8125rem): buttons, nav items, field labels, segmented options, secondary copy.
- **Label** (500, 0.75rem, sentence case): badges, meta lines, table headers, hints, sidebar section names, the small button.
- **Brand** (Michroma, 0.78rem, 0.3em tracking, uppercase; 1.15rem at 0.34em on auth): the JARVIS wordmark and nothing else.
- **Mono** (0.8125rem, 1.65): code blocks, endpoint paths, API key prefixes. The pairing token is mono at 1.0625rem, 600, 0.18em tracking so the ten characters can be read aloud.

### Named Rules
**The Sentence Case Rule.** No uppercase, no letter-spaced small caps on labels, sections, badges or table headers. The only uppercase in the product is the Michroma wordmark (and the month name's first letter).

**The Tabular Figures Rule.** Every number that can change or be compared (amounts, KPIs, counts, dates, times, pagination) uses tabular numerals.

## Layout

The app shell is a sidebar on the ground plus an inset canvas. The sidebar is 232px wide, sticky at full height, padded 16px 10px 12px: lockup on top, a flat nav list (32px rows, 1px gap, one sentence-case section label "Conta"), and a footer behind a hairline with the user's name and email, the theme toggle and sign-out. The canvas sits 8px in from the top, right and bottom edges, with a 1px hairline and 12px radius; content inside is padded 28px on top, 56px at the bottom and `clamp(16px, 2.6vw, 36px)` on the sides. Content is fluid: there is no centred max-width column on app screens.

Pages are a vertical stack with a 20px gap: page header (title left, actions right, bottom-aligned), then a KPI row (`stats`, four equal columns, 12px gap), then column grids (2fr/1fr, 3fr/2fr, even, or three) with a 20px gap. Card internals use a 16px header gap and 20px padding; forms use 14px between fields and 6px between label and control; rows use 10–12px gaps.

Auth screens drop the shell: a single 360px column centred on the bare ground, mark on top, heading, the Entrar/Criar conta segmented switch, the form, and the theme toggle in the top right.

Responsive behaviour: at 1100px column grids collapse to one column (three-column becomes two) and KPIs go to two across; at 960px the sidebar becomes a sticky top bar on the ground with icon-only nav and the canvas loses its inset, border and radius; at 600px the four-up KPI row holds as a 2×2 grid (8px gap, 12px tile padding, figures drop to 1.0625rem, labels to 0.75rem) while three-up rows stack, and list rows reflow their actions under the text; at 520px the top nav scrolls horizontally without a scrollbar.

## Elevation & Depth

The system is flat and tonal. Depth is conveyed by stepping surface tone (ground, canvas, card, field) and by 1px hairlines; cards, tiles and the canvas carry no shadow. Shadows exist only for layers that float above the page, plus a one-pixel lift on raised controls.

### Shadow Vocabulary
- **Control lift** (`--shadow-sm`: `0 1px 2px rgba(15, 26, 48, 0.06)`; dark `0 1px 2px rgba(0, 0, 0, 0.4)`): ghost buttons and the selected segmented option, so a raised control reads against its track.
- **Pop** (`--shadow-pop`: `0 4px 12px -2px rgba(15, 26, 48, 0.12), 0 20px 48px -12px rgba(15, 26, 48, 0.24)`; dark `0 8px 24px -4px rgba(0, 0, 0, 0.55), 0 28px 64px -12px rgba(0, 0, 0, 0.7)`): modals and the chart tooltip.
- **Focus halo** (`0 0 0 3px var(--accent-soft)`): fields on focus, with the border switching to the accent. Everything else focuses with a 2px `--focus` outline at 2px offset.

### Named Rules
**The Floating-Only Shadow Rule.** A shadow means "this sits above the page". Cards, tiles, rows and the canvas never get one; nest depth by tone and hairline instead.

**The No Nested Card Rule.** Inside a card, sub-items lose their box: in a list they become rows with a hairline divider, in a grid they become box-less columns (no fill, border or radius, 24px 32px gaps). Never another bordered or tinted card inside a card.

## Shapes

Gently rounded, consistent by size: small controls and nav items at 6px, standard controls, fields, rows and icon wells at 8px, cards, tiles, the canvas and empty states at 12px, and the dialog at 14px. Inline code, key chips and method badges use a tight 4px. Pills (999px) are reserved for status and plain chips, the WhatsApp status pill, the switch and progress bars; dots are 6–8px circles. Borders are always 1px (the drawn disclosure chevron uses 1.5px strokes); dashed 1px borders mark empty states, the pairing token box, the secret reveal and the health-check target preview. The JarvisMark tile is a 64-unit square with a 16-unit radius, and the WhatsApp preview bubble keeps a 4px tail corner on its bottom left.

## Components

### Buttons
Precise and low-key: 34px tall, 8px radius, 0.8125rem/500, 6px icon gap, 15px SVG icons, a 0.985 press scale.
- **Primary:** accent fill with accent-ink text; hover steps to `accent-hover`. One per view, top right of the page header or at the end of a modal.
- **Ghost:** field-white fill, strong hairline, control lift; hover mixes 5% ink into the fill. Secondary actions next to a primary.
- **Subtle:** transparent, `ink-soft` text; hover takes the hover tint and full ink. Tertiary actions and cancels.
- **Danger:** transparent with danger text; hover takes the danger soft fill. Never a solid red button.
- **Small:** 28px, 0.75rem, 6px radius, 13px icons.
- **Icon button:** 30px square, 6px radius, `ink-faint` icon; hover tint, danger variant turns red on hover, outline variant adds the strong hairline, active variant takes accent soft + accent line. Always labelled through `title` and `aria-label`.
- **Disabled:** primary and ghost buttons switch to their own resting material: the active tint as fill, `ink-faint` text, no border, no lift, no opacity change, so a disabled primary reads as unavailable rather than as a faded navy. Subtle and danger buttons fade to 50% opacity, icon buttons to 40%. All take the not-allowed cursor and skip the press scale.

### Status chips (signature)
- **Style:** a 22px pill with a 1px strong hairline, transparent fill, 0.75rem/500 sentence-case text and a 6px coloured dot leading it. Neutral dot is `ink-faint`; accent and success dots keep ink text; danger turns both text and border red.
- **Count variant:** pure numbers (`3`, `2/5`) automatically drop the dot and the border and become a 20px tabular tile on the active tint (or the success/danger/accent soft fill), 6px radius.
- **Plain variant:** taxonomy labels that are not states (an investment's asset type) use the same pill without the dot.
- **Key chip:** identifiers and versions (tickers, API key prefixes, the API version `v1`, header examples) use a 4px-radius mono chip on the active tint, never a status pill.
- **Usage:** every state in the product (reminder status, pairing, plan, rule, API check, knowledge index) uses the dotted chip, so a status reads the same on every screen. The WhatsApp status pill and the health-check status line are larger and inline relatives of the same dot-led device.

**The Dot Means State Rule.** A leading dot is reserved for state. Categories and types take the plain pill; identifiers and versions take the key chip.

### Segmented control
- **Style:** a 2px-padded track on the active tint, 8px radius; options are 28px, 0.8125rem/500, `ink-soft`.
- **State:** the selected option lifts to field-white with a hairline and control lift. The tone variant colours the selected option red or green (Despesa / Receita). Used for the auth switch, list toggles and the transaction type; the API docs language tabs follow the same pattern.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** `surface` on the canvas.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px `line`.
- **Internal Padding:** 20px; flush cards drop padding for lists and tables and pad only the header (16px 20px 0). Header: 0.9375rem/600 title, 0.8125rem `ink-soft` subtitle, actions aside that wraps under the title when space runs out.
- **Stat tile:** same material, 14px 16px 16px padding, an `ink-soft` label with a 14px `ink-faint` icon, a 1.5rem tabular figure, a 0.75rem foot. Success/danger tones colour the figure and icon; linked tiles darken their border and mix 2.5% ink on hover.
- **Empty state:** dashed strong hairline, 12px radius, centred: a 36px icon well, a 0.875rem/600 title, a 32rem body, an optional action.

### Inputs / Fields
- **Style:** 36px minimum height (40px on auth), 12px horizontal padding, 1px strong hairline, field-white fill, 8px radius, 0.875rem text, `ink-faint` placeholder. Selects draw their chevron with gradients; textareas start at 120px.
- **Hover:** the border mixes 12% ink.
- **Focus:** border switches to the accent and a 3px accent-soft halo appears; the caret is accent.
- **Disabled:** 60% opacity.
- **Money input:** a prefixed field with the amount at 1.5rem/600 tabular, the focus halo on the whole group.
- **Labels and hints:** 0.8125rem/500 `ink-soft` labels above, 0.75rem `ink-faint` hints below.

### Navigation
- **Sidebar:** 32px rows, 6px radius, 0.8125rem/500 `ink-soft` text with 16px `ink-faint` icons; hover takes the hover tint and full ink; the active item takes the active tint with full-ink text and icon. Below 960px it becomes an icon-only top bar.
- **Sub-navigation (Finanças and Configurações):** one idiom for both. A row of 30px filled pill tabs (6px radius, 0.8125rem/500 `ink-soft`, 15px icons, 2px apart, horizontally scrollable without a scrollbar) above a 1px hairline with 12px of space below the tabs. Hover takes the hover tint; the active tab takes the active tint with full ink. An aside on the right holds view controls (the finance privacy toggle, accent soft when values are hidden).

**The One Sub-Nav Rule.** Every second-level navigation uses the filled pill tabs. No underline tabs, no second tab style.

### Rows and lists
Transactions and reminders are grouped by day: a 0.75rem `ink-faint` day head with the day's total, then 8px-radius rows that take the hover tint. A transaction row is a 32px icon well (green soft for credit, red soft for debit), a 500-weight description with an ellipsised meta line, a tabular amount, and actions. On hover devices the actions reserve no column: they float over the row's right edge on a short fade into the hover tint and appear only on hover or focus, so amounts stay aligned with the day total. On touch they sit under the text, right-aligned. Reminder rows lead with the time in `accent-text`, tabular, which fades to `ink-faint` once done. Tables use 0.75rem `ink-faint` headers, 10px 14px cells and hairline rows.

### Modal
Native `<dialog>`: `surface` fill, strong hairline, 14px radius, pop shadow, 500px wide (640px wide variant, 980px extra-wide), 18px 22px 22px padding, a 0.9375rem/600 title with a 28px close button, actions right-aligned with an 8px gap. The backdrop is a navy (light) or black (dark) wash. It enters in 0.22s with a 6px rise and 0.985 scale on the expo-out curve; this is the product's only animated entrance. All forms open here.

### Lockup and theme toggle
The lockup is the monochrome JarvisMark (22px in the sidebar, 36px on auth) beside the Michroma wordmark. The theme toggle is an icon button (moon in light, sun in dark) in the sidebar footer and the auth top bar; it crossfades the whole page in 0.24s through View Transitions where supported.

## Do's and Don'ts

### Do:
- **Do** take every colour from a custom property and redefine it in both dark blocks; check both themes before shipping.
- **Do** step depth by tone: ground for the sidebar, `bg` for the canvas, `surface` for cards, `surface-raised` for fields and raised controls.
- **Do** show every status as a dot-led hairline chip in sentence case; let numbers fall into the count variant, types into the plain pill, identifiers and versions into the key chip.
- **Do** use the filled pill tabs for every sub-navigation.
- **Do** keep controls at 34px (28px small) with 6px or 8px radii, cards and tiles at 12px, and borders at 1px.
- **Do** set every changing number in tabular figures, and colour money by direction (green credit, red debit), never by emphasis.
- **Do** keep transitions at 0.15s on colour and border, use `cubic-bezier(0.16, 1, 0.3, 1)` for movement, and honour reduced motion.
- **Do** use SVG icons at 13–17px in `ink-faint` or `ink-soft`, labelled when icon-only.

### Don't:
- **Don't** bring back the retro-80s costume: no Orbitron, no sunset stripes, no synthwave grid, no orange glow, no orange anywhere in the app.
- **Don't** put uppercase or letter-spaced labels on sections, badges, table headers or stats; Michroma caps belong to the wordmark alone.
- **Don't** add shadows to cards, tiles, rows or the canvas; shadows are for modals, tooltips and the 1px control lift.
- **Don't** nest a bordered or tinted card inside a card; use hairline rows or box-less columns.
- **Don't** put a dot on anything that is not a state, and don't grey out a disabled primary by opacity.
- **Don't** use a second accent hue, gradients, or semantic colours as decoration.
- **Don't** centre app content in a fixed max-width column; the canvas is fluid.
- **Don't** use emoji or text arrows as interface icons.
