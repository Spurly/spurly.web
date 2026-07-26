# Spurly Web — UI/UX Redesign Plan

**Status:** Proposal · **Date:** 26 Jul 2026 · **Owner:** Sarthak
**Decisions locked:** Light canvas + teal accent · Staged rollout · Auto-named campaigns (inline-editable)

---

> **Update (26 Jul, post Phase 0/1):** Home has been **removed**, not rebuilt — People is now the landing surface and `/dashboard` redirects to `/dashboard/people`. Section §4 below is retained as the spec for if/when a Home is reintroduced, but it is **not** current. See §4.0 for what happens to the activation checklist in the meantime.

## 0. The honest diagnosis

I read the code before writing this. Five things are true, and three of them contradict the brief:

**1. You already have a Home tab.** `src/pages/Home/index.jsx`, routed at `/dashboard`, in the sidebar as the first item. The problem isn't that it's missing — it's that it's a *vanity dashboard*: three metric cards, a "Recent captures" table, "Best Industries," and a `TOP_SIGNALS` array that is **hardcoded fake data** ("Clearbit is hiring 8 SDRs," "VerifAI raised $12M Series A"). Real users are seeing invented companies on their own dashboard right now. That is a trust bug, not a design bug, and it should be deleted today regardless of the rest of this plan.

**2. You're reading lemlist's Home wrong.** Look at the screenshot again: the dominant element isn't metrics, it's **"3 of 6 tasks completed"** with a progress bar. lemlist's Home is an *activation funnel*, not a dashboard. It exists because their #1 revenue leak is "signed up → never connected a sending email → churned." Your equivalent leak is **"signed up → never installed the extension → never captured a single person → churned."** Your Home tab should be an activation surface first and a dashboard second. Copying their layout without copying their *intent* gets you a prettier version of the same problem.

**3. The brand mismatch is real and it's the single highest-leverage fix.**

| | Accent | Surface |
|---|---|---|
| `spurly.extension` (popup) | teal `oklch(0.82 0.13 200)` | dark liquid glass |
| `spurly.extension` (LinkedIn embed) | teal `oklch(0.62 0.13 205)` | white |
| `spurly.web` | **purple `#7C3AED`** | light gray `#f4f5f8` |

Users move between the extension and the web app constantly. Right now those feel like two companies' products. Fixing this is ~90% a token swap in one file — the highest ratio of perceived-quality gain to risk in the whole plan.

**4. The design system is actually good — it's just under-used.** `src/index.css` has a real token layer (semantic aliases, glass materials, radii, shadows, motion easings, z-index scale) and `tailwind.config.js` has a proper type ramp. You have `Button`, `Card`, `Input`, `Badge`, `Tabs`, `Dropdown`, `Tooltip`, `DataTable`, `MetricCard`, `SectionCard`. But pages bypass them constantly — `CampaignDetailPage.jsx` is 892 lines of inline `style={{ background: 'var(--brand-purple)' }}` and hand-rolled `className` strings. **The system isn't outdated. The adherence is.** This matters for your "no bugs" requirement: every hardcoded color is a place the teal migration can miss.

**5. There are credibility holes shipping in production.**
- `/dashboard/settings` renders **"Coming soon™ — (Yes, we're actually building this. We swear.)"** It's already hidden from nav (commented out at `DashboardLayout.jsx:112`) but still routable. A paying user who lands there sees a joke where their billing page should be.
- `/dashboard/signals` — 417 lines, routed, commented out of nav. Dead code that still ships in the bundle.
- Credits (`user.creditBalance`) appear in exactly one place: a metric card on Home. lemlist puts "190 credits" persistently in the sidebar footer, because credit anxiety drives upgrades. You're hiding your own monetization signal.

---

## 1. Product principle

> **Spurly's job is to move a person from *seen on LinkedIn* → *captured* → *enrolled* → *contacted* → *replied*.**
> Every screen should answer: *where in that pipeline am I, and what's the one thing I should do next?*

