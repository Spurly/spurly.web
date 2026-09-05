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

## 1. Layout (SHIPPED 2026-09-05)

```
src/
├── main.jsx  index.css        # Vite entry (index.html points here — don't move)
├── app/                       # composition root: App, routes, ProtectedRoute,
│                              # AdminRoute, SubscribeGate
├── shared/                    # domain-free: gateway/apiGateway, utils, entities
├── ui/                        # design system: primitives, layout, tokens, hooks,
│                              # icons, compat/
├── platform/                  # spans every product
│   ├── auth/  billing/  people/  outreach/  research/  admin/
│   ├── layout/                # DashboardLayout (needs auth, so not ui)
│   ├── extension/             # useExtension
│   └── DataTable/             # its cells resolve logos + photos, so not ui
├── products/
│   └── leadgen/
│       ├── campaigns/  connections/  import/  templates/
│       ├── personalization/  settings/
│       └── people/            # the leadgen VIEW of the shared lead book
└── marketing/                 # unchanged, self-contained
```

Each feature owns its `api.js`, `controller.js` and hooks. Nothing is spread
across `core/gateway`, `core/controllers`, `hooks`, `features` and `components`
any more — those directories are gone.

**Enforced** by `npm run lint:arch` (`eslint.boundaries.config.js`):
`shared`/`ui` ← `platform` ← `products`. `npm run verify` runs it plus the build.

### Placements the import graph decided, against intuition

- **`research` and `outreach` are platform**, though the backend files them under
  `products/leadgen`. Here `LeadDetailSidebar` renders `ResearchPanel` and uses the
  outreach summary, and `people` is platform. Different graph, same rule — follow the
  imports, not the name.
- **`DataTable` is platform, not `ui`.** Its `CompanyCell` and `PersonCell` resolve
  company logos and profile photos. A design-system primitive doesn't know what a
  company is.
- **`companyLogo.js` / `profilePhoto.js` are not utils.** They wrap platform API
  clients, so they live in `platform/people/`.
- **The People *data* is platform; the People *page* is leadgen.** `PeoplePage` has a
  create-campaign bulk action. The api, controller, columns, cells, filters and detail
  sidebar stay in `platform/people` because the hub product will render the same leads;
  the page lives in `products/leadgen/people/`. This is the split hub needs anyway.

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

## 2b. The product switcher (decided 2026-09-05)

**₹5000 is a superset of ₹1500**, so this is a workspace switcher inside one app — not two apps and not
a redirect.

- One switcher in the top bar swaps the workspace in place: sidebar and routes change, same SPA, same
  session, no reload. `app/ProductSwitcher.jsx`.
- **Both entries are always visible.** For ₹1500 users the hub entry renders locked with an upgrade
  CTA. That is the point of keeping both products in one app: every lower-tier user sees the upper tier
  daily, in context, while they work. A separate app they get redirected to would throw that away.
- Default landing is **leadgen**, even for a ₹5000 subscriber — they have to capture leads before there
  is anyone to send to. Persist last-used workspace per user after that.
- Route namespaces stay clean (`/dashboard/*` for leadgen, `/hub/*` for the hub), each product's routes
  in one lazy-loaded chunk, so splitting to a subdomain later is moving a folder rather than a rewrite.

Never let the vendor name reach the UI. It is the multichannel outreach product, not "the Unipile
product" — if Unipile is ever swapped for a competitor, the rename should touch zero customer-facing
strings.

## 3. Conventions (unchanged, keep following them)

- **Named exports only.** No default exports outside `src/marketing/`.
- **Absolute imports** (`src/...` via the Vite alias). Relative `../../` is allowed only inside
  `src/marketing/`, which was ported as-is and converts later.
- **Never call the gateway from a component.** Component → hook → controller → api → gateway.
- **Design tokens only.** One token layer (`--ui-*`) in `ui/tokens/tokens.css`. `index.css` is a compat
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
| Structure | `shared`/`ui` ← `platform` ← `products`, enforced by `npm run lint:arch` |
| Tests | 23, in 8 files (`npm test`) — was zero |
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

**The product switcher.** It is designed (§2b) but there is nothing to switch to until
`products/hub/` exists. Building a switcher with one product is an abstraction ahead of
its second caller; the route namespaces and lazy groups it needs are already in place, so
it is a small change when hub lands.

**Collapsing the controller layer into hooks.** No evidence it is costing anything. Churn
without a problem to solve.

**Visual regression tests.** The suite pins behaviour, not pixels. A layout regression
would still ship. Worth adding before the UI changes much.
