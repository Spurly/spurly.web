# UI v3 — "match the Claude Design zip exactly" pass

**Owner:** Prajjwal / Sarthak · **Started:** 2026-09-19 · **Source of truth for the look:** `docs/design/screens/*.dc.html` (the Claude Design zip) + `docs/design/spurlyDESIGN.md`.

This file is the hand-off log for this pass. If a session runs out, the next one
(any account) should read this top to bottom and continue from **Next up**.

---

## Why the app didn't look like the mockups (root causes)

1. **Every token font size was silently broken.** Tailwind v4 reads a bare
   `text-[var(--ui-t-body)]` as a *colour*, not a font size. All ~478 call
   sites fell back to the 14px body size — this is the "fonts/sizes look
   different" complaint. **Fix:** every call site now uses
   `text-[length:var(--ui-t-*)]` (the `length:` hint is required). The eslint
   message was updated to say so. Never write `text-[var(--ui-t-…)]` again.
2. **The shell wrapped every page in one card under a thin top band** — the
   design has no band: a 26px title + description + actions on the canvas,
   optional page tabs, then the content card(s).
3. **Shared components were built to an older rule set** ("sentence-case
   column headers", 44px rows, bulk actions replacing the search box, a
   bottom "Audiences" dock). The design says mono micro-caps headers, 58px
   rows, a separate selection band, a "New audience" modal.
4. Previous phases declared Campaigns / Sequences / Inbox / Settings "no
   changes needed" because they were already token-driven. Token-driven ≠
   matching the mockup's structure. Every screen is being rebuilt against its
   mockup now.

## Rules for this pass

- Match the mockup: layout, icons (exact SVGs in `src/core/icons/SpurlyIcons.jsx`),
  sizes, fonts (Geist + IBM Plex Mono), copy.
- **Features with no backend** are rendered in their designed place and
  marked **SOON** (`<SoonTag />`, `soonLabel()`, `<StatTile soon />`,
  `<SoonCell />`) — never faked. Each one is listed in
  `docs/UI_REDESIGN_DEFERRED_FEATURES.md`.
- Copy is the mockup's, except where the mockup claims something that isn't
  true yet (e.g. "scored against your ICP") — those clauses wait for the
  feature, noted inline in the page's `strings.js`.
- Screens with no mockup (Templates, Import, Notifications, Admin, Lead
  detail pages, Enrichment detail) get the same system: header on canvas,
  one card per region, mono micro-caps labels, 58px table rows.
- No functionality removed. Things that moved are listed below.

## Working method (how to verify)

- Mockups render in Chromium from `docs/design/screens/*.dc.html` (they load
  React/Babel from unpkg).
- The app renders against a mock API (Playwright route on `VITE_API_URL`),
  fixtures modelled on real `/api/hub/*` responses.
- `npm test` baseline before this pass: **87 passed / 6 failed** (the 6 are
  pre-existing, see UI_REDESIGN_PLAN.md). Tests that pinned the OLD structure
  (the dock pill, "Followers" column, sentence-case headers) are updated to
  the new structure, not deleted.

## Done

### Foundation
- [x] Type-token bug (above) fixed across src; new tokens `--ui-t-control`
      (13px), `--ui-t-title` (15px), `--ui-t-figure` (17px),
      `--ui-t-heading` (19px), `--ui-surface-header`, `--ui-text-body`,
      `--ui-meter-track`, `--ui-accent-fg-soft`, `--ui-accent-muted`,
      `--ui-radius-2xs`; motion classes `sp-rise/pop/modal/drawer/scrim`.
- [x] Icon set `src/core/icons/SpurlyIcons.jsx` — the handoff's own glyphs.
- [x] Shell (`DashboardLayout`): design sidebar (mono section labels, 36px
      rows, spine on active, counts/pulse/pill badges, daily-cap meter,
      credits reading, account row with theme + log-out menu); page header on
      canvas; props `tabs`, `layout="card"|"page"|"bare"`.
      Extension status row now only appears when something is wrong; the
      LinkedIn row's dot carries the live state.
      Nav order = mockup (Campaigns, Sequences, Inbox, Templates).
      "LinkedIn settings" → "LinkedIn".
- [x] Primitives: Button sizes (30/32/40), `accentOutline` variant, Input,
      Checkbox (15px), Badge (tint = sans pill, minimal = mono caps),
      PageTabs (sliding underline + mono count chip), EmptyState, Skeleton,
      Dialog (18px radius, footer band), Drawer (404px, eyebrow header),
      Card, SectionCard (mono micro-caps header + text action),
      Dropdown, new `StatTile`, `SoonTag`, `WorkingLine`.
- [x] DataTable: mono headers on `--ui-surface-header`, 58px rows, 13px
      cells, selection band (`BulkActionBar`) under the toolbar, `banner` slot
      (working line), `chips` slot, mono pagination, `emptyIcon`.
      New cells: `ActivityCell`, `SoonCell`; helper `soonLabel()`.

