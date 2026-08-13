# Spurly Web — UI surface inventory

**Date:** 13 Aug 2026 · **Companion to:** `UI_SYSTEM_PLAN.md`

Every in-app surface, including the ones that only appear on a click, on an error, or
on an empty account. Marketing pages (`src/marketing/**`) are out of scope.

Status legend: **done** · **partial** (on the new table/tokens but body untouched) · **untouched**

---

## A. Overlays — the invisible half of the app

Eight surfaces that never appear in a screenshot of a route. All are independently
hand-rolled today: eight separate focus traps, eight scroll-lock behaviours, eight
Escape handlers, eight backdrop implementations. **This is the single largest
duplication left in the codebase.**

| # | Surface | File | Lines | Opens from | Status |
|---|---|---|---|---|---|
| A1 | **Person detail drawer** | `components/LeadDetailSidebar.jsx` | 224 | Row click on People + Connections | untouched |
| A2 | Outreach timeline | `components/OutreachTimeline.jsx` | 140 | Inside A1 | untouched |
| A3 | Create campaign | `features/people/components/CreateCampaignModal.jsx` | 268 | People bulk action | untouched |
| A4 | Template picker | `components/TemplatePickerModal.jsx` | 292 | Campaign detail · Templates | untouched |
| A5 | Enable extension | `features/campaigns/EnableExtensionModal.jsx` | ~90 | Send gate on Campaign detail | untouched |
| A6 | Admin — credits | `features/admin/components/CreditsModal.jsx` | 193 | Admin Users row | untouched |
| A7 | Admin — assign plan | `features/admin/components/PlanAssignModal.jsx` | 170 | Admin Users row | untouched |
| A8 | Admin — plan form | `features/admin/components/PlanFormModal.jsx` | 243 | Admin Pricing row | untouched |
| A9 | Admin — user details | `features/admin/components/UserDetailsModal.jsx` | 198 | Admin Users row | untouched |

**A1 is the highest-traffic surface in the product that hasn't been touched.** Every
row click on the two biggest tables lands there.

---

## B. In-page surfaces

Panels, editors and canvases that live inside a route but are their own design problem.

| # | Surface | File | Lines | Status | Note |
|---|---|---|---|---|---|
| B1 | Campaign detail — header + stat strip | `features/campaigns/CampaignDetailPage.jsx` | 892 | partial | Five distinct surfaces in one file |
| B2 | Campaign detail — action picker | ↑ same file | — | untouched | The two big choice cards |
| B3 | Campaign detail — invitation note editor | ↑ same file | — | untouched | Token chips, preview, char counter |
| B4 | Campaign detail — member list | ↑ same file | — | untouched | Node list beside the canvas |
| B5 | Campaign flow canvas | `features/campaigns/CampaignFlowCanvas.jsx` | 256 | untouched | 32 inline styles, the most in the app |
| B6 | Enrich — CSV upload | `features/enrich/UploadPanel.jsx` | 317 | partial | Dropzone, validation banner, format note |
| B7 | Enrich — staging | `features/enrich/StagingPanel.jsx` | 349 | partial | Bulk enrich bar, move-to-People flow |
| B8 | Templates — master/detail | `features/templates/index.jsx` | 410 | untouched | List pane + editor pane |
| B9 | Template editor | `features/templates/TemplateEditor.jsx` | 282 | untouched | Token insert, live preview |
| B10 | Settings | `features/settings/index.jsx` | 285 | untouched | Profile · billing · extension status |
| B11 | Admin insights | `features/admin/Insights/index.jsx` | 682 | partial | Charts + segments; 2nd largest file |
| B12 | Admin shell | `admin/AdminLayout.jsx` + `admin/admin.css` | — | untouched | Separate chrome from DashboardLayout |

---

## C. Auth and onboarding

Everything before the dashboard. Currently styled by `auth/auth.css` (615 lines) — a
parallel design system that predates the token layer entirely.

| # | Surface | File | Lines | Status |
|---|---|---|---|---|
| C1 | Auth shell | `auth/AuthShell.jsx` + `auth/auth.css` | 270 + 615 | untouched |
| C2 | Shared auth widgets | `auth/widgets.jsx` | 262 | untouched |
| C3 | Signup | `auth/SignupPage.jsx` | 164 | untouched |
| C4 | Verify email | `auth/VerifyEmailPage.jsx` | — | untouched |
| C5 | Login | `auth/LoginPage.jsx` | — | untouched |
| C6 | Forgot password | `auth/ForgotPasswordPage.jsx` | — | untouched |
| C7 | Reset password | `auth/ResetPasswordPage.jsx` | 122 | untouched |
| C8 | Onboarding survey | `auth/OnboardingSurveyPage.jsx` | 306 | untouched |
| C9 | Install extension | `auth/InstallExtensionPage.jsx` | 265 | untouched |
| C10 | LinkedIn callback | `pages/LinkedInCallback/index.jsx` | — | untouched |