The current UI is organized around **nouns** (People, Campaigns, Templates, Import). Best-in-class tools organize around **the funnel**. That's the reframe driving the IA below.

---

## 2. Navigation & information architecture

### 2.1 What's wrong now

`DashboardLayout.jsx` gives you a flat 5-item list: Home · People · Campaigns · Templates · Import. Specific problems:

| Issue | Why it hurts | Fix |
|---|---|---|
| **Import is a top-level nav item** | Import is a *verb*, not a *place*. Nobody's mental model is "let me go to the Import page." They think "I want to add people." | Demote to a primary action inside People |
| **Flat list, no grouping** | At 5 items it's fine. At 9 (Analytics, Inbox, Settings, Signals, Admin) it becomes soup. lemlist groups: Find & Manage / Engage / Analyze | Add section labels now, before you need them |
| **Hover-to-expand with 1000ms timer** (`:33`) | Classic anti-pattern. Users get accidental expansion when the cursor crosses the rail, and a 1s wait feels broken when it's intentional. | Remove hover-expand entirely. Explicit toggle + persist to `localStorage` |
| **Two avatars on screen at once** (`:139`, `:189`) | Sidebar footer avatar + topbar avatar, same initial, same gradient. Redundant and visually noisy. | Kill the topbar avatar. Sidebar footer becomes the account menu |
| **Topbar is 90% dead space** | Just title + subtitle + avatar. No search, no notifications, no global actions. ~60px of wasted vertical real estate on every page. | Make it functional (see 2.3) |
| **No global search** | Every serious B2B tool has ⌘K. Finding one person across 10k captures currently requires navigating to People and using the table filter. | Add a command palette |
| **Credits invisible** | Your primary monetization pressure signal is buried in a card on one page. | Persistent sidebar footer meter |
| **No extension connection status** | The extension is *required* for the product to function. The web app never tells you whether it's installed and connected — except inside `EnableExtensionModal` at the moment of failure. | Persistent status pill in the sidebar |

### 2.2 Proposed sidebar

> Note: the `Home` row below is **no longer applicable** — Home was removed and People is the landing surface. The rest of the structure stands.

```
┌─────────────────────────────┐
│  ⬡ Spurly            [«]   │   logo + collapse toggle
├─────────────────────────────┤
│  PROSPECT                   │   ← section label, 11px caption, uppercase
│  ⚇  People            2,481 │   ← live count badge
│  ⚡ Signals            soon  │   ← visible but disabled; sets expectation
│                             │
│  ENGAGE                     │
│  ➤  Campaigns            3  │   ← count = ACTIVE campaigns only
│  ✎  Templates               │
│  ⌂  Inbox             soon  │   ← replies land here (roadmap)
│                             │
│  ANALYZE                    │
│  ◱  Reports                 │
├─────────────────────────────┤
│  ● Extension connected      │   ← green / amber / red pill, live
│  ◈ 190 credits      [Top up]│   ← persistent, click → billing
│  ⚙ Settings                 │
│  ⛉ Admin                    │   ← admins only
│  ┌──┐ Sarthak Vats      ⌄   │   ← account menu (logout lives here)
│  └──┘ sarthak@…             │
└─────────────────────────────┘
```

**Why each change:**

- **Section labels** — lemlist's exact pattern (Find & Manage / Engage / Analyze). Costs nothing, scales to 12+ items, and teaches the funnel through the nav itself.
- **Live count badges** — turns nav into a status display. "Campaigns 3" tells you three are running without clicking.
- **Disabled-but-visible "soon" items** — counterintuitive but correct. Hiding Signals entirely (what you do now) means users never learn the roadmap. Showing it greyed with a "soon" chip sets expectations and is a free retention signal. **But only if you actually ship it** — otherwise delete the route.
- **Extension status pill** — the single most important piece of state in your product. If the extension is disconnected, *nothing works*, and the user currently finds out only when a campaign send fails. Surface it always.
- **Credits meter with Top up** — copy lemlist directly. Persistent, always one click from purchase.
- **Logout moves into the account menu.** Right now it's a permanent red button in the sidebar (`:157`). Destructive actions shouldn't be one misclick away.

