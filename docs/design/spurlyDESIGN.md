# Spurly — Blue Identity

> A machine that runs while you sleep, reporting what it did.

Companion to `index.css`. That file holds the values; this one holds the
reasoning, so a decision made once is not re-litigated on every screen.

`index.css` is a single drop-in file for Tailwind v4. It replaces `src/index.css`,
`src/core/tokens/tokens.css` and `tailwind.config.js` — `@theme` generates the
utilities, so there is no config to keep in sync. It keeps the legacy alias block,
so the ~700 unmigrated `var(--text-primary)` call sites reskin without being edited.

This is an evolution of the v2 "console" direction, not a replacement for it.

---

## What carried over

Three ideas from v2 do the structural work. All three survive unchanged, and
nothing below should be read as permission to weaken them.

**The spine.** A 2px accent bar marks whatever is live: the active nav row, a
selected table row, a running import, an AI panel, a notice's severity. One
motif, one meaning. It replaces the instinct to put a card around things.

**Readings in mono.** Every count, rate, cap, percentage, timestamp, column
header, status label, keyboard hint and id is set in IBM Plex Mono, tabular.
Prose stays in the sans. A column header can then never be mistaken for data,
and a count ticking 99 → 100 never shifts its column.

**One meter.** `18/25 sent today`, `412 imported`, `1,284 credits`,
`31.2% connected`, a lead's fit score, a campaign's progress, a sequence step's
throughput — all render as the same 3px bar under the same mono figure. One
component, used everywhere a quantity has a ceiling.

---

## What changed

### Blue replaces violet

`#3c83f6` fill, `#0544a5` as text. The property that made the old violet work is
preserved: one family covers both a fill under white text and text on white, so
a primary button and an accent link never come from two different blues.

Blue is scarce on purpose. It gets exactly these:

- the one primary action per screen
- the active nav row
- selection — checkboxes, selected rows, the bulk bar
- the spine, wherever it appears
- focus rings
- links and the current page in pagination
- **anything Spurly itself is doing** — importing, enriching, scoring, drafting

Everything else is neutral. A screen where the status badges, the icons, the
headings and the borders have all gone blue has no accent left, because an
accent is a contrast, not a colour.

### Geist replaces Instrument Sans

The one genuinely new decision. Geist sets tighter at 13–14px, which is where
nearly all of this product lives, and its figures are closer in colour to Plex
Mono's — so the two faces sit in one table row without either looking pasted in.

### Info stops being indigo

With a blue accent, an indigo info state is a fight nobody wins. Info now
borrows the accent family; the distinction from a primary action is carried by
the spine and the dot, not by a second nearly-blue.

---

## The AI, made structural

The brief asked for futuristic. The answer is not gradients or glass. It is that
**the product tells you what it is doing and why, in words, while it does it.**
Four devices carry this, and they are the difference between the redesign and a
recolour.

### 1. The working line

A strip that names the current verb and cycles as work proceeds:

> **Scoring…** EU logistics — VP+ · imports run in the background · **412 so far**

Verbs rotate through `Sourcing · Paging · Reading · Scoring · Spurling ·
Reconciling · Enriching` on a 2.6s interval, with a live count beside them. A
slow light sweeps the strip left to right. Present participle, always — the
product is mid-sentence because it is mid-work.

Appears on Leads, Dashboard, Campaigns, Sequence Builder, Inbox composer,
Onboarding, and the marketing side of Auth.

### 2. Fit and signal

The Leads table leads with a **Fit** score — a mono figure on the standard meter
— and next to it a **Signal** column saying *why*: "Posted about tool
consolidation", "Hiring 2 SDRs", "Investor, not a buyer". The score alone is a
black box. The score plus one clause is a judgement the user can overrule.

Scores at 70+ are green, 60–69 neutral, below 60 grey. Rows sort by fit by
default, so the list arrives in priority order.

### 3. Why this lead

Every lead drawer opens with a short paragraph in an accent-spined panel
explaining the score in plain prose, then a suggested opener the user can
regenerate. Spurly argues its case; it does not just assert a number.

### 4. Ask Spurly (⌘K)

A command palette taking natural language — "Find VPs of Sales in Germany with a
2nd-degree path", "Why did 14 enrichments fail yesterday?" It replaces the
generic search box in the sidebar, which is the single clearest signal that the
product is AI-native rather than AI-decorated.

---

## Multi-step over multi-page

Anything with more than two decisions is a focused sequence inside the page it
belongs to, not a separate route. Progress is shown as segment bars that fill
left to right, never as numbered circles.

