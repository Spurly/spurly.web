# Spurly Web — Frontend Architecture

**Rewritten 2026-09-04 from a scan of the actual `src/` tree.**
The previous version of this file documented `src/api/`, `src/controllers/`, `src/entities/` and
`src/pages/` as the structure. None of those directories exist. If you read that doc — or pointed an AI
coding tool at it — you were being told to build in a layout the codebase abandoned. That is the reason
this file is worth keeping accurate: **a wrong architecture doc doesn't just fail to help, it actively
recreates the wrong structure.**

Cross-repo rules (the `shared ← platform ← products` boundary, the `index.js` public-interface rule,
the lint config that enforces both) live in **`spurly.backend/ARCHITECTURE.md`**. This file covers the frontend
specifics only.

---

## 1. Layout (updated 2026-09-15 — leadgen decommissioned, hub flattened, ui+platform merged)

```
src/
├── main.jsx  index.css        # Vite entry (index.html points here — don't move)
├── app/                       # composition root: App, routes, ProtectedRoute,
│                              # AdminRoute, SubscribeGate
├── shared/                    # domain-free: gateway/apiGateway, utils, entities
├── core/                      # everything common/reusable across the app — design
│   │                          # system (primitives, tokens, theme, hooks, icons)
│   │                          # AND domain-aware cross-product code, merged 2026-09-15
│   ├── primitives/  tokens/  theme/  hooks/  icons/
│   ├── auth/  billing/  people/  outreach/  research/  admin/  notifications/
│   ├── hubImport/             # gateway a product's import flow calls
│   ├── layout/                # DashboardLayout, SidebarBrand (need auth) AND Card,
│   │                          # Toolbar (don't) — one folder now, see §1a
│   ├── extension/             # useExtension
│   └── DataTable/             # its cells resolve logos + photos
└── products/                  # ONE product today — its former internal
    │                          # modules sit directly here (see below)
    ├── campaigns/  leads/  sequences/  enrichment/  inbox/
    ├── import/  templates/  personalization/
    ├── settings/  accountSettings/
    └── pages/                 # every route's index.jsx, one subfolder per feature
```

### 1a. `ui` + `platform` → `core` (2026-09-15)

`src/ui/` (zero-domain-knowledge design system) and `src/platform/` (domain-aware
cross-product code) are now a single `src/core/`. Before this merge, `npm run lint:arch`
proved `ui` never imported from `platform` — a structural guarantee that nothing in the
design system could reach into auth/billing/domain logic, safe to reuse even in
`marketing/` pages that carry no auth context. That guarantee is gone: `core` is one
`boundaries/elements` type now, so nothing stops a primitive from importing something
domain-aware. The design-system corner of `core` (`primitives/`, `tokens/`, `theme/`,
`icons/`, and the `Card`/`Toolbar` parts of `layout/`) is still meant to stay domain-free
by convention, and `eslint.config.js`'s hardcoded-value guards are scoped to exempt
exactly those paths — but it's discipline now, not a lint-enforced boundary.

(`marketing/` is unchanged and self-contained, omitted above.)

There is only one product now. `products/leadgen` — the ₹1500-tier capture
workspace, the two-tier ₹1500/₹5000 subscription split, the `PeoplePage`, and
the `HubGate` entitlement gate that used to wall off `products/hub` — were all
decommissioned together on 2026-09-14; every active subscriber now gets full
access to everything. What had been nested one level down as `products/hub/*`
was then flattened straight under `products/*` on 2026-09-15, since a single
level of nesting for the only remaining product no longer meant anything.
Route namespaces (`/dashboard/*` vs `/hub/*`) are a leftover of that history,
not a live product boundary — see `routes.jsx` and §2b below.

Each feature owns its `api.js`/`gateway.js`, `controller.js` and hooks. Nothing is spread
across `core/gateway`, `core/controllers`, `hooks`, `features` and `components`
any more — those directories are gone.

**Enforced** by `npm run lint:arch` (`eslint.boundaries.config.js`):
`shared` ← `core` ← `products`. `npm run verify` runs it plus the build.
Because there is only one product, a `products/*` module may import any other
`products/*` module (`eslint.boundaries.config.js` treats them as one
"product" element) — the boundary that still bites is `core` never
importing a product, and `shared` never importing `core` or a product.

### Placements the import graph decided, against intuition

- **`research`, `outreach`, `people` and `DataTable` all live in `core`,** same as
  everything else that isn't specific to one feature. `LeadDetailSidebar` renders
  `ResearchPanel` and uses the outreach summary — follow the imports, not the name.
  `DataTable`'s `CompanyCell` and `PersonCell` resolve company logos and profile
  photos, which is exactly why it was never a design-system primitive even before
  the `ui`/`platform` merge (§1a) made that distinction unenforced.
- **`companyLogo.js` / `profilePhoto.js` are not utils.** They wrap API
  clients, so they live in `core/people/`.
