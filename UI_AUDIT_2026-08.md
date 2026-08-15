# Spurly Web — UI/UX Audit

**Date:** 16 Aug 2026 · **Scope:** `spurly.web` dashboard shell + all feature pages
**Constraint:** keep the theme (teal accent, light neutral canvas, Direction A register). Nothing here changes the palette.

> **STATUS: implemented.** Everything in §1–§8 has shipped. See
> [UI_FIXES_APPLIED.md](UI_FIXES_APPLIED.md) for what changed, the before/after
> measurements, and the one item deliberately left open (94 raw `<button>`
> elements, now flagged by ESLint). This document is kept as the diagnosis.

---

## TL;DR

The app doesn't look cheap because of the theme. It looks cheap because **three design systems are live at the same time** and every screen picks values from a different one. The symptoms you named — no hierarchy, misaligned top bar — are downstream of that.

Measured evidence:

| Signal | Count found |
|---|---|
| Distinct hardcoded font sizes (`text-[Npx]`) | **17** |
| Distinct border-radius values in use | **22** |
| Distinct `<h1>`–`<h3>` treatments | **18** |
| Font weights in circulation | 3 (`medium` ×98, `semibold` ×93, `bold` ×30) |
| Legacy `var(--*)` token call sites (non-`--ui-`) | **~700** across 30 files |
| Files still importing the *old* component library | 13 |
| Different left-edge x-positions on the People page | **5** |
| Different "this is selected" visual languages | **5** |

Fixing the top three sections below is roughly 2 days of work and will move the perceived quality more than any new feature.

---

## 1. Root cause — three competing systems

| Layer | Where | Radius scale | Type scale | Status |
|---|---|---|---|---|
| **`--ui-*`** (Direction A) | `src/ui/tokens/tokens.css` | 4 / 6 / 8 / 10 | none (px literals at call sites) | current target |
| **Legacy `--brand-*` / `--accent`** | `src/index.css` | 6 / 10 / 14 / 18 / 24 / 32 + glass + gradients | none | should be dead, isn't |
| **Tailwind `spurly-*`** | `tailwind.config.js` | 10 / 14 / 18 / 24 / 32 | `display`→`caption`, 10 well-designed steps | **defined and never used** |

And two component libraries running in parallel:

- `src/ui/primitives/*` — Button, Tabs, Input, Badge, Card, Dialog… (imported by 54 files)
- `src/common/components/*` — a **second** Button, Tabs, Input, Badge, Card, DataTable (still imported by 13 files, incl. Settings, Enrich, Admin/Insights, Admin/Transactions, both campaign modals)

Plus a third table implementation (`src/common/components/DataTable` vs `src/components/DataTable`).

**Consequence:** two buttons that should be identical are built from different radius, height and weight scales. That inconsistency is exactly what reads as "amateur" — users can't articulate it, but they feel that nothing repeats.

### Recommendation
1. Delete `src/common/components/` entirely. Migrate the 13 importing files to `src/ui/primitives`.
2. Delete the glass layer (`.glass*`, `--glass-*`, `--canvas-mesh`, `--brand-gradient*`) from `index.css`. Backdrop-blur + inner-glow + gradient mesh is a 2015 iOS register sitting inside a 2024 flat register — the mix is a big part of the "cheap" read.
3. Alias the remaining legacy tokens straight to `--ui-*` (one-line each) so the ~700 call sites reskin instantly, then migrate file-by-file and delete the aliases.
4. Strip the unused `spurly-*` radius/shadow/spacing from `tailwind.config.js`. Keep only the type scale, and actually wire it up (§2).

---

## 2. No type hierarchy — the specific problem you named

### What's wrong

**a) The steps are too close to be steps.** The five most-used sizes are `13px` (×116), `12px` (×63), `12.5px` (×46), `14px` (×34), `11.5px` (×28). Five levels inside a 2.5px band. The human eye reads 12px and 12.5px as *the same size*, so what you built as five levels renders as one flat mass. That is precisely the "no hierarchy" feeling.

**b) Hierarchy is inverted.** The page title in the top bar is:

