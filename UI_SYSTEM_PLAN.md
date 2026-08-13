# Spurly Web — UI System Plan

**Status:** Active · **Date:** 13 Aug 2026 · **Owner:** Sarthak
**Supersedes:** `UI_REDESIGN_PLAN.md` (26 Jul) — that document assumed a Home tab that no longer
exists, and listed the shell rebuild as upcoming work when the shell is in fact the core problem.
Its Phase 0/1 (dead-code cleanup, teal token migration) did ship and is not repeated here.

---

## 0. Decisions locked

| Decision | Choice | Why |
|---|---|---|
| Visual direction | **Dense neutral, light canvas** | Linear / Attio / Clay register. 38px rows, hairline borders, near-monochrome, teal reserved for signal. Dark mode becomes a token flip later, not a rebuild. |
| Component foundation | **Built entirely in-house** | Product company, long horizon, no upgrade treadmill. No Radix, no shadcn, no headless libraries. |
| Positioning geometry | **Ours** | Flip/shift/collision math written by us. ~200 lines, lives in `ui/primitives/Popper`. |
| Starting point | **Vertical slice — People table** | Validate the system on the worst-looking, highest-traffic surface before scaling to 14 more screens. |

Scope is the **in-app UI only**. Marketing pages (`src/marketing/**`) are out of scope.

---

## 1. Diagnosis

The July theme migration landed correctly — `index.css` and `tailwind.config.js` hold a real token
layer with teal already aliased over the old purple. The app still looks unfinished for reasons that
have nothing to do with color.

### 1.1 Adherence, measured

```
254   inline style={{ }} blocks in pages/ components/ common/
 79   references to var(--brand-purple)   ← renamed to teal months ago, aliased so nothing broke
 69   raw <button> elements outside the Button component
  7   independently hand-rolled modals
  9   separate column definition files
```

The primitives (`Button`, `Card`, `Input`, `Badge`, `Tabs`, `Dropdown`, `Tooltip`) exist and are
reasonable. They are simply bypassed. **The system isn't outdated — the adherence is.** Restyling
`Button.jsx` changes nothing while 69 buttons on screen aren't `Button`.

### 1.2 The row-height bug — root cause

Rows in the People table vary from ~40px to ~240px depending on how long one cell's text is. Three
compounding causes, all in the table internals:

1. **`DataTable.jsx:74` sets `tableLayout: 'auto'`.** `columns.jsx` already declares
   `width: '180px'` and `Colgroup.jsx` already emits `<col style="width:180px">` — correctly. But
   under `auto` layout the browser treats those as *suggestions* and lets content override them.
   The declared widths are being silently discarded.
2. **Truncation is scattered and inconsistent.** `AvatarNameCell` and `CompanyCell` apply
   `truncate`. `TextCell` is a bare `<span>` with no clamp. `SkillsCell` wraps freely. Whether a
   column behaves depends on which cell component a page author happened to pick.
3. **`Cell.jsx` sizes by padding (`px-4 py-3`), never by height.** Row height is whatever the
   tallest cell's content decides.

The fix is architectural, not cosmetic: **truncation becomes `Cell`'s responsibility, not each cell
component's.** One place, enforced for every column in every table.

### 1.3 Buttons

`Button.jsx` is structurally fine; its styling is aimed at the wrong product.

- `hover:-translate-y-px` + `shadow-accent` on primary — a marketing-site lift-and-glow gesture.
  Dense tools change background instantly and don't move.
- `font-semibold` on every variant, `rounded-[14px]` at `h-10` — too round, too heavy for data UI.
  Direction A wants 6–8px radius and medium weight.
- `secondary` uses `backdrop-filter: blur(12px)` — expensive, invisible against a flat white card,
  and the reason secondary buttons read mushy.

### 1.4 Shell

`DashboardLayout.jsx` (197 lines) renders every screen and was never rebuilt:

- 1000ms hover-to-expand timer (`:32`) — accidental expansion on cursor pass, feels broken when
  intentional.