### 2.3 Topbar — make it earn its 60px

```
┌──────────────────────────────────────────────────────────────────┐
│ People                              [🔍 Search or ⌘K]   [🔔] [+] │
│ 2,481 people · 312 contacted                                     │
└──────────────────────────────────────────────────────────────────┘
```

- **Left:** page title + a *live contextual stat line* (not the current static marketing subtitle). On People: counts. On a campaign: "24 of 50 sent · 6 accepted."
- **Center:** global search / ⌘K palette — jump to a person, campaign, or template; run actions ("create campaign", "import CSV").
- **Right:** notifications bell (campaign finished, invite accepted, credits low, weekly budget near cap) + a primary `+` action that is context-aware (People → Add people; Campaigns → New campaign).

### 2.4 Routing changes

```diff
- /dashboard                      Home              → redirects to /dashboard/people
  /dashboard/people               People            (rename from /leads — "leads" is legacy)
  /dashboard/people/:id           Person detail
- /dashboard/import               Import            → becomes a modal/drawer on People
+ /dashboard/campaigns            Campaigns
  /dashboard/campaigns/:id        Campaign detail
  /dashboard/templates            Templates
+ /dashboard/reports              Reports           (new — metrics move off Home)
+ /dashboard/settings             Settings          (real, tabbed)
+ /dashboard/settings/billing     Billing & credits
+ /dashboard/settings/extension   Extension
- /dashboard/signals              Signals           → feature-flag or delete
```

⚠️ **Keep `/dashboard/leads` as a permanent redirect to `/dashboard/people`.** Users have bookmarks; the extension may deep-link. Cheap insurance.

---

## 3. Visual system — purple → teal migration

### 3.1 The token swap

Everything lives in `src/index.css` `:root` and `tailwind.config.js`. Change the *values*, not the names:

```css
/* Brand — was purple, now the extension's teal */
--brand-teal:      #0d9bb5;   /* ≈ oklch(0.62 0.13 205) — extension embed accent */
--brand-teal-700:  #0a7d92;   /* hover / pressed */
--brand-teal-300:  #7dd3e8;   /* light fills */
--brand-teal-050:  #e6f7fa;   /* tints */

--brand-gradient:       linear-gradient(135deg, #0d9bb5 0%, #38bdf8 100%);
--brand-gradient-vivid: linear-gradient(135deg, #12aecb 0%, #4aa9f5 100%);

--accent:        var(--brand-teal);
--accent-hover:  var(--brand-teal-700);
--accent-tint:   rgba(13,155,181,0.10);
--accent-tint-2: rgba(13,155,181,0.16);
--focus-ring:    rgba(13,155,181,0.35);
```

**Do not delete `--brand-purple`.** Alias it: `--brand-purple: var(--brand-teal)`. There are dozens of `style={{ color: 'var(--brand-purple)' }}` call sites across `CampaignDetailPage`, `CreateCampaignModal`, `Home`, `Settings`. Aliasing means the reskin is instant and *nothing breaks*, then you clean up call sites at leisure. This is the core of the "no bugs" strategy.

Also update `--canvas-mesh` — it currently bakes `rgba(124,58,237,0.10)` purple radials directly into the canvas gradient.

### 3.2 Contrast check — this one matters

`#0d9bb5` on white is **3.4:1** — that **fails WCAG AA (4.5:1) for body text.** Rules:

