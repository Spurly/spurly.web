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

### Known follow-up

`ui/compat/` (was `common/components`) duplicates `Badge`, `Input`, `Tabs` and
`Tooltip`, which already exist in `ui/primitives`. Merging them changes rendered
output, so it was deliberately kept out of a pure-move commit. Do it as its own
change, with screenshots.

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

## 5. Migration order

**Phase 1 — colocation + boundary enforcement: DONE 2026-09-05** (`caac249`, `51d321e`).

Verified as a pure move: the production build emitted **byte-identical assets**
(`index-kUZbIFw4.js`, `index-CYnvmBP_.css`) before and after — same content hashes, so
the program is provably unchanged and only its file layout differs.

Doing this in one pass was safe for reasons specific to this repo, not because moves are
generally safe: **342 of 353 imports are absolute** (`src/...` via the Vite alias), so a
move is a string replace rather than a relative-path recomputation, and there are **zero
dynamic imports** — nothing is referenced by string path at runtime.

**Phase 2 — the test harness. NOT DONE, and it gates phase 3.**
This repo has **zero test files and no test framework**. Install vitest +
@testing-library/react and write ~15 smoke tests over the paths that would fail silently:
login, people list loads, campaign create, template picker, subscription gate. Roughly
half a day.

**Phase 3 — the behavioural changes, which need phase 2 first:**
- Lazy-load each product's routes as its own chunk. The build is currently ONE 1.1MB
  chunk; this is also what makes the switcher cheap.
- The product switcher (§2b).
- Merging `ui/compat` into `ui/primitives`.
- Collapsing the controller layer into hooks, if you decide it earns its keep.

These change what runs, not just where it lives, so a byte-identical build can no longer
be the proof.
