# UI redesign — deferred features

Things the design handoff (`spurlyDESIGN.md` + the 8 mockups) assumes exist,
that turned out to be net-new product/backend work rather than a UI change —
discovered while working through `docs/UI_REDESIGN_PLAN.md`. Each entry says
what the mockup shows, what's actually there today, and roughly what building
it for real would take. Nothing in this file has been built; it's a backlog,
not a status report.

---

## 1. Lead Fit score + Signal (found during Phase 4a, Leads)

**What the mockup shows:** every row in the Leads table leads with a **Fit**
score (a 0-100 number on the standard meter, green at 70+, neutral 60-69,
grey below 60) and a **Signal** column next to it explaining *why* in one
clause ("Posted about tool consolidation", "Hiring 2 SDRs", "Investor, not a
buyer"). Rows sort by fit by default. The lead drawer opens with a paragraph
explaining the score in prose. This is called out in `spurlyDESIGN.md` as
one of the four things that make the redesign "AI-native" rather than a
recolour.

**What exists today:** nothing. Grepped the whole backend for
`fitScore`/`leadScore`/`scoring` — no field on `HubLead`, no job that
computes one, no LLM call anywhere in the leads/sourcing pipeline. This
isn't a rename or a UI wire-up; it's a feature that doesn't exist yet.

**What building it for real would take** (rough shape, not a spec):
- A scoring pass — most plausibly an LLM call per lead (or per batch) that
  reads the lead's profile data against the user's ICP/audience criteria
  and returns a 0-100 score plus a one-clause reason. Needs a prompt, a
  provider choice, and a place in the pipeline to run it (likely alongside
  or right after the existing import/enrichment flow in
  `products/hub/sourcing` and `products/hub/enrichment`).
- New fields on `HubLead` (something like `fitScore`, `fitReason`,
  `fitScoredAt`) and a migration/backfill story for leads sourced before
  scoring existed.
- Cost/latency: an LLM call per lead is real spend and real time at import
  volume — needs a batching/queuing decision, not a call-per-row-on-render.
- A default sort-by-fit on the leads list, which the frontend can add
  trivially once the field exists.
- The drawer's "why this lead" paragraph is a second LLM surface (longer
  prose, regeneratable "suggested opener") — related to, but a bit more
  than, the score+reason above.

**Where this leaves the Leads screen redesign:** the table layout, filters,
bulk bar, import modal, working-line strip, and drawer chrome all got
rebuilt in Phase 4a to match the design. The Fit/Signal columns were
deliberately left out rather than stubbed with fake numbers — see the
Leads section of `docs/UI_REDESIGN_PLAN.md` for exactly what shipped.

---

## 2. Dashboard's overnight timeline, per-lead Fit ranking, and audience-runout prediction (found during Phase 4b, Dashboard)

**What the mockup shows:** three widgets on the new Dashboard/Home screen —
an "Overnight" timeline narrating what ran while the user was away ("412
leads imported...", "286 profiles enriched..."), a "Top of the list" panel
ranking the 4 highest-Fit leads (depends on #1 above, not built for the
same reason), and an attention-panel card predicting an audience will
"run out of leads in 2 days" from its remaining count and send rate.

**What exists today:** no activity/audit log anywhere in the backend
(grepped for `activity`, `timeline`, `auditLog` — nothing) to narrate a
timeline from, and no per-audience remaining-count-vs-send-rate helper.
`describePacing()` covers the account-level daily cap, not a
per-audience runway projection.

**What shipped instead (real data only):** four stat tiles (leads
sourced, invites sent today, connect rate, replies waiting), an attention
panel with two real items (enrichment failures in the last 24h, unread
inbox count) linking to the relevant screen, and a real "campaigns
running" list reusing the same `useCampaigns` hook and `CountPills`
component the Campaigns list uses — counts, not a progress bar, per the
"progress is four counts, never a bar" rule already established there.
The working-line strip (rotating verb + count) was also left off this
screen — it names an in-progress *action* (an import run), and the
Dashboard is a summary of several independent things, not one running
job. `GET /api/hub/summary/dashboard` (new, extends the existing
`/hub/summary`) computes connect rate and recent enrichment failures for
real off `HubCampaignMember.status` and `HubLead.enrichmentStatus`.

**What building the rest for real would take:**
- An activity/audit log: something has to write an event row per
  import/enrichment/send run for a timeline to read back. This is
  cross-cutting (sourcing, enrichment, campaigns would all need to emit
  to it), not a Dashboard-only change.
- Audience runout: `(remaining in audience) / (average daily send rate
  for that audience's campaign)`, both computable from existing data —
  smaller lift than the other two, but not done here since it wasn't
  needed to ship the rest of the screen honestly.
- Top-Fit leads panel: blocked entirely on #1 (Fit score) above.

---

*(Append future entries here in the same format as they're found — what the
design assumes, what's actually there, what real work it would take.)*

## 3. AI-drafted inbox replies (found during Phase 4e, Inbox)

**What the mockup shows:** the reply composer opens with a full draft
already written by Spurly, generated from the thread's own history and
signal, which the user edits or sends as-is — the same "you approve the
frame, not each message" pattern as the sequence builder's AI opener step.

**What exists today:** a manual composer only. `useThread.js`'s `draft`
state is plain local text state tied to a `<textarea>`/input the user
types into (`setDraft`); nothing calls out to an LLM anywhere in
`products/inbox`.

**What building it for real would take:**
- A generation call keyed off the thread's message history (and ideally
  the lead's own profile/signal, same inputs the sequence builder's AI
  opener step would use) — needs a prompt, a provider choice, and an
  endpoint (`products/hub/inbox` on the backend has no such route today).
- A UI moment for "generating…" before the draft lands, and a clear
  affordance that it's editable, not final (`Thread.jsx`'s composer
  already exists and would take the generated text as its initial
  `draft` value — the wiring point is small; the generation itself is
  the real work).
- Cost/latency and a regenerate action, same considerations as the
  sequence builder's opener and the leads drawer's "why this lead"
  paragraph in entry #1.

**Where this leaves the Inbox screen redesign:** the chat rail, thread
view, composer, sync action and both loading skeletons were already
fully token-driven before this redesign and needed no changes to match
Blue Identity v3. AI drafting is the one mockup device left unbuilt.

## UI v3 pass — items shown as SOON (build later)
- Leads: Fit score, Signal column, Draft openers (bulk), Filter chip, "Describe" audience source, estimated matches / predicted fit, enrich-on-arrival, drawer "Why this lead" + "Suggested opener".
- Campaigns: Replied / reply-rate metrics.
- Sequences: Test run; step Drafted/Edited/Rewrite; step Rules.
- Inbox: suggested replies; "Interested" filter.
- Settings: notification preferences; cap / sending window / rules editing; Team (invites, seats); Upgrade; Invoices; Change photo.
- Backend: lead list needs `createdAt` + `pendingInvitationSentAt` in LIST_FIELDS (spurly.backend `src/products/hub/sourcing/service.js`) so Status / Last activity fill for every row.
