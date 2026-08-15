# UI fixes — what changed

**Date:** 16 Aug 2026 · Companion to [UI_AUDIT_2026-08.md](UI_AUDIT_2026-08.md)
**113 files touched. Build passes. Palette unchanged.**

---

## Measured before / after

| Signal | Before | After |
|---|---:|---:|
| Distinct font sizes | 17 | **7** |
| Distinct border radii | 22 | **6** (5 tokens + `rounded-full`) |
| Font weights | 3 (`medium` 98, `semibold` 93, `bold` 30) | **1** (+2 deliberate `font-normal`) |
| Raw Tailwind palette classes (gray/indigo/blue/green…) | 104 | **0** |
| Distinct left edges in the People page rail | 4 | **1** |
| Distinct chrome band heights | 5 (34/38/40/44/48) | **1** (40) |
| "Selected" visual languages | 5 | **2** (navigational / stateful) |
| Design systems live at once | 3 | **1** (+ a marketing register, scoped) |
| Dead component directories | — | **4 deleted** |

---

## 1. One token layer

`src/ui/tokens/tokens.css` is now the only source of truth. It gained:

- **A 7-step type scale** (`--ui-t-metric/page/section/body/label/meta/micro` = 24/17/14/13/12/11/10). The old app had five sizes inside a 2.5px band, which the eye cannot resolve as separate levels — that was the "no hierarchy" complaint.
- **Two weights** (`--ui-w-normal`, `--ui-w-strong`). Size and colour carry hierarchy; weight was the third lever and using all three made the UI shout.
- **Gutter tokens** — `--ui-shell-x` 16, `--ui-pad-x` 12, `--ui-content-x` **29** (the line everything in a page's left rail aligns to), `--ui-pad-lg` 20 for content pages and dialogs.
- **`--ui-band` 40px** — every horizontal chrome band.
- **`--ui-text-tertiary` moved** from neutral-400 to neutral-500. It was 2.4:1 on white and was being used for column headers, subtitles and counts — real information, all under-contrast, and a big part of why the app read as washed out. `--ui-text-quaternary` is the new home for genuinely decorative grey.
- **`--ui-surface-rail-hover/active`** — the sidebar now sits on the sunken plane, which was the same colour as the old hover, so nav hover would have been invisible.

`src/index.css` is now a **compatibility layer**: every legacy name (`--text-primary`, `--brand-purple`, `--separator`, `--shadow-lg`, `--z-modal`…) aliases into `--ui-*`. That reskinned **~700 call sites across 30 files** without editing them — which is why Settings, Templates, Enrich, Campaign detail and Admin stopped looking like a different product. `--radius-*` and `--dur-*` are deleted (unused; the duration scale ran nearly 2× slower than the current one).

`tailwind.config.js` lost its entire third scale — radius, shadow, spacing and a ten-step type scale, none of which anything used. Only content globs and font stacks remain.

---

## 2. The alignment bug

Left-edge ladder on `/dashboard/people`, measured from the content column:

| Element | Before | After |
|---|---:|---:|
| Page title "People" | 16 | **29** |
| Degree tab label "All" | 39 | **29** |
| Search field | 29 | **29** |
| Select-all checkbox | 29 | **29** |
| Pagination "1–25 of N" | 29 | **29** |
| *(card border)* | 16 | 16 |

The title was aligned to the content card's **border** — the one thing it should never align to. The header now pads to `--ui-content-x`.

`Tabs` pulls itself left by its own padding so the first tab's **label**, not its hover box, lands on the gutter, and tabs are full height so the underline paints exactly on the toolbar's bottom border instead of floating above it.

Vertical: top bar 48→40, table toolbar 44→40, table header 34→**40** (headers are now taller than rows, not shorter), rows 38→36, pagination 44→40, drawer header 48→40, connections alert 36→40.

---

## 3. Surface hierarchy

Sidebar, top bar and canvas were all `--ui-surface-page` — three regions painted one colour, which is why the top bar "floated" and the nav had no presence. Now three planes:

```
sidebar  →  --ui-surface-sunken    recedes
canvas   →  --ui-surface-page
card     →  --ui-surface-card      advances
top bar  →  --ui-surface-page + hairline bottom border
```

Still monochrome, still the same palette — the depth comes from ordering three greys that were already in the ramp.

Page title went 15px/medium → **17px/medium**. It had been smaller and lighter than the section headings inside the cards below it, so the most important label on screen was the least prominent.

---

## 4. One selected-state rule

- **Navigational** (tabs) → accent underline, primary text, no fill.
- **Stateful** (sidebar, status filter, pagination, dropdown) → accent tint fill, accent text.

`StatusFilter` was the odd one out — its selected segment carried no accent at all, so accent didn't reliably mean "selected" anywhere. Its inset ring is gone too (a ring plus a fill draws the same edge twice).

Found along the way: `Dropdown`'s selected item read `var(--accent-subtle, rgba(79,70,229,0.08))`. `--accent-subtle` has never been defined, so every selected dropdown item was rendering the fallback — **indigo**, from a palette the product stopped using two redesigns ago.

---

## 5. Control heights

The People toolbar held a 32px input, a 28px segmented control and two 28px buttons side by side. Everything in a toolbar is **28px** now. Hand-rolled buttons across the unmigrated pages had settled on h-9/h-10 with 14px labels and 10px radii — a scale that exists nowhere in `ui/primitives` — and are snapped to 32px/13px/6px. The legacy `Input` was **44px**.

---

## 6. Register cleanup

- `.glass*`, `backdrop-filter` and `canvas-mesh` are now **marketing-only** and lint-enforced. Backdrop-blur panels with an inner glow next to flat hairline tables is two visual eras on one screen.
- Hover lift (`-translate-y-px`), `active:scale`, and `transition-all` removed from app code. In a dense tool a card that jumps 1px on hover reads as jitter.
- The campaign flow's stat strip was a 78%-opaque blurred bar over a dotted canvas — it picked up the dots underneath and shimmered while the list scrolled. Now solid.
- `danger`/`dangerSoft` buttons used `brightness()` filters for hover; filter isn't in the transition list, so they snapped while their neighbours eased. Now background-color like everything else.
- Legacy `Badge` used `--green`/`--red`/`--amber` (fill stops) as *text* on a tint. Now the `-fg` stops.

---

## 7. Deleted

`src/common/components/` lost **ActionBar, Button, DataTable, Table** — all four had zero importers, and `DataTable` was a second full table implementation. The eight still in use (Badge, Card, Dropdown, Input, MetricCard, SectionCard, Tabs, Tooltip) were restyled onto the current tokens rather than rewritten, so no consuming page changed.

---

## 8. Guards (`eslint.config.js`)

Warnings, not errors, so branches still build. Scoped to app code — `src/ui/**` may define new values, `src/marketing/**` is a different register on purpose.

| Guard | Violations now |
|---|---:|
| Font size off the 7-step scale | 0 |
| Hard-coded `rounded-[Npx]` | 0 |
| `font-semibold` / `font-bold` | 0 |
| Raw Tailwind palette | 0 |
| Glass / backdrop-blur in app | 0 |
| Raw `<button>` | **94** |

All four guards live in **one** `no-restricted-syntax` entry deliberately: flat config replaces a rule's options wholesale rather than merging them, so splitting them across blocks silently disabled the token guards on exactly the files that needed them.

---

## Left open

**94 raw `<button>` elements.** Each hand-rolls height, radius, hover, disabled and focus ring, so each one opts out of the system. They now look right (the token aliasing and geometry codemod reached them) but they're still structurally wrong. The lint rule makes them visible in review; converting them to `<Button>` / `<IconButton>` is mechanical but touches real interaction code, so it wants its own pass with a click-through.

Highest-count files: `CampaignDetailPage` (13), `AiWriteButton` (6), `StagingPanel` (6), `CreateCampaignModal` (5), `CreateMessageCampaignModal` (5), `CreditsModal` (5), `TemplatePickerModal` (5).

Also still open: the 35 pre-existing lint **errors** (21 × setState-in-effect, 4 × TDZ access, 1 × ref-during-render, plus `no-empty` / `no-undef`). None are styling; all predate this work; several are real render-loop risks.

---

## Verify

```bash
npm run build   # passes
npm run lint    # 0 token-guard violations; 94 raw-button warnings; 35 pre-existing errors
```
