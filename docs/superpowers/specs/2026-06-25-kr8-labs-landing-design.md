# KR8 Labs — Landing Page Design

**Date:** 2026-06-25
**Status:** Approved (design), pending build

## Goal

A quick, striking single-page marketing site for KR8 Labs, a modern web
development team. Near-black canvas, a static grainy purple gradient background
(matching shaders.paper.design/grain-gradient), single purple accent, generous
negative space.

## Stack

- **Vite + vanilla TypeScript** (dev server + build, no framework).
- **`@paper-design/shaders`** (core, vanilla) for the `GrainGradient` background,
  mounted onto a full-viewport canvas.
- **Space Grotesk** via Google Fonts (Bold headings, Medium/Regular body).
- No other runtime dependencies.

## Brand reference (from brand-spec.png)

- **Primary purple:** `#6C40FF`
- **Secondary purple:** `#8B5CF6`
- **Light purple:** `#C4B5FD`
- **Near-black background:** `#0D0E12` (cards/gray accent `#1F2324`)
- **White:** `#FFFFFF` / muted text `#9A9CA5`
- **Type:** Space Grotesk
- **Voice:** Smart. Modern. Reliable. Innovative. Human.
- **Tagline:** `CRAFT · ∞ · BUILD WITHOUT LIMITS`
- **Hero line:** "Building digital experiences that scale infinitely"
- **Description:** "KR8 Labs is a modern web development company building
  scalable, high-performance digital experiences."
- **Values:** Crafted · Limitless · Structured · Impactful
- **Services / iconography:** Development, UI/UX, Cloud, Database, Security,
  Performance.

## Background

Fixed, full-viewport canvas behind all content.

- `colors`: `["#6C40FF", "#8B5CF6", "#C4B5FD", "#0D0E12"]`
- `colorBack`: `#0D0E12`
- `shape`: `corners`
- `softness`: ~0.7, `intensity`: ~0.45, `noise`: ~0.25
- `speed`: `0` (static / very subtle per user choice)
- A dark overlay (`#0D0E12` at ~55%) + vignette sits above the canvas so text
  stays readable.
- Resizes with the window (devicePixelRatio aware).

## Sections (Hero + Services + CTA)

1. **Nav bar** — KR8 Labs logo (inline SVG hexagonal-infinity mark in brand
   purple) + wordmark on the left; "Start a project" button on the right.
   Sticky, transparent over the gradient.
2. **Hero** — uppercase letter-spaced eyebrow tagline; large bold headline
   "Building digital experiences that scale infinitely"; one-line subcopy
   (brand description); two CTAs — primary "Start a project", ghost
   "View our work".
3. **Services** — responsive grid of 6 cards: Development, UI/UX, Cloud,
   Database, Security, Performance. Each: inline line-icon SVG + label +
   one-line description. Hairline-bordered glassy dark cards with a purple
   hover accent.
4. **CTA band** — short headline + primary "Start a project" button →
   `mailto:` link.
5. **Footer** — logo, © 2026 KR8 Labs, tagline.

## Design language

Near-black background, single purple accent, thin uppercase letter-spaced
eyebrows/labels, rounded cards with hairline borders, smooth hover transitions,
fully responsive down to mobile.

## File structure

```
kr8-labs/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.ts          # entry: mounts background + renders sections
    style.css        # tokens + layout + components
    background.ts    # GrainGradient canvas setup
    logo.ts          # SVG mark + wordmark
    sections/
      nav.ts
      hero.ts
      services.ts
      cta.ts
      footer.ts
    data.ts          # services + copy constants
```

Each section module exports a function returning an `HTMLElement` (or HTML
string mounted by `main.ts`), keeping concerns isolated and independently
editable.

## Open item

- **Contact email** for the CTA `mailto:` — placeholder `hello@kr8labs.com`
  until a real address is provided.

## Out of scope (YAGNI)

- Values section, portfolio/work pages, contact form backend, analytics,
  CMS, animations beyond hover transitions, dark/light toggle.
```

