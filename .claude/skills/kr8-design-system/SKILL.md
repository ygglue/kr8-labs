---
name: kr8-design-system
description: Use when adding, editing, or styling any UI element on the KR8 Labs landing page — buttons, sections, cards, copy, colors, layout. Reference before guessing any token, class, or wiring pattern.
---

# KR8 Labs Design System

## Tokens — always use these, never hardcode values

```css
/* Color */
--purple: #6c40ff        /* primary CTA, icons, accents */
--purple-2: #8b5cf6      /* secondary purple, gradients */
--purple-3: #c4b5fd      /* light accent, icon color, eyebrow text */
--bg: #0d0e12            /* page background */
--surface: #15161c       /* card/panel base */
--surface-2: #1f2026     /* elevated surface */
--border: rgba(255,255,255,0.09)          /* default hairline */
--border-strong: rgba(196,181,253,0.35)   /* hover / featured border */
--text: #f4f4f6          /* primary text */
--text-muted: #9a9ca5    /* secondary / descriptive text */

/* Layout */
--maxw: 1120px      /* content column width */
--radius: 16px      /* standard card radius */
--ease: cubic-bezier(0.22,1,0.36,1)  /* all transitions */
--font: "Space Grotesk", ui-sans-serif, system-ui, sans-serif
```

## Recurring patterns

**Eyebrow label** (section category tag)
```html
<p class="eyebrow">02 · SECTION NAME</p>
```
→ `0.72rem`, `letter-spacing: 0.22em`, uppercase, `color: var(--purple-3)`

**Gradient headline** (hero, service name, CTA title)
```css
background: linear-gradient(180deg, #fff 40%, #c8c2e6 100%);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
```

**Glassy card**
```css
border: 1px solid var(--border);
border-radius: var(--radius);
background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01));
/* hover: border-color → var(--border-strong), bg tint with rgba(139,92,246,0.1) */
```

**Glassy icon pill**
```css
background: rgba(108,64,255,0.12);
border: 1px solid rgba(196,181,253,0.16);
color: var(--purple-3);
border-radius: 12–18px;
```

## Buttons

| Class | Use |
|---|---|
| `.btn .btn-primary` | Primary CTA — purple gradient, glow shadow |
| `.btn .btn-ghost` | Secondary — transparent + hairline border |
| `.btn-sm` | Nav button |
| `.btn-lg` | CTA band button |

## Adding a new section

1. Create `src/sections/my-section.ts`
2. Import helpers and copy:
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
5. Add styles to `src/style.css` in section order (after services, before CTA).

## Class naming

Flat BEM-lite: `.section-name`, `.section-name-title`, `.section-name-card`.  
No double-underscore (`__`) or modifier (`--`) BEM. Match the existing pattern in `style.css`.

## Layout

`#app` is `max-width: 1120px; margin: 0 auto; padding: 0 24px`.  
The nav breaks out of `#app` (mounted before it in the DOM) and uses `padding: 18px max(24px, calc((100vw - 1120px)/2 + 24px))` to stay aligned.  
For a full-bleed section, use `height: Nvh; padding: 0 !important` and a sticky inner panel (see `.services`).

## Copy & data

All site copy lives in `src/data.ts`. Add new strings there; import in the section module.
