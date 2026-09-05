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

## 1. Where things actually are today

```
src/
├── App.jsx, main.jsx, routes.jsx, index.css
├── core/
│   ├── gateway/       # 14 API clients + apiGateway.js (axios, token, 401 handling)
│   ├── controllers/   # 9 orchestrators between gateway and UI
│   ├── entities/      # User, Profile, Subscription, patchEntity
│   ├── context/       # AuthContext, SubscriptionContext
│   └── extension/     # extensionBridge.js (postMessage to the Chrome extension)
├── features/          # people, campaigns, connections, import, templates,
│                      # research, personalization, settings, admin
├── ui/                # DESIGN SYSTEM — primitives, layout, tokens, hooks, icons
├── components/        # DataTable, LeadDetailSidebar, DashboardLayout,
│                      # ProtectedRoute, AdminRoute, SubscribeGate, …
├── common/utils/      # dates, csvExport, csvImport, templateTokens, outreach, …
├── hooks/             # useAuth, useCampaign, useExtension, useMetrics, …
├── auth/              # login/signup/verify/reset pages, AuthShell, cashfree
├── admin/             # AdminLayout + admin.css
├── marketing/         # the getspurly.com marketing site, self-contained
├── pages/             # LinkedInCallback (the last survivor of the old layout)
└── dev/               # UiPreview.jsx
```

### The one real problem

**A single feature is spread across five directories.** Campaigns lives in `core/gateway/campaignsApi.js`
+ `core/controllers/campaignsController.js` + `hooks/useCampaign.js` + `features/campaigns/` +
`components/DataTable/`. Touching one feature means editing four folders and remembering which is which.

That's not a naming problem, it's a change-cost problem, and it compounds with every feature added.

Everything else here is fine. `src/ui/` in particular is a genuine design system with one token layer —
**leave it alone.**

---

## 2. Target structure

Mirror the backend, so a feature has the same name on both sides of the wire:

```
src/
├── app/                    # App.jsx, routes.jsx, providers, layouts, ProductSwitcher
├── shared/                 # apiGateway.js, http, generic utils (was common/utils)
├── ui/                     # design system — unchanged
├── platform/               # spans every product
│   ├── auth/               # was src/auth + pages/LinkedInCallback
│   ├── billing/            # subscription context, pricing, payments
│   ├── people/             # the shared lead book
│   └── admin/              # was src/admin + features/admin
├── products/
│   ├── leadgen/            # today's extension-driven Spurly
│   │   ├── campaigns/ connections/ import/ templates/ research/ personalization/
│   │   └── routes.jsx      # one lazy-loaded chunk
│   └── hub/                # the Unipile product (see spurly.backend/UNIPILE_MODULE_PLAN.md)
│       └── routes.jsx
└── marketing/              # unchanged, self-contained
```

### A feature folder is self-contained

```
campaigns/
├── index.jsx           # route entry — the ONLY file other modules import
├── CampaignDetailPage.jsx
├── components/
├── columns.jsx
├── helpers.js
├── api.js              # moved from core/gateway/campaignsApi.js
├── controller.js       # moved from core/controllers/campaignsController.js
└── hooks/              # moved from hooks/useCampaign.js
```

Read it, move it, or delete it in one go. That's the whole goal.

**What stays shared:** `apiGateway.js` (axios instance, token injection, 401 handling) is genuinely
cross-cutting → `shared/`. `DataTable` is used by every product surface → `ui/`. Entities that model
platform objects (`User`, `Subscription`) → `platform/`.

---

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

Do this one feature at a time, alongside normal work — never as a big-bang refactor.

1. Collapse the leftovers of the old layout: `pages/` (one file) → `platform/auth/`; `dev/UiPreview.jsx`
   behind a dev flag or deleted.
2. Colocate **one** feature end to end (`campaigns` is the best first candidate — it has an api client,
   a controller, a hook and a page, so it exercises every move).
3. Repeat per feature. Distribute `hooks/`, `common/utils/`, `components/`, `core/` as each feature claims
   its parts.
4. Create `platform/` and `products/leadgen/`; `git mv` the folders.
5. Turn on the boundary lint rule (config in `spurly.backend/ARCHITECTURE.md`) in warn mode, fix, flip to error.
6. Add `products/hub/`.

**Done already (2026-09-04):** `src/_trash/` deleted.