```jsx
// DashboardLayout.jsx
<h1 className="text-[15px] font-medium …">   // ← the most important label on screen
```

while section headings *inside* cards are `text-[17px] font-bold` and card titles are `text-[16px] font-bold`. The page title is smaller and lighter than everything under it. The eye lands in the middle of the page instead of the top-left.

**c) Three weights compete.** `font-medium` (98), `font-semibold` (93), `font-bold` (30) are used interchangeably for the same role — `text-[17px] font-bold` and `text-[17px] font-semibold` both appear as section headings.

**d) A good scale already exists and is unused.** `tailwind.config.js` defines `title-2`, `title-3`, `headline`, `body-text`, `callout`, `ui-label`, `footnote`, `caption` with correct line-heights and tracking. Zero call sites use them.

### Recommendation — six steps, two weights, no exceptions

Add to `tokens.css`:

```css
:root {
  /* Type scale. Six steps. Each is ~1.15–1.2× the last, which is the
     minimum ratio the eye reads as a different level. */
  --ui-t-page:    17px;  /* page title — the only 17px on screen */
  --ui-t-section: 14px;  /* card / section heading */
  --ui-t-body:    13px;  /* table cells, form values, default */
  --ui-t-label:   12px;  /* secondary/supporting copy, subtitles */
  --ui-t-meta:    11px;  /* counts, timestamps, column headers */
  --ui-t-micro:   10px;  /* nav section labels only */

  --ui-w-normal: 400;
  --ui-w-strong: 500;    /* the ONLY emphasis weight. No semibold, no bold. */

  --ui-track-tight: -0.012em;  /* ≥14px */
  --ui-track-base:  -0.006em;  /* ≤13px */
}
```

Then a hard rule to enforce in review: **`13px` is the default. Anything not 17/14/13/12/11/10 is a bug.** That deletes 11 of the 17 sizes.

Concrete first edits:

```jsx
// DashboardLayout.jsx — page title. Was 15px/medium.
<h1 className="text-[17px] font-medium tracking-[-0.012em] text-[var(--ui-text-primary)] truncate">

// DashboardLayout.jsx — subtitle. Was 12.5px/tertiary. Move to secondary so
// the live stat line is readable; tertiary on a stat is under-contrast.
<p className="text-[12px] text-[var(--ui-text-secondary)] truncate">
```

Then global find/replace: `12.5px`→`12px`, `13.5px`→`13px`, `11.5px`→`11px`, `15px`/`16px`/`18px` headings→`14px`, all `font-semibold`/`font-bold`→`font-medium`.

> Losing bold feels risky but isn't. In a dense data tool, size + colour carry hierarchy; weight is the third lever and using all three at once is what makes UI look shouty. Linear and Attio ship with essentially one emphasis weight.

---

## 3. The alignment bug — measured

You're right, and it's worse than one misalignment. Here is the actual left-edge ladder on `/dashboard/people`, measured from the content column's left edge:

| Element | Source | x |
|---|---|---|
| Page title **"People"** | `<header px-4>` | **16px** |
| Card border | `<main px-4>` | 16px |
| Card interior | +1px border | 17px |
| Degree tab *box* | `Toolbar px-3` | 29px |
| Degree tab **label "All"** | + `Tabs px-2.5` | **39px** |
| Search input box | `ToolbarShell px-3` | 29px |
| Select-all checkbox | `padX: 12` | 29px |
| First column header **"Name"** | 17 + 40 (selection col) + 12 | **69px** |

Five different left edges in one viewport. The title lands on the **card's border**, which is the one thing it should *not* align to — every mature tool aligns the page title to the first content column, not to the frame.

Vertical is also off:

| Band | Height |
|---|---|
| Top bar | 48px |
| Degree-tab toolbar | 40px |
| Table toolbar | 44px |
| Table header | 34px |
| Row | 38px |
| Pagination | 44px |

Two stacked toolbars at 40 and 44 — that 4px discrepancy is directly visible as a wobble down the right edge where the buttons sit. And header (34) < row (38) is backwards.

### Recommendation

**a) One gutter token, one content line.**