- **`core/people` is a small support module, not a feature.** Since
  `PeoplePage` was retired with leadgen, its only callers are `core/DataTable`'s
  cells and `core/hubImport`'s gateway — company/profile lookups shared across
  the app, no page of its own left.

### One component library

`ui/compat/` is gone (2026-09-05). Most of what looked like duplication wasn't:
`Card`, `Dropdown`, `MetricCard` and `SectionCard` existed only there and were
promoted into `primitives` unchanged; `Badge` and `Tooltip` were genuinely dead
duplicates and were deleted.

`Input` and `Tabs` were **different components sharing a name**, which is what made
the duplication look worse than it was:

| | |
|---|---|
| `Input` | the bare control — forwardRef, sizes, adornments |
| `Field` | label + input + error, composed around one (was `compat/Input`) |
| `Tabs` | sits INSIDE a toolbar, inherits its height so the underline meets the toolbar border |
| `PageTabs` | page-level strip with its own border and card background (was `compat/Tabs`) |

Naming them honestly was the fix. Swapping call sites onto the "real" primitive would
have changed rendered markup in Settings, Import and Admin Insights for no gain.

`package.json` declares `sideEffects: ["**/*.css"]` — the primitives barrel is imported
eagerly by `App`, so without it every re-export added to the barrel lands in the initial
chunk.

## 2b. The product switcher (decided 2026-09-05, retired 2026-09-14)

Originally: **₹5000 is a superset of ₹1500**, so a workspace switcher inside one app — not two apps
and not a redirect — swapped the sidebar and routes between a locked-vs-unlocked "leadgen" and "hub"
entry (`ProductSwitcher.jsx`, gated by `HubGate`).

That whole premise went away with the leadgen decommission on 2026-09-14: the two-tier subscription
was dropped, so there is nothing left to switch between and nothing left to gate. `ProductSwitcher`
was replaced by `SidebarBrand` — a static logo/wordmark — and both former workspaces now render as
permanent, always-unlocked sections in one sidebar (see `core/layout/DashboardLayout.jsx`). The
`/dashboard/*` vs `/hub/*` route split from that era is still there (see `routes.jsx`) purely as
legacy namespacing, not as an entitlement boundary — `ProtectedRoute` + `SubscribeGate` guard both
identically now.

Never let the vendor name reach the UI. It is the multichannel outreach product, not "the Unipile
product" — if Unipile is ever swapped for a competitor, the rename should touch zero customer-facing
strings.

## 3. Conventions (unchanged, keep following them)

- **Named exports only.** No default exports outside `src/marketing/`.
- **Absolute imports** (`src/...` via the Vite alias). Relative `../../` is allowed only inside
  `src/marketing/`, which was ported as-is and converts later.
- **Never call the gateway from a component.** Component → hook → controller → api → gateway.
- **Design tokens only.** One token layer (`--ui-*`) in `core/tokens/tokens.css`. `index.css` is a compat
  shim; `tailwind.config.js` holds no visual scales. Never hardcode a hex value in a component.
- **A feature's public interface is its `index.jsx`.** Don't reach into another feature's internals.

## 4. Request flow

```
Component
  → hook (useCampaign)          React state, caching, loading/error
    → controller                orchestration, multi-step ops, error shaping
      → api client              endpoint + response → entity
        → apiGateway            axios, Authorization header, 401 → /login
          → spurly.backend
```

The layers exist because each one has a different reason to change. Skipping a layer for a one-off call is
how you end up with a token refresh implemented in four places.

## 5. Status

**Phases 1-3 complete (2026-09-05).** Five commits: colocation, boundary lint, test
harness, code splitting, component-library merge.

| | |
|---|---|
| Structure | `shared` ← `core` ← `products`, enforced by `npm run lint:arch` |
| Tests | 93, in 15 files (`npm test`) — was zero |
| Initial JS | **1,146.68 kB → 317.52 kB** (gzip 324.91 → **102.01**) |
| Component libraries | 2 → 1 |

`npm run verify` = lint:arch + test + build. That is the gate.

### What the tests deliberately pin

- **`SubscribeGate` fails closed** — null status, inactive status AND the still-loading
  state each redirect. The loading case is the one a naive refactor gives away for free.
- **An unknown template token is stripped, never sent verbatim** — a typo'd
  `{{fistName}}` must not reach a recipient.
- **The five outreach statuses stay in step with the backend enum**; drift renders a
  blank pill rather than throwing, so it needs pinning.
- **Lazy routes actually resolve.** A typo in a `lazy(() => import(...))` specifier, or a
  named export not unwrapped to `default`, fails only when that route is visited and
  leaves the build green.

### Not done, deliberately

**Collapsing the controller layer into hooks.** No evidence it is costing anything. Churn
without a problem to solve.

**Visual regression tests.** The suite pins behaviour, not pixels. A layout regression
would still ship. Worth adding before the UI changes much.