- Two avatars on screen simultaneously (`:130`, `:183`), same initial, same gradient.
- Topbar carries a title, a static subtitle and a redundant avatar. No search, no ⌘K, no
  notifications, no context-aware primary action.
- No credits meter. No extension connection status — the single most important piece of state in
  the product, currently surfaced only inside `EnableExtensionModal` at the moment of failure.
- Logout is a permanent red button, one misclick from the nav.
- Flat five-item list, no grouping, no counts.

---

## 2. Architecture

### 2.1 The tier rule

Every component has exactly one home. The dividing line between tiers is **domain knowledge**:

- **`src/ui/`** — knows nothing about Spurly. Could be lifted into another product unchanged.
  If a component knows what a LinkedIn invite is, it does not belong here.
- **Feature-owned** — knows about people, campaigns, credits, connection degrees. Lives beside the
  feature that owns it.
- **`src/components/DataTable/`** — generic infrastructure, sits between the two. Own top-level
  folder, own private parts.

This is why `Button` and `OutreachStatusCell` must not be siblings.

### 2.2 Structure

```
src/ui/                          design system · zero Spurly knowledge · zero dependencies
  tokens/
    colors.js  density.js  motion.js  index.js
  primitives/
    Button/          Button.jsx · variants.js · index.js
    IconButton/      Input/    Textarea/   Select/    Checkbox/   Switch/
    Badge/           Avatar/   Skeleton/   EmptyState/  Progress/
    Popper/          ← positioning geometry. flip · shift · scroll tracking.
    Tooltip/         Dropdown/  Popover/   Dialog/    Drawer/
    Tabs/            Command/   ← ⌘K
    Toast/
  layout/
    Card/  SectionCard/  PageHeader/  Toolbar/  Stack/

src/components/DataTable/        one owner
  DataTable.jsx
  useDataTable.js
  parts/                         structure · private to the table
    Header/  HeaderCell/  Body/  Row/  Cell/  Colgroup/
    Toolbar/ Pagination/  BulkActionBar/  SelectionCheckbox/  SortIcon/
  cells/                         the cell vocabulary · shared across all 9 column sets
    TextCell/  PersonCell/  CompanyCell/  DateCell/  TagsCell/
    EmailCell/ PhoneCell/   LinkCell/     NumberCell/
  index.js

src/features/people/             domain · imports from ui/ and DataTable/
  columns.jsx
  cells/OutreachStatusCell/      knows about invites · stays here
```

### 2.3 Cells become compositions

Today `AvatarNameCell` hand-rolls an avatar div, a gradient, a truncate and connection-degree badge
logic in one file — and `CompanyCell` hand-rolls a second, worse copy of the same avatar. Rebuilt:

```
PersonCell   = Avatar + TextCell + optional Badge      (all from ui/primitives)
CompanyCell  = Avatar + TextCell
TagsCell     = Badge × n + overflow counter
```

The cells stop being bespoke and start being compositions. This is the same principle as the
folder rule, applied one level deeper.

---

## 3. Contracts

Rules the system enforces so pages cannot break them.

### 3.1 The cell contract

- `tableLayout: 'fixed'` — declared column widths are **binding**.
- Row height comes from a density token, never from cell padding.
- `Cell` owns the clamp. Single line, ellipsis, `title` attribute carrying the full value so nothing
  is lost on truncation.
- A cell that needs to wrap must opt in explicitly (`column.wrap: true`), and opting in still caps
  at a fixed line count.

After this it is structurally impossible for one row to be 240px and the next 40px, regardless of
what a page author writes.

### 3.2 Density tokens

| Token | Row height | Use |
|---|---|---|
| `compact` | 32px | Power-user tables, admin |
| `default` | 38px | Standard — People, Connections, Campaigns |
| `comfortable` | 46px | Low-density tables with rich cells |

Set once on `DataTable`, consumed by `Row`, `Cell`, `HeaderCell`. Never overridden per column.

### 3.3 Button spec (Direction A)