- ✅ Fills (buttons, badges, active nav states) with white text on teal — fine, that's 3.4:1 on a large surface.
- ❌ **Never** teal text on white for anything smaller than 18px.
- For links and small accent text use **`--brand-teal-700` (#0a7d92)** — that's **5.1:1** and passes.

This is exactly the kind of thing that ships as a "subtle bug" and then never gets fixed. Bake it into the tokens: `--text-accent: var(--brand-teal-700)`, `--fill-accent: var(--brand-teal)`.

### 3.3 What else changes visually

| Element | Now | Proposed | Why |
|---|---|---|---|
| Canvas | `#f4f5f8` + purple/blue mesh radials | `#f7f8fa` flat, or a *very* faint teal mesh | The mesh gradient reads consumer-app. Data tools want a calm canvas so data is the color. |
| Card radius | 14–24px (`--radius-md/lg/xl`) | Standardize on **12px** for cards, **10px** for controls | 18–24px reads playful. Linear/Attio/lemlist all sit at 8–12px. |
| Shadows | Up to `0 28px 70px` | Cap at `--shadow-md`; use borders, not shadows | Heavy shadows are the #1 "dated SaaS" tell. Modern = hairline borders + 1px shadow. |
| Glass / backdrop-blur | On sidebar + topbar chrome | Keep, but reduce blur 24px → 12px | Cheaper to render; less shimmer on scroll. |
| Density | ~`h-10` rows, 24px gutters | Add a **compact/comfortable toggle** in Settings | Recruiters scanning 500 rows want compact. Founders sending 20 invites want comfortable. |
| Empty states | Text-only ("No campaigns yet") | Illustration + one-line explainer + **primary CTA** | Empty states are your best onboarding surface and you're wasting all of them. |

---

## 4. Home tab — the spec

### 4.0 ⚠️ Status: Home was removed, not built

**Decision (26 Jul):** the Home page was deleted. People is the landing surface. `/dashboard` redirects to `/dashboard/people`, and every existing post-login redirect (login, password reset, onboarding, LinkedIn callback, marketing nav — 9 call sites) still points at bare `/dashboard`, so nothing else had to change.

**This is a defensible call.** Post-cleanup, Home was three metric cards and two lists — it didn't earn a click, and a thin dashboard is worse than no dashboard. Landing users directly in People puts them on the most-used surface with zero navigation. Linear and Attio both do exactly this: no home, you land in the work.

**But two things from the Home spec still need somewhere to live, or they're lost:**

1. **The activation checklist (State B below) — this was the highest-leverage item in the entire plan.** It's the churn defense for "signed up → never installed the extension → never captured anyone." Without a Home, it needs another host. Options, in order of preference:
   - **A dismissible banner at the top of People**, shown only while activation is incomplete. Lowest effort, same effect, no new page.
   - The existing `/onboarding/install` page, extended — but that's a one-shot flow users don't return to, so it's weaker.
2. **"Needs your attention"** (failed sends, weekly budget near cap, enriched-but-never-contacted). This belongs as a **strip above the People table**, not a separate page.

**Recommendation:** fold both into the People page header as Phase 3 instead of building a Home. If a Home is ever reintroduced, the spec below is the starting point.

---

*The spec below is retained for reference and is not current.*

**Purpose:** answer *"is my machine running, and what's my next action?"* in under 3 seconds.

The critical design move: **Home changes shape based on where the user is in activation.** One layout for a brand-new user, another for an activated one. lemlist does this with the checklist that disappears once complete.

### State A — Not yet activated (extension not installed, or 0 people captured)

Full-width, checklist-dominant. This is your churn defense.

```
Welcome to Spurly, Sarthak                                    [Book a demo]
Get your first replies in about 10 minutes.

┌────────────────────────────────────────────────────────────────────┐
│  Get started                                    2 of 5 complete    │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░                              │
│                                                                    │
│  ✓  Create your account                                            │
│  ✓  Verify your email                                              │
│  ○  Install the Chrome extension          [Install extension →]  ▾ │
│       Spurly captures profiles straight from LinkedIn. Without     │
│       the extension nothing else works.                            │
│  ○  Capture your first 10 people          [Show me how →]        ▾ │
│  ○  Send your first campaign              [Create campaign →]    ▾ │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│  ▶ How Spurly works      │  │  ◈ 190 credits           │
│    2 min video           │  │    ~190 enrichments      │
└──────────────────────────┘  └──────────────────────────┘
```

Accordion rows (only one expanded), steps auto-complete from real state — never manual checkboxes. Once step 5 completes, the card collapses to a dismissible one-liner, then disappears.

### State B — Activated (the everyday view)

```
Good morning, Sarthak                              Last 7 days ▾   [+ New campaign]

┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ CAPTURED    │ INVITED     │ ACCEPTED    │ REPLIED     │ CREDITS     │
│    2,481    │     312     │      87     │      14     │     190     │
│  ↑ 12% wk   │  ↑ 8% wk    │  28% rate   │  16% rate   │  ~19 days   │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
       ↑ this row IS the funnel — read left to right

┌──────────────────────────────────────┐ ┌────────────────────────────┐
│  Active campaigns                    │ │ ⚠ Needs your attention     │
│  ─────────────────────────────────── │ │ ─────────────────────────  │
│  Apple Engineers — Q3                │ │ • 6 sends failed           │
│  ████████████░░░░  24/50 · 6 acc.    │ │   in "Apple Engineers"     │
│  ● Running                    [Open] │ │                    [Fix →] │
│                                      │ │ • Weekly invite budget     │
│  SaaS Founders — Jul 26              │ │   82/100 used              │
│  ██░░░░░░░░░░░░░░  4/120             │ │                            │
│  ⏸ Paused                     [Open] │ │ • 12 people enriched but   │
│  ─────────────────────────────────── │ │   never contacted [View →] │
│              View all campaigns →    │ └────────────────────────────┘
└──────────────────────────────────────┘
                                        ┌────────────────────────────┐
┌──────────────────────────────────────┐│  Recent activity           │
│  Outreach over time                  ││ ─────────────────────────  │
│   ╱╲    ╱╲                           ││ ✓ Priya accepted     2h    │
│  ╱  ╲__╱  ╲___                       ││ ➤ 12 invites sent    4h    │
│  Invited · Accepted · Replied        ││ ⚇ 34 captured        6h    │
└──────────────────────────────────────┘└────────────────────────────┘
```

**Rationale for each block:**

- **Funnel metric row.** Not 5 unrelated numbers — the actual pipeline, left to right, with conversion rates as the delta. A user instantly sees *where* they're leaking (great capture, terrible acceptance = your note copy is bad). `useOutreachSummary()` already returns `statusCounts: {none, invited, connected, messaged, replied, failed}` — **this data exists today and is unused on Home.**
- **Credits card shows runway in days**, not just a number. "190 credits" is abstract; "~19 days at your current rate" creates urgency. This is a conversion lever.
- **Active campaigns with inline progress.** Most-clicked object in the app should be one click from the front door. Currently takes two.
- **"Needs your attention"** — this is the block that replaces the fake `TOP_SIGNALS`. Fed by real data you already compute: `summary.needsAttention`, `connectionBudget.weeklyRemaining`, and failed member statuses. Every item is actionable and links somewhere.
- **Outreach over time** — `recharts` is already a dependency and unused. Three lines: invited / accepted / replied.
- **Recent activity feed** — the outreach event log is already append-only (`/api/outreach/timeline`). A global version of it is nearly free and makes the product feel alive.

### What gets deleted from Home

- ❌ `TOP_SIGNALS` — fake data, ship the deletion this week
- ❌ "Best Industries" — a curiosity, not a decision-driver. Move to Reports.
- ➡️ "Recent captures" table — move to Reports/People. Home shows *activity*, not *rows*.

### Backend needed

One new endpoint: **`GET /api/dashboard/summary`** returning `{ activation, funnel, activeCampaigns, attention, timeseries, recentActivity }`. Home currently makes 2–3 separate calls; one call removes waterfall loading and makes skeleton states trivial.

---

## 5. Page-by-page

### 5.1 People (`/dashboard/people`)

The most-used page. Currently a `DataTable` + `OutreachFilterBar`. Needs to become a workspace.

**Sections:**
1. **Header** — count + selection state. `+ Add people` splits into: Import CSV · Capture on LinkedIn · Paste URLs.
2. **Saved views** (new) — horizontal pill row: `All · Not contacted · Invited · Accepted · Replied · Needs enrichment · + Save view`. Persist to backend. **This is the single biggest UX win on this page.** Right now every session starts by re-applying the same filters.
3. **Filter bar** — keep, but move to a collapsible drawer. Advanced filters (title, company, location, degree, credits spent) shouldn't eat vertical space by default.
4. **Table** — sticky header, resizable columns, **column chooser**, row hover reveals quick actions (enrich · add to campaign · open LinkedIn), pinned first column.
5. **Bulk action bar** — floating pill on selection, not a static toolbar. `12 selected · Add to campaign · Enrich · Export · Delete`.
6. **Row click → detail drawer**, not a full page nav. You already have `LeadDetailSidebar.jsx` — use it consistently. Full page (`/dashboard/people/:id`) stays for deep-linking.

### 5.2 Campaigns list

Currently a bare `DataTable` at 69 lines. Add above it:
- **Status filter tabs:** `All · Running · Paused · Draft · Completed` (`Tabs` component exists)
- **Summary strip:** "3 running · 847 invites sent this month · 24% acceptance"
- **Per-row inline progress bar** — a campaign row without progress is nearly useless
- **Card view toggle** — campaigns are objects people feel ownership over; cards suit them better than rows

### 5.3 Campaign detail — the biggest refactor

**892 lines in one file.** This is your highest-risk file and it needs splitting regardless of design.

Proposed 3-tab structure (replacing the current single scroll):

| Tab | Contents |
|---|---|
| **Setup** | Action type (connection / message) · note/message editor with token insertion · template picker · live preview against a real recipient |
| **Recipients** | Member table · status · retry failed · add/remove people |
| **Results** | Funnel chart · timeline · per-member outcomes · export |

Plus a **persistent sticky header**: name (inline-editable — see §6) · status badge · progress bar · `Start / Pause / Stop` · weekly budget remaining. Currently `startCampaign` lives mid-page and the budget is easy to miss until you hit the cap.

**Split into:** `CampaignHeader.jsx` · `SetupTab.jsx` · `RecipientsTab.jsx` · `ResultsTab.jsx` · `useCampaignSend.js`. Extracting the send/poll logic (`pollRef`, `sending`, `retrying`) into a hook is where the real bug risk lives today.

### 5.4 Templates

410 lines, in decent shape. Add:
- Grid of template cards with **live preview** rendered against a sample person
- **Categories/tags** (Connection notes · Follow-ups · InMail)
- **Performance data per template** — "used 47× · 31% acceptance." This is a genuine differentiator; nobody in this category does per-template attribution well, and you already have the event log to compute it.
- Token reference panel that's always visible while editing

### 5.5 Import

Demote to a **full-screen modal/drawer** launched from People. Three steps with a visible stepper: `Upload → Map columns → Review & import`. Add: dedupe preview against existing people ("18 of 120 already in your list"), and a persistent import history so failed rows can be re-downloaded.

### 5.6 Settings — build it, delete the joke

Tabbed page. Ship at minimum:

| Tab | Contents |
|---|---|
| **Profile** | Name, email, password, timezone |
| **Billing & credits** | Balance, usage chart, plan, top-up, invoices, transaction history |
| **Extension** | Connection status, version, reinstall, LinkedIn account link |
| **Sending limits** | Weekly invite cap, daily cap, working hours, per-day pacing |
| **Notifications** | Email alerts: campaign complete, credits low, budget near cap |
| **Team** | (later) seats, roles |

**Sending limits deserves emphasis.** LinkedIn account restriction is your users' #1 fear. A page that says "you're inside safe limits" is a *trust product*, not a settings page. Nobody in this category presents it well. Make it a feature — show the weekly budget as a gauge with a green/amber/red zone.

### 5.7 Reports (new)

Absorbs the analytics currently squatting on Home: funnel over time, acceptance by template, acceptance by title/industry/company size, best send day/time, per-campaign comparison, credit burn. "Best Industries" and "Top titles" live here.

### 5.8 Signals

**Decide now:** ship it or delete it. Currently 417 lines, routed, hidden from nav, and fed fake data on Home. Dead-but-shipping code is exactly how "no bugs" promises break. My recommendation: put it behind an env feature flag, show it in nav as disabled with a "soon" chip, and remove the fake `TOP_SIGNALS` from Home immediately.

---

## 6. Campaign naming — the change you asked for

You're right, and the inconsistency is already in your codebase: `background.js:992` auto-names extension campaigns `Extension — <date>`, while `CreateCampaignModal.jsx` hard-blocks submit on an empty name and `model.js:25` has `required: [true, 'Campaign name is required']`. Same product, two rules.

### Behavior

**Default name:** `Campaign — Jul 26, 2026`
**Same-day collision:** `Campaign — Jul 26, 2026 (2)`, `(3)`, …
**Extension keeps its own prefix:** `Extension — Jul 26, 2026` — the source stays legible at a glance. Consider aligning both to `<Source> — <date>`: `Web — Jul 26, 2026`.

**Where it's editable:**
1. Inline in the campaign detail header — click the title, it becomes an input, blur/Enter saves, Esc cancels
2. Row action in the campaigns table → Rename
3. Optionally still shown pre-filled in the create modal for users who want to name it upfront

### Implementation

**Backend** (`spurly.backend/src/features/campaigns/`)
- `model.js` — relax `required: true` on `name`; keep `maxlength: 120`
- `service.js:75` — replace the `if (!name || !name.trim()) throw` with a `generateCampaignName(userId, source)` helper: count today's campaigns for this user, append `(n)` if > 0
- `PATCH /campaigns/:id` already accepts `name` (`service.js:212`) — no change needed ✅

**Web** (`spurly.web/src/`)
- `CreateCampaignModal.jsx` — name field becomes optional; placeholder shows the generated default; submit no longer gated on `!name.trim()`
- `CampaignDetailPage.jsx` — add `<EditableTitle>` to the sticky header
- `Campaigns/columns.jsx` — add Rename to the row menu

⚠️ **Edge cases to cover in tests:** empty string after trim → fall back to generated name · two campaigns created in the same second (race) → let the unique-ish suffix handle it, don't rely on count alone · renaming to a duplicate name → allow it, names aren't unique keys · a 120-char name in the sticky header → truncate with tooltip.

### One caution

Auto-naming removes friction but also removes a moment of intent. Mitigate by making the campaigns list scannable *without* good names — show recipient count, action type, created date, and status prominently in the row. Then a generic name costs nothing.

---

## 7. Rollout — how we ship this without bugs

Five phases. **Each one is independently shippable and independently revertable.** No phase depends on a later one.

### Phase 0 — Cleanup (½ day) — *do this first, ship it alone*
- [ ] Delete `TOP_SIGNALS` fake data from Home
- [ ] Replace or remove the "Coming soon™" Settings page
- [ ] Feature-flag or delete `/dashboard/signals`
- [ ] Add `/dashboard/leads` → `/dashboard/people` redirect
- **Risk: near zero. Ships today.**

### Phase 1 — Theme (1–2 days)
- [ ] Swap token values in `index.css` + `tailwind.config.js`; alias `--brand-purple` → teal
- [ ] Fix contrast: `--text-accent` → `#0a7d92`
- [ ] Update `--canvas-mesh`
- [ ] Standardize radii and cap shadows
- [ ] Visual regression sweep of all 14 pages
- **Risk: low — one file. The whole app reskins at once.**

### Phase 2 — Shell (3–4 days)
- [ ] Rebuild `DashboardLayout` sidebar: sections, counts, extension status, credits meter, account menu
- [ ] Remove hover-expand; persist collapse state
- [ ] Functional topbar: contextual stat line, ⌘K search, notifications
- [ ] Route restructure
- **Risk: medium — one component, but every page renders inside it. Test every route.**

### ~~Phase 3 — Home~~ → **Phase 3 — Activation + attention, folded into People** (2 days)
Home was removed (see §4.0), so this phase changes shape:
- [ ] Activation checklist as a **dismissible banner above the People table**, shown only while incomplete
- [ ] "Needs your attention" strip (failed sends · weekly budget near cap · enriched-but-not-contacted) above the table
- [ ] Funnel counts from the existing `useOutreachSummary` in the People page header
- **Risk: low — additive to a page that already works. No new route, no new endpoint needed.**

### Phase 4 — Pages, in priority order (2–3 weeks)
1. **People** (saved views, bulk bar, detail drawer) — most-used
2. **Campaign detail** (3-tab split + hook extraction) — highest complexity, highest bug risk
3. **Campaigns list** (status tabs, inline progress)
4. **Settings** (real, tabbed, with sending limits)
5. **Templates** (performance data)
6. **Import** (modal + stepper)
7. **Reports** (new)

### Phase 5 — Campaign auto-naming (1 day)
Small and self-contained. Do it any time after Phase 1 — it's independent of everything else.

### Guardrails for "no bugs"

1. **Never delete a token, only alias it.** `--brand-purple: var(--brand-teal)` means the reskin can't break a call site you missed.
2. **One phase per PR.** Phase 2 alone touches every route — don't bundle it with Phase 3.
3. **Keep the old page alive until the new one is verified.** New Home behind a flag; flip when it's right.
4. **Screenshot diff before/after each phase** across all 14 routes. Cheap, catches 80% of visual regressions.
5. **Extract logic before restyling it.** For `CampaignDetailPage`, pull `useCampaignSend` out *first*, verify sends still work, *then* restyle. Never refactor logic and visuals in the same commit.
6. **Test matrix:** empty state · loading state · error state · one item · many items (500+ rows) · extension disconnected · zero credits · budget exhausted. Most of your current bug surface is in states 6–8.

---

## 8. Where I'd push back on the brief

**"Make it look like lemlist."** lemlist is a *multichannel sequencer* — email + LinkedIn + calls + meetings + deliverability. Their nav has 13 items because they do 13 things. Spurly does one thing: LinkedIn capture → outreach. **Copying their surface area would make you look unfinished.** Copy their *rigor* — the activation checklist, the persistent credits meter, the grouped nav, the empty-state discipline. Don't copy their sitemap. Your advantage is focus; a 13-item nav throws it away.

**Match the extension theme — but not the dark glass.** The extension popup is dark liquid glass; the LinkedIn embed is white. The web app should match the **embed**, not the popup. Dense data tables and charts in dark mode are a specialist skill, and the payoff is small. Teal accent on a light canvas gets you 100% of the brand coherence at 20% of the risk. (This is the direction you selected — flagging the reasoning so it's on record.)

**The thing that will actually move your numbers isn't the redesign.** It's the activation checklist in §4 State A, the credits runway framing, and the sending-limits page in §5.6. Those three change behavior. The teal swap changes perception — necessary, but it's table stakes, not leverage. If you only have a week, do Phase 0 + Phase 1 + the activation checklist, and skip everything else.

---

## 9. Recommended sequence, one week at a time

| Week | Ship |
|---|---|
| 1 | Phase 0 cleanup + Phase 1 theme. App looks like one product, no fake data. |
| 2 | Phase 2 shell. Nav, credits meter, extension status, ⌘K. |
| 3 | Activation banner + attention strip on People, + Phase 5 auto-naming. |
| 4 | People page (saved views + bulk actions). |
| 5 | Campaign detail split. |
| 6 | Settings (real) + Campaigns list. |
| 7 | Templates + Import + Reports. |

**Fastest path to "this feels like a real product": Weeks 1–3.** Everything after that is depth.