### Screens
- [x] **Leads** — Leads v2: header + "New audience", tabs outside card,
      toolbar (search · Filter SOON · List picker), working-line band,
      selection band (Send requests · Send messages · Draft openers SOON ·
      Enrich · sequence), columns Name+headline · Title · Company ·
      Location · Deg · Fit SOON · Signal SOON · Status · Enrichment ·
      Last activity. Lead drawer rebuilt (Why this lead / Suggested opener
      marked SOON, Profile key/values, Activity timeline).
      **Moved:** the bottom "Audiences" dock is gone → building an audience is
      the 3-step **New audience** modal (Source → Review → Run; URL, filters,
      CSV→Import page; "Describe" SOON); managing saved audiences (status,
      re-run, remove, stopped-short notice) lives in the **List** picker.

- [x] **Enrichment** (no mockup — Campaigns register): working line, 4 stat
      tiles (Needs enrichment / Enriched / In flight / Failed), status pills,
      table card (Batch + mono created · People · Progress meter · In
      progress · Failed · Status). Header action "Enrich leads" → Leads,
      Needs-enrichment tab (via `location.state.tab`). Detail: back button,
      status badge, mono meta, stat tiles, filter pills, table.
- [x] **Campaigns** — mockup: working line, stat tiles (Sending now / In
      flight / Accepted / Replies waiting), status pills, **card grid**
      (`CampaignCard`: status pill + when, name, leads · type, meter
      handled/total, Accepted · Accept rate · Replied SOON, factual note box,
      "…" menu Start/Pause/Open/Remove). Status labels: Sending / Paused /
      Finished / Draft.
- [x] **Campaign detail** — back button + badge + mono meta, primary
      Start/Resume, console layout (`layout="plain"`), pacing band restyled
      as a working line, filter pills, member table (name + headline).
- [x] **Sequences list** — table card with status pills and a Flow column
      (step glyph chain). Status "Live".
- [x] **Sequence builder/detail** — mockup: full-bleed (`layout="bare"`),
      Flow | Enrolled tabs, vertical step cards joined by dashed connectors
      with "+" inserts (draft), working line, right inspector (Overview
      stats/outcomes/remove, or selected step: description, message +
      variable chips, Drafted/Edited/Rewrite SOON, Timing, Rules SOON).
      "Test run" SOON.
- [x] **Dashboard (Home)** — greeting, working line, 4 stat tiles, "Worth
      your attention" (unread replies / enrichment failures / paused
      campaigns, each with a mono action), "Top of the list" (newest leads,
      fit ranking SOON), "Campaigns running" (meter rows), "Recently" (the
      notification feed = real activity; stands in for "Overnight").
- [x] **Inbox** — no page band; list column with title/description/search/
      pills (All / Unread), rich rows (2-line preview, unread tag, degree,
      headline), active row spine; thread header with degree + View profile;
      bubbles (ours = accent); composer card with the existing AI write
      button, suggestion chips SOON.
- [x] **Settings** — one frame, tabs Account · LinkedIn · Sending limits ·
      AI context · Extension · Team · Billing (`?tab=`; LinkedIn keeps its
      route). Account = profile card + Notifications SOON; Sending limits =
      real cap/usage meter + cap choices/window/rules SOON; Team = single
      seat + SOON; Billing = Current plan card (real plan/renewal/credits/
      invites) + Upgrade/Invoices SOON. New primitives `Switch`, `SwitchRow`.
- [x] **Templates** (no mockup): header "New template", page tabs with
      count, card with search toolbar, 2-column template cards (spine when
      open), editor as right inspector.
- [x] **Import** (no mockup): page tabs in the header area, page layout.
- [x] **Notifications** (no mockup): description, feed rows with unread
      spine + mono time.
- [x] Shared: `layout="plain"`, `backTo`/`badge` header props, `FilterPills`,
      `Menu`, `MeterCell`; DetailConsole/RailCard/FactList restyled.

- [x] **Auth + Onboarding**: split screen with blue panel, segment-bar stepper.
- [x] Docs: `docs/UI_V3_NEW_VS_OLD.md`; SOON list in `UI_REDESIGN_DEFERRED_FEATURES.md`.
- [x] `vite build` passes; eslint 133 warnings (limit 144), 0 errors.

## Next up (in order)

- [ ] Tests: 1 failed file group left, pinned to the OLD structure (update, don't delete):
      campaigns "shows counts" (card shows "7/40" handled) and "creates a connect
      campaign" (button now "Send requests"); inbox "you:" → "You: "; leads dock
      tests → NewAudienceModal / AudiencePicker (combobox "Filter by list");
      followers test → drawer Profile; "/hub lands on dashboard"; linkedinSettings
      re-read (pre-existing). NoteEditor tests are fixed.
- [x] Backend: LIST_FIELDS now includes createdAt updatedAt pendingInvitationSentAt (restart the backend).