```css
:root {
  --ui-shell-x:   16px;   /* main / header outer padding */
  --ui-pad-x:     12px;   /* padding inside the card */
  /* Everything in a page's left rail lands here. 16 + 1px border + 12 */
  --ui-content-x: 29px;
}
```

```jsx
// DashboardLayout.jsx
<header className="flex items-center gap-3 h-11 shrink-0 …"
        style={{ paddingInline: 'var(--ui-content-x)' }}>
```

Now "People", the "All" tab, the search glyph and the select-all checkbox all sit on 29px.

**b) Tabs must align on their *text*, not their hover box.** Add an opt-in to `Tabs`:

```jsx
// Tabs.jsx
export function Tabs({ …, flush = false }) {
  …
  <div role="tablist" className={`flex items-center gap-0.5 min-w-0 ${flush ? '-ml-2.5' : ''}`}>
```

and pass `flush` from `PeopleFilterBar`. Same treatment for any `variant="ghost"` button that starts a row.

**c) Lock the vertical scale to a 4px grid, monotonic:**

| Band | Now | → |
|---|---|---|
| Top bar | 48 | **44** |
| Tab toolbar | 40 | **40** |
| Table toolbar | 44 | **40** |
| Table header | 34 | **40** |
| Row | 38 | **36** |
| Pagination | 44 | **40** |

Header ≥ row, all chrome bands identical at 40. Set `DENSITY.default = { row: 36, header: 40, padX: 12, fontSize: 13 }` and give `Toolbar` a default `height = 40`.

---

## 4. No surface hierarchy — why the top bar "floats"

```jsx
<div className="… bg-[var(--ui-surface-page)]">        {/* canvas  */}
  <aside className="… bg-[var(--ui-surface-page)]">    {/* sidebar */}
  <header className="… bg-[var(--ui-surface-page)]">   {/* top bar */}
```

Sidebar, top bar and canvas are **the same colour**, separated only by a hairline on the sidebar. The top bar has no bottom border and no background of its own, so it doesn't read as a bar — it reads as text floating above a box. That's the second half of your "no hierarchy between nav / top bar / heading" complaint.

### Recommendation
Three planes, still monochrome, still your theme:

```
sidebar  →  --ui-surface-sunken   (#f4f4f5)   recedes
canvas   →  --ui-surface-page     (#fafafa)
card     →  --ui-surface-card     (#ffffff)   advances
top bar  →  --ui-surface-page + border-b hairline
```

The top bar keeps the canvas colour but gains a hairline bottom border, so the title is *attached* to the page rather than hovering. The sidebar going one step darker is the single highest-leverage change in this document — it instantly reads as chrome vs. content.

---

## 5. Five different "selected" states

| Control | Active treatment |
|---|---|
| Sidebar nav | accent tint fill + 2px left bar + accent text |
| Degree tabs | 2px accent underline + primary text + medium |
| Status segmented control | white surface + inset ring, **no accent at all** |
| Pagination page | `accentSoft` (accent tint fill) |
| "Needs attention" toggle | `dangerSoft` |

Five encodings of one concept. Users never learn the rule, so every screen has to be re-read. Worse: the segmented control's active state uses no accent while pagination's does — so accent doesn't reliably mean "selected".

### Recommendation — one rule, two shapes
- **Navigational selection** (sidebar, page tabs) → accent underline/bar + `--ui-text-primary` + `font-medium`. No fill.
- **Stateful selection** (filters, segmented controls, pagination) → `--ui-accent-tint` fill + `--ui-accent-fg` text. No ring, no shadow.

Applied: give `StatusFilter`'s active segment `bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]` and drop the inset ring; give the sidebar's active row the same left-bar treatment the tabs use, or vice versa — but pick one.

---

## 6. Control heights don't form a scale

In the People table toolbar, side by side:

| Control | Height |
|---|---|
| Search `Input size="md"` | 32px |
| `StatusFilter` segment (h-6 + p-0.5 wrapper) | 28px |
| Export `Button size="sm"` | 28px |
| Create-campaign `Button size="sm"` | 28px |
| Degree tab (row above) | 36px |