- Radius 6px (`sm`) / 8px (`md`, `lg`). No 14px.
- `font-medium`, not `font-semibold`.
- No transform on hover. No accent shadow. Background change only, `--dur-fast`.
- `secondary` = solid surface + hairline border. No backdrop blur.
- Heights 28 / 32 / 36. Current 32/40/48 is oversized for dense UI.

---

## 4. Vertical slice — People table

Ships end-to-end before anything else is touched. Roughly one week.

**Build only what this screen needs:**

```
ui/tokens/              colors · density · motion
ui/primitives/          Button · IconButton · Input · Badge · Avatar
                        Checkbox · Tooltip · Skeleton · EmptyState
ui/layout/              Card · Toolbar
```

**Rebuild `DataTable`:**

- `tableLayout: 'fixed'`, density tokens, `Cell` owns clamping
- `parts/` reorganised per §2.2
- `cells/` recomposed from `ui/primitives`
- Toolbar, Pagination and BulkActionBar extracted as real parts

**Migrate `pages/CapturedLeads` → `features/people`:**

- `columns.jsx` rewritten against the new cell vocabulary
- `OutreachStatusCell` moved to `features/people/cells/`
- Every inline style and raw `<button>` on the page removed

**Explicitly not in the slice:** the shell, the other 8 column sets, the 7 modals, ⌘K, Popper.
Those come after the system is proven.

**Done when:** every row on `/dashboard/people` is exactly 38px, no horizontal overflow, no
inline styles in the page, no raw buttons, and the screen matches Direction A.

---

## 5. Guardrails

Added the same week as the slice. Without them we redo this in eight months.

1. **ESLint: no raw `<button>` / `<input>` / `<select>`** in `pages/` or `features/` — import from
   `ui/`.
2. **ESLint: no `style={{}}`** in `pages/` or `features/` — tokens or component props only.
3. **ESLint: no `var(--brand-purple)`** anywhere. The alias is deleted once all 79 call sites are
   gone.
4. **One phase per PR.** The shell rebuild alone touches every route.
5. **Screenshot every route before and after each phase.** Cheap, catches most visual regressions.
6. **State matrix per screen:** empty · loading · error · one row · 500+ rows · extension
   disconnected · zero credits · weekly budget exhausted. Most current bugs live in the last three.
7. **Never refactor logic and visuals in one commit.** `CampaignDetailPage` (892 lines) gets its
   send logic extracted and verified *first*, then restyled.

---

## 6. Sequence after the slice

| Phase | Work | Notes |
|---|---|---|
| 2 | Remaining `ui/` primitives | Dialog, Dropdown, Popover, Select, Tabs, Toast, Popper geometry. Collapse all 7 hand-rolled modals into `Dialog`. |
| 3 | `DashboardLayout` shell | Grouped nav with live counts, extension status pill, credits meter with top-up, account menu, functional topbar, ⌘K. Improves all 15 screens at once. |
| 4 | Remaining tables | Connections · Campaigns · Campaign members · Enrich · Enrich staging · Admin Users · Transactions · Pricing. Mostly mechanical once the cell vocabulary exists. |
| 5 | Page bodies, traffic order | Campaign detail (split + hook extraction first) · Campaigns list · Templates · Enrich · Settings · Admin. |
| 6 | Lint rules on, aliases deleted | `--brand-purple` removed. Inline styles at zero. |

Phases 1–3 are where the compounding is. Phase 5 gets dramatically cheaper because of them.

---

## 7. Notes for later

- **AI surfaces.** Direction A leaves room for AI as a first-class surface rather than a chat widget
  floating over the old UI — an AI column in the table, a generated "why this person" summary in the
  row drawer. Building the cell vocabulary now is what makes that a new cell type later rather than
  a redesign.
- **Dark mode.** A token flip once `ui/tokens/colors.js` is the single source. Do not attempt it
  until every page reads from tokens.
- **Virtualization.** The current `DataTable` handles one page (~100 rows) fine. Revisit row
  virtualization when a real customer crosses ~5,000 people. Not before.