| Flow | Where it lives | Steps |
|---|---|---|
| New audience | Button on Leads → modal | Source → Review → Run |
| Signup | Auth | Account → Profile → LinkedIn |
| Onboarding | Full page | Profile → Audience → LinkedIn → Limits → Ready |
| Upgrade | Button on Settings → modal | Plan → Payment → Confirm |

**Import is not a page.** It is a button on Leads that opens a modal. The user
describes who they want in plain English; Spurly proposes editable filter chips
with an estimated match count, a predicted fit distribution and a credit cost;
then it runs in the background. This is the pattern for every "create" flow in
the product.

---

## Surfaces

Three planes, ordered by distance from the page, and no more:

- **Rail** `#f2f5fa` — recedes. Sidebar.
- **Canvas** `#f7f9fc` — the page.
- **Card** `#ffffff` with a `#e4e4e7` hairline — advances. One per region.

A screen is not a collection of floating boxes. The Leads table is **one** card
containing the toolbar, the bulk bar, the table and the pagination — not four
stacked cards. Inside a card, separation is a 1px `#f1f2f5` divider.

Radii: `6px` chips and small controls · `8–9px` buttons, inputs, nav rows ·
`11–12px` panels and popovers · `14px` cards · `18px` modals · `999px` filter
pills and avatars. Nothing above 18px except pills.

---

## Motion

Two curves, three durations, and a rule.

- **Hover / colour** — `160ms ease`. Borders, backgrounds, text colour.
- **Enter** — `220ms cubic-bezier(.32,.72,0,1)`. Popovers, panels, rows.
- **Travel** — `280ms` same curve. Drawers, modals, the tab underline, meters.

The rule: things that react to a pointer use `ease`; things that travel use the
decelerating curve. That distinction is what makes the product feel considered
rather than merely fast.

Specific behaviours worth preserving:

- The **tab underline slides** between tabs rather than cutting. This requires
  the tab buttons to carry explicit widths the indicator is computed from —
  padding-sized buttons will drift.
- **Drawers** slide 24px from the right under a `rgba(10,18,32,.28)` scrim.
- **Modals** rise 14px and scale from 0.985.
- **Meters** animate their width on change, never on mount.
- **Live dots** pulse at 1.4–1.6s. Static states do not pulse.
- **Skeletons** shimmer with a staggered 90ms delay per row.
- Every one of these sits inside `prefers-reduced-motion: reduce`. No exceptions.

---

## Density

Unchanged from `src/core/tokens/density.js`: row height is a token, not cell
padding. Table rows 56–58px (the fit meter needs the extra 12px over v2's 44),
header 44px, nav rows 36px, buttons and inputs 30–32px in toolbars, 38–40px in
forms.

---

## Contrast

Text meets 4.5:1. The failure mode this system invites is specific and has
already bitten twice: **10–11px mono micro-labels set in `#9aa0b0`** compute to
about 2.4:1. Micro labels use `#5e616e`. `#9aa0b0` is for non-text only — dots,
dividers, disabled glyphs.

---

## Screens built

| File | Covers |
|---|---|
| `Spurly Leads v2.dc.html` | Table, fit/signal, filters, bulk actions, import modal, ⌘K, drawer, loading + empty |
| `Spurly Auth.dc.html` | Login, 3-step signup, forgot password |
| `Spurly Onboarding.dc.html` | 5-step guided setup |
| `Spurly Dashboard.dc.html` | Overnight report, attention panel, campaign status |
| `Spurly Campaigns.dc.html` | List, funnel, detail drawer |
| `Spurly Sequence Builder.dc.html` | Step flow, inspector, AI message editing |
| `Spurly Inbox.dc.html` | Reply threads, AI-drafted responses |
| `Spurly Settings.dc.html` | Account, LinkedIn, limits, team, billing + upgrade |

`Spurly Leads.dc.html` is the earlier version, kept only as a before-state.
Do not build from it.

**Not built:** Templates, Analytics, Lead Detail as a full page, Error states,
Marketing/Pricing, dark mode.

---

## Notes for implementation

The prototypes use inline styles because they are single files. **Do not copy
that into the app.** Every value in them exists as a token in `index.css`;
components reference the token. If a value is needed that has no token, add the
token — never a literal in a component. That rule is what kept v2 coherent and
is the only reason this override is a 200-line file rather than a rewrite.

Data in the prototypes is inline arrays. The real screens wire to the existing
`useDataTable`, the sequences controller, and the leads/campaigns services.