Four heights in one 44px strip. That raggedness along the vertical centre-line is a classic "cheap" tell.

### Recommendation
**Within one toolbar, every control is the same height.** Standardise toolbars on 28px: `Input size="sm"`, `Button size="sm"`, `IconButton size="sm"`, segment `h-7`. Reserve 32px for forms and 36px for primary CTAs on empty states. Change `Tabs` from `h-9` to `h-8`.

---

## 7. Three pages never migrated

| Page | Internal gutter | Radius | Buttons | Tokens |
|---|---|---|---|---|
| People / Connections / Campaigns | `px-3` (12) | `--ui-radius-*` | `ui/primitives` | `--ui-*` |
| **Settings** | `p-7` (28) | `rounded-[12px]` | raw `<button>` | legacy (21 refs) |
| **Templates** | `px-6 pt-5 pb-4` (24/20/16) | `rounded-[10px]`, `[12px]` | raw `<button>` ×4, `font-semibold text-white` | legacy (30 refs) |
| **Enrich** | `p-7` (28) | mixed | raw ×6 | legacy (36 refs) |
| **Admin/Insights** | — | mixed | — | legacy (66 refs) |
| **Campaign detail** | — | mixed | raw ×13 | legacy (55 refs) |

The page gutter changes from 12px to 24px to 28px depending on which nav item you click. Navigating the app feels like navigating three apps. There are also **~110 raw `<button>` elements** outside `src/ui/`, each with hand-rolled height, radius and hover — directly against the rule in `Button.jsx`'s own docblock.

### Recommendation
Migrate in this order (highest visibility first): **Templates → Settings → Enrich → Campaign detail → Admin**. For each: swap raw `<button>` → `Button`, `rounded-[Npx]` → `--ui-radius-*`, `p-7`/`px-6` → the shared gutter, legacy vars → `--ui-*`. Add an ESLint rule banning raw `<button>` outside `src/ui/` and banning `rounded-[` / `text-[` arbitrary values outside `src/ui/`, so this can't regress.

---

## 8. Smaller polish items

- **Focus ring is defined but inconsistently applied.** `--ui-focus-ring` exists; the ~110 raw buttons all use browser default or `focus:outline-none` with no replacement — an accessibility failure and a visible quality tell on keyboard nav.
- **`--ui-row-default: 38px` vs `DENSITY.default.row: 38`** — the same number declared in two places (CSS and JS). One will drift. Read the CSS var in JS or delete the CSS var.
- **Empty/loading/error states.** `DataTable` handles all three; Settings, Templates and Enrich hand-roll them differently. Route everything through `EmptyState` and `Skeleton`.
- **Motion has two scales** — `--dur-fast: 140ms / --dur-base: 240ms / --dur-slow: 400ms` (legacy) vs `--ui-dur-fast: 100ms / --ui-dur-base: 160ms` (current). Delete the legacy trio; 240–400ms transitions in a data tool feel sluggish.
- **`tabular-nums` is applied inconsistently** — set on `table` globally in `index.css`, but counts in tabs, badges and the credits meter each opt in by hand. Any number that updates in place should be tabular or it will jitter.
- **Table header shorter than rows** (34 vs 38) makes the header read as an afterthought rather than a frame. Fixed by §3c.

---

## Suggested sequence

**Day 1 — the 80%**
1. §4 sidebar → `--ui-surface-sunken`, top bar gets `border-b` *(1 file, ~5 min, biggest single visual win)*
2. §3a/b one gutter token; page title, tabs, search, checkbox all on 29px
3. §2 page title 15→17px; global size collapse to six steps; all weights → `font-medium`
4. §3c vertical scale to 40/40/40/36/40

**Day 2 — consistency**
5. §5 one selected-state rule
6. §6 toolbar controls all 28px
7. §1 delete the glass layer + unused Tailwind scales

**Week 2 — debt**
8. §7 migrate Templates, Settings, Enrich, Campaign detail, Admin
9. Delete `src/common/components/` and the legacy token block
10. Add the ESLint guards

Nothing above changes the teal, the neutral ramp, or the Direction A register.