---

## D. States — the surfaces nobody designs

Not files. These are conditions every surface above can be in, and they're where the
product currently looks least finished. **Most bugs and most ugliness live here.**

| # | State | Where it shows | Status |
|---|---|---|---|
| D1 | Empty — no data at all | 9 tables, Templates, Campaigns, Staging | done in tables via `EmptyState`, untouched elsewhere |
| D2 | Empty — filtered to nothing | People, Connections, Campaigns | done in tables |
| D3 | Loading — first paint | every page | skeleton rows done; page bodies untouched |
| D4 | Loading — action in flight | every button | done via `Button loading` |
| D5 | Error — request failed | every page | inline red strip in table; ad hoc elsewhere |
| D6 | **CSV validation failure** | Enrich upload | untouched — screenshot 2 |
| D7 | **Extension not installed** | anywhere that sends | sidebar dot done; gate modal untouched |
| D8 | **Extension signed out** | anywhere that sends | sidebar dot done; gate untouched |
| D9 | **Zero credits** | capture, enrich, send | untouched — no designed state exists |
| D10 | **Weekly invite budget exhausted** | People, Campaign detail | bar goes red; no blocking state |
| D11 | Failed sends need attention | People filter bar | done |
| D12 | Partial success after bulk action | Enrich move, campaign send | untouched |
| D13 | Long content — 60-char names, no company | every table | done via the Cell contract |
| D14 | Very large account — 10k+ rows | People, Connections | untouched (needs virtualization) |
| D15 | Offline / request timeout | global | no handling at all |

D6 through D10 are the ones a real user hits in week one.

---

## E. Primitives still missing

These block the work above. Ordered by how much they unblock.

| # | Primitive | Unblocks | Notes |
|---|---|---|---|
| E1 | **Dialog** | A3–A9 (7 modals) | Focus trap, scroll lock, Escape, restore focus |
| E2 | **Drawer** | A1 | Same machinery, side-anchored |
| E3 | **Dropdown / Menu** | row actions, account menu, filters | Arrow keys, typeahead, outside-click; uses `Popper` |
| E4 | **Select** | Settings, Admin forms, page size | Hardest one — listbox + keyboard + positioning |
| E5 | **Textarea** | Template editor, invitation note | Auto-grow, char counter |
| E6 | **SegmentedControl** | People filter, Enrich tabs | Currently hand-rolled in `features/people` — will get copied if left |
| E7 | **Toast** | D12, every mutation | No success feedback anywhere today |
| E8 | **Switch** | Settings | — |
| E9 | **Field / FormRow** | C3–C8, Admin forms | Label + hint + error, one component |
| E10 | **Command (⌘K)** | global nav | Depends on E3 + E4 |
| E11 | **Stat** | B1, Admin insights | The "10 Total / 10 Sent / 0 Pending" strip |

---

## Suggested order

**1 — `Dialog` + `Drawer` + `Toast`.** Nine overlays collapse onto two primitives.
A1 and A3 are the two the user sees most; do those first and the rest are template work.

**2 — Campaign detail (B1–B5).** Biggest single file, most sub-surfaces, most visible
after People. Extract the send logic into a hook and verify sending still works
*before* touching a single style — this is the one place a visual refactor can break
the product's core action.

**3 — Enrich (B6, B7) + states D6, D12.** The CSV failure banner is a first-run
surface: it's what a new user sees when their file is wrong, which is often.

**4 — Templates (B8, B9) + Settings (B10).** Needs `Textarea`, `Select`, `Switch`,
`Field`.

**5 — States D7–D10.** Extension disconnected, no credits, budget exhausted. Small,
and they're the difference between "broken" and "explained".

**6 — Auth and onboarding (C1–C10).** Delete `auth/auth.css` entirely. Self-contained,
zero risk to the dashboard, and it's the first thing a new user ever sees.

**7 — Admin (B11, B12).** Internal-only, so it goes last regardless of size.

---

## Scale

| | Count |
|---|---|
| Overlays | 9 |
| In-page surfaces | 12 |
| Auth / onboarding | 10 |
| Distinct states | 15 |
| Primitives to build | 11 |
| **Surfaces total** | **31** |

Roughly 8,900 lines of untouched or partially-touched JSX outside the marketing site,
plus 615 lines of `auth.css` to delete.
