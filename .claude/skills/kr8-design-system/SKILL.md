---
name: kr8-design-system
description: Use when adding, editing, or styling any UI element on the KR8 Labs landing page — buttons, sections, cards, copy, colors, layout. Reference before guessing any token, class, or wiring pattern.
---

# KR8 Labs Design System

## Tokens — always use these, never hardcode values

```css
/* Color — Vercel-inspired, high-contrast dark */
--bg: #000000              /* true black canvas */
--surface: #0a0a0a          /* card / raised surface */
--surface-2: #111111        /* hover surface */
--text: #ffffff             /* primary text */
--text-muted: #a1a1a1       /* secondary / descriptive text */
--text-subtle: #666666      /* tertiary / footer labels */
--border: rgba(255,255,255,0.12)             /* default hairline */
--border-strong: rgba(255,255,255,0.2)       /* hover / accent border */
--accent: #ffffff           /* monochrome accent pattern (inverted buttons) */
--code-pink: #f81ce5        /* code highlight / subtle accent only */
--accent-lavender: #c4b5fd  /* favicon light stop — eyebrow labels, wireframe 3D icons */
--accent-purple: #8b5cf6    /* favicon mid stop — reserved */
--accent-deep: #6c40ff      /* favicon deep stop — hero background glow */

/* Layout */
--maxw: 1200px              /* content column width */
--gutter: 32px              /* horizontal page padding */
--section-gap: 160px        /* vertical spacing between sections */
--header-h: 64px            /* sticky nav height */
--radius: 0                 /* sharp everywhere — no rounded corners */

/* Motion */
--ease: cubic-bezier(0.4, 0, 0.2, 1)
--btn-transition: 150ms var(--ease)

/* Typography */
--font-sans: "Geist", ui-sans-serif, system-ui, sans-serif
--font-mono: "Geist Mono", ui-monospace, "SF Mono", monospace
```

## Recurring patterns

**Eyebrow label** (section category tag)
```html
<p class="eyebrow">02 · SECTION NAME</p>
```
→ `font-mono`, `0.75rem`, `font-weight: 600`, `letter-spacing: 0.1em`, uppercase, `color: var(--text-muted)`

**Headline** (hero, section titles)
```css
font-weight: 450;
letter-spacing: -0.05em;
line-height: 1.0;
text-wrap: balance;
color: var(--text);   /* solid white — no text gradients */
```

**Card**
```css
border: 1px solid var(--border);
border-radius: var(--radius);   /* 0 = sharp */
background: var(--surface);
/* hover: border-color → var(--border-strong), background → var(--surface-2) */
/* no shadows, no glow, no lift transforms */
```

## Buttons

| Class | Use |
|---|---|
| `.btn .btn-primary` | Primary CTA — white bg, black text (inversion pattern) |
| `.btn .btn-ghost` | Secondary — transparent + hairline white border |
| `.btn-sm` | Compact button (32px-ish height) |
| `.btn-lg` | Large button (40px-ish height) |

- All buttons: `border-radius: 0` (sharp), `font-size: 0.875rem`, `font-weight: 500`
- No gradients, no glow shadows, no lift transforms on hover
- Transition: `background 150ms ease, border-color 150ms ease`

## Services grid

Services are displayed as a 3-column card grid (`grid-template-columns: repeat(3, 1fr)`). Each card has a wireframe 3D icon (160x160 canvas), title, and description. Responsive collapse: 2 columns at 768px, 1 column at 480px.

Wireframe icons are built in `src/services-3d.ts` using Three.js `EdgesGeometry` + `LineSegments` with white `LineBasicMaterial`. Each card gets its own renderer for simultaneous display.

## Adding a new section

1. Create `src/sections/my-section.ts`
2. Import helpers:
```ts
import { fromHTML } from "../dom.ts";
import { CONTACT_EMAIL, SITE } from "../data.ts";
```
3. Export one function returning `HTMLElement`:
```ts
export function mySection(): HTMLElement {
  return fromHTML(`
    <section class="my-section">
      ...
    </section>
  `);
}
```
4. Mount in `src/main.ts` — insert between existing calls:
```ts
app.append(nav(), hero(), services(), /* mySection(), */ cta(), footer());
```
5. Add styles to `src/style.css` in section order (after services, before CTA). Use sharp borders, Geist fonts, and monochrome palette.

## Class naming

Flat BEM-lite: `.section-name`, `.section-name-title`, `.section-name-card`.  
No double-underscore (`__`) or modifier (`--`) BEM. Match the existing pattern in `style.css`.

## Layout

`#app` is `max-width: 1200px; margin: 0 auto; padding: 0 32px`.  
The nav is full-width with `padding: 0 32px`, `height: 64px`, a hairline bottom border, and a semi-transparent black background with `backdrop-filter: blur(12px)`.

## Copy & data

All site copy lives in `src/data.ts`. Add new strings there; import in the section module.
