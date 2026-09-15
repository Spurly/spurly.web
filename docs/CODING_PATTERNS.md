# Spurly Web — Coding Patterns & Conventions

> Reference for developers (and AI coding sessions) building new features. Follow these patterns
> exactly so new code is indistinguishable from existing code.
>
> **This file was rewritten 2026-09-13.** The previous version documented `src/core/entities/`,
> `src/core/controllers/`, `src/hooks/`, `src/pages/` and `src/common/components/` — a layout the
> codebase abandoned on 2026-09-05 (see `ARCHITECTURE.md` §1). If you read the old version, or
> pointed an AI tool at it, you were told to build in a structure that no longer exists. Keep this
> file in sync with the real tree; a wrong doc doesn't just fail to help, it actively recreates the
> wrong structure.

For the cross-repo rule (`shared ← core ← products`) and its rationale, see `ARCHITECTURE.md`.
This file is the "how do I write this" companion — concrete, copy-paste-shaped patterns.

---

## Stack

| Layer | Technology |
|---|---|
| Build | Vite (ESM, `type: "module"`) |
| UI | React 19 |
| Routing | React Router v6 |
| Styling | Tailwind CSS v4 + CSS custom properties (`--ui-*` design tokens) |
| HTTP | Axios (wrapped in `apiGateway`) |
| Icons | Lucide React |
| Node | ≥ 20.19.0 |
| Tests | Vitest + Testing Library |

No Redux, no Zustand, no React Query. All server state lives in custom hooks.

---

## Directory Structure

```
src/
├── app/                     # composition root — App, routes, ProtectedRoute,
│                            # AdminRoute, SubscribeGate
├── shared/                  # domain-free: gateway/apiGateway, utils, entities
│   ├── gateway/apiGateway.js
│   ├── entities/
│   └── utils/
├── core/                    # everything common/reusable across the app — design system AND
│   │                        # domain-aware cross-product code, merged into one layer 2026-09-15
│   ├── primitives/          # Button, Input, Dialog, Tabs, Toast, ...
│   ├── tokens/               # tokens.css — the ONLY place colour/type/radius live
│   ├── theme/                 # ThemeProvider, ThemeToggle
│   ├── hooks/                 # useFocusTrap, useOverlayStack, useScrollLock
│   ├── icons/
│   ├── layout/               # DashboardLayout, SidebarBrand (need auth) AND Card, Toolbar
│   │                          # (don't) — see the design-system-guard note below
│   ├── auth/  billing/  people/  outreach/  research/  notifications/  admin/
│   ├── hubImport/            # gateway a product's import flow calls
│   ├── extension/            # useExtension
│   └── DataTable/            # cells resolve company logos + profile photos
├── products/                # ONE product today — see boundary rule below
│   ├── campaigns/  leads/  sequences/  enrichment/  inbox/
│   ├── import/  templates/  personalization/
│   ├── settings/  accountSettings/
│   └── pages/                # every route's index.jsx, one subfolder per feature
└── marketing/                # unchanged, self-contained, ported as-is (own conventions)
```

`products/leadgen` (a second, lower-tier product) and the two-tier subscription gating it was
decommissioned 2026-09-14; what had been nested under `products/hub/` was flattened straight under
`products/` on 2026-09-15, since there was no longer a second product to keep it isolated from. See
`ARCHITECTURE.md` §1 for the fuller history.

**`src/ui/` and `src/platform/` were merged into a single `src/core/` on 2026-09-15.** Previously
`ui` held zero-domain-knowledge design-system primitives and `platform` held domain-aware
cross-product code, and `npm run lint:arch` proved `ui` never imported from `platform` — nothing in
the design system could reach into auth/billing/domain logic. That guarantee no longer exists:
`core` is now one layer, and nothing structurally stops a primitive from importing something
domain-aware. The design-system corner of `core` (`primitives/`, `tokens/`, `theme/`, `icons/`, and
the `Card`/`Toolbar` parts of `layout/`) is still meant to stay domain-free by convention — the
`eslint.config.js` design-token guards are scoped to exempt exactly those paths from raw-value
rules — but this is no longer enforced by `lint:arch`, only by discipline.

Each feature owns its own `api.js`, `controller.js` and hooks, co-located. Nothing is spread across
a central `core/gateway`, `core/controllers`, `hooks/`, `features/` or `components/` directory. (Not
to be confused with the new `src/core/` layer above — that's components, not the old-abandoned
`src/core/entities` layout this doc's intro warns about.)

**Enforced by `npm run lint:arch`** (`eslint.boundaries.config.js`): `shared` ← `core` ←
`products`. Because there is only one product, a `products/*` module may import any other
`products/*` module, plus `core` and `shared` — the boundary that still fails the build is
`core` importing from a product, or `shared` importing from `core` or a product.
`npm run verify` runs `lint:arch` + `lint` + `test` + `build` — that's the gate before merge.

### Placements the import graph decided, against intuition

- **`research`, `outreach`, `people` and `DataTable` all live in `core`,** same as everything else
  that isn't specific to one feature — cross-cutting domain code (outreach messaging state,
  company/profile lookups, table cells that resolve company logos and profile photos) alongside the
  design-system primitives. `LeadDetailSidebar` renders `ResearchPanel` and the outreach summary —
  follow the imports, not the name, when deciding where a new file belongs.
- **A file that wraps a platform-style API client is not a `utils`.** `companyLogo.js` /
  `profilePhoto.js` live in `core/people/`, not `shared/utils/`.

---

## Architecture — Four Layers

Every data flow goes through exactly these layers, top to bottom. Never skip one.

```
Component  →  hook (useX)  →  controller  →  api client  →  apiGateway (axios)
                                                    ↓
                                              entity (wraps response)
```

**Never call the gateway, or even a feature's `api.js`, from a component.** Component → hook →
controller → api → apiGateway. Skipping a layer for one "quick" call is how a token refresh ends up
implemented in four places.

### 1. Entity

A plain JS class (or factory function) that wraps a raw backend response into a stable shape.

```js
// core/people/Profile.js
export class Profile {
  constructor(data = {}) {
    this._id = data._id ?? data.id ?? null;
    this.name = data.name ?? '';
    this.email = data.email ?? '';
    // Always preserve the raw payload for unmapped fields.
    this.raw = data;
  }

  static fromResponse(data) { return new Profile(data); }
  static fromList(list = []) { return list.map(Profile.fromResponse); }
}
```

Rules:
- Use `??` for every field — never `||`, which falses on `0` or `''`.
- `fromResponse` / `fromList` are the only ways to construct an entity outside its own file.
- Keep `this.raw = data` so callers can reach unmapped fields without breaking the contract.
- Entities are class instances, not plain objects — never spread one with `{ ...entity, x }` to
  "patch" it, that silently drops its prototype and every method it defines. Use
  `src/shared/entities/patchEntity.js` instead:
  ```js
  import { patchEntity } from 'src/shared/entities/patchEntity.js';
  const updated = patchEntity(profile, { notes: 'called, follow up Friday' });
  ```

### 2. API client (`api.js`, co-located with its feature)

One file per feature. Calls `apiGateway` (the shared Axios singleton), wraps responses in entities.

```js
// core/people/api.js
import apiGateway from 'src/shared/gateway/apiGateway.js';
import { Profile } from 'src/core/people/Profile.js';

class PeopleApi {
  async getPeople({ limit = 100, skip = 0 } = {}) {
    const response = await apiGateway.get('/people', { params: { limit, skip } });
    const payload = response.data;
    if (payload?.success && payload?.data?.profiles) {
      payload.data.entities = Profile.fromList(payload.data.profiles);
    }
    return payload;
  }
}

export default new PeopleApi();
```

Rules:
- Singleton pattern — `class Xxx { ... }` then `export default new Xxx()`.
- Never import an `api.js` from a component or page. Always go through the feature's controller.
- Only entity-wrapping and request shaping here — no business logic, no branching on feature flags.

### 3. Controller

Orchestrates one or more `api.js` calls, applies business logic, throws human-readable errors.

```js
// core/people/controller.js
import peopleApi from 'src/core/people/api.js';

class CapturedLeadsController {
  async getAllProfiles(options = {}) {
    const res = await peopleApi.getPeople(options);
    if (!res?.success || !res?.data) {
      throw new Error(res?.message || 'Failed to fetch people');
    }
    return {
      profiles: res.data.entities || [],
      pagination: res.data.pagination || { limit: 100, skip: 0, total: 0, pages: 0, hasMore: false },
    };
  }
}

export default new CapturedLeadsController();
```

Rules:
- Singleton pattern, same as `api.js`.
- Throw errors with human-readable messages — hooks catch these and surface them as UI state.
- Return a normalized shape; the hook above it should never need to reshape data further.

### 4. Custom hook

Manages React state around a controller call. Owns `loading`, `error`, and the data itself.

```js
// core/people/useAllProfiles.js
import { useState, useEffect, useCallback, useRef } from 'react';
import capturedLeadsController from 'src/core/people/controller.js';

export function useAllProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastOptionsRef = useRef({ limit: 100, skip: 0 });

  const fetchAllProfiles = useCallback(async (options = {}) => {
    lastOptionsRef.current = options;
    setLoading(true);
    setError(null);
    try {
      const { profiles: list } = await capturedLeadsController.getAllProfiles(options);
      setProfiles(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch profiles');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllProfiles({ limit: 100, skip: 0 }); }, []); // eslint-disable-line

  return { profiles, loading, error, fetchAllProfiles };
}
```

Rules:
- Named export only — `export function useXxx()`, never a default export.
- Reset `error` to `null` at the start of every fetch; reset `loading` in `finally`.
- Track "last used options" in a `useRef` so pagination/filter changes don't lose each other's state.
- Hooks call controllers — never an `api.js` or `apiGateway` directly.

---

## Components

### `core/` vs `products/`

| Directory | Purpose | Examples |
|---|---|---|
| `src/core/primitives/`, `tokens/`, `theme/`, `icons/` | Design-system atoms — meant to stay domain-free by convention, though `lint:arch` no longer enforces it (see the directory-structure note above) | `Button`, `Dialog`, `Tabs`, `Toast` |
| `src/core/**` (everything else) | Cross-product components that DO know the domain (auth, billing, a lead) | `DashboardLayout`, `NotificationBell`, `LeadDetailSidebar` |
| `src/products/<name>/**` | Everything specific to one feature | `sequences/SequenceStepBuilder.jsx` |

A component graduates from a product folder to `core/` the moment more than one feature needs
it — never copy-pasted between feature folders under `products/`.

### File structure per component

```
core/primitives/Button/
├── Button.jsx       # implementation
├── variants.js       # VARIANTS / SIZES constants, if the component has them
└── index.js          # barrel: export { Button } from './Button';
```

Every component folder gets an `index.js` (or `index.jsx`) barrel so consumers import from the
folder, never the file:
```js
import { Button } from 'src/core/primitives/Button';        // ✅
import { Button } from 'src/core/primitives/Button/Button';  // ✗ never
```
`src/core/primitives/index.js` re-exports every primitive from one place — most call sites should
import from there (`import { Button, Dialog } from 'src/core/primitives'`).

### Component rules

- **Named exports only.** Never `export default` a component (marketing is the sole exception —
  it was ported as-is).
- Props use destructuring with inline defaults, never a `defaultProps` object.
- Always accept `className` and append it last so callers can extend styles.
- Spread remaining `...props` onto the root DOM element for aria/data attributes.

```jsx
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) { ... }
```

### Headless-hook pattern for complex components

When a component has non-trivial state logic, extract it into a co-located `useComponentName.js`:

```
core/DataTable/
├── DataTable.jsx       # renders using the hook
├── useDataTable.js     # all selection + sort state
├── parts/              # Header, Body, Row, Cell, Toolbar, Pagination...
│   └── index.js        # barrel for sub-parts
└── index.js
```

The hook is the single source of truth for state; the component just renders.

---

## Pages

A page is the `index.jsx` (or `.js`) at a feature's root, always exporting a named `[Name]Page`.

```jsx
// products/pages/leads/index.jsx
export function HubLeadsPage() {
  const [selectedLead, setSelectedLead] = useState(null);         // 1. local UI state
  const { leads, loading, error, fetchLeads } = useLeadsPage();   // 2. data hooks
  const handleTabChange = (tabId) => { ... };                     // 3. derived values / handlers

  return (                                                        // 4. JSX, wrapped in DashboardLayout
    <DashboardLayout title="Leads">
      ...
    </DashboardLayout>
  );
}
```

The page file IS the feature's public interface here (`products/pages/leads/index.jsx`), so there's
no separate barrel to write — but the rule is the same as anywhere else with an explicit barrel:
what `index.jsx` exports is what other features are allowed to import.

**A feature's public interface is its `index.js`/`index.jsx`.** Don't reach into another feature's
internals (`import { helper } from 'src/products/leads/audience.js'` from outside `products/leads/`
is a smell even where the lint config doesn't catch it structurally).

Co-located files, as needed:
- `columns.jsx` — DataTable column definitions
- `helpers.js` — pure data-transform functions, no JSX, no hooks
- `[ModalName].jsx` — modals only that page uses

---

## Routing

All routes are declared in `src/app/routes.jsx`. `App.jsx` wires providers only — no route logic.

```jsx
<Route path="/dashboard/templates" element={<ProtectedRoute><SubscribeGate><TemplatesPage /></SubscribeGate></ProtectedRoute>} />
<Route path="/hub/leads" element={<ProtectedRoute><SubscribeGate><HubLeadsPage /></SubscribeGate></ProtectedRoute>} />
```

`/dashboard/*` vs `/hub/*` is leftover namespacing from before the leadgen decommission
(2026-09-14) — it no longer marks a product boundary. Every route above gets the same two guards,
`ProtectedRoute` (signed in) then `SubscribeGate` (paid up); there is nothing left to branch on
between the two namespaces.

---

## Imports

Always use **absolute imports** with the `src/` prefix (Vite alias). Relative imports (`../../`)
are allowed only inside `src/marketing/`, ported as-is.

```js
import { Button } from 'src/core/primitives/Button';    // ✅
import { Button } from '../../core/primitives/Button';  // ✗
```

---

## Styling — design tokens are enforced, not just documented

All colour, type scale, radius and spacing come from `src/core/tokens/tokens.css` (`--ui-*` custom
properties). `eslint.config.js` turns every one of these into a **build-breaking lint error**, not
a style guide nobody reads:

| Banned | Use instead |
|---|---|
| Raw hex (`#fff`, `#0e7c7b`) anywhere — className, inline style, or a JS constant | A `--ui-*` token, e.g. `bg-[var(--ui-surface-card)]` |
| Raw Tailwind palette (`bg-gray-100`, `text-blue-500`, ...) | A `--ui-*` token |
| Hardcoded pixel font size (`text-[14px]`) | A type token: `text-[var(--ui-t-body)]` etc. |
| Hardcoded radius (`rounded-[10px]`) | `rounded-[var(--ui-radius-sm)]` etc. |
| `font-bold` / `font-light` / any weight outside the three | `font-normal` / `font-medium` / `font-semibold` only |
| Glass/blur utilities (`backdrop-blur`, `glass-*`) outside `src/marketing/` | Flat surfaces + hairlines — the app chrome doesn't use glass |
| A raw `<button>` | `<Button>` / `<IconButton>` from `src/core/primitives` |

The only sanctioned exception is third-party brand marks (`src/core/icons/**`,
`src/core/auth/icons.jsx`) — a Google "G" or LinkedIn glyph is fixed by someone else, not a
theme decision that failed to become a token.

```jsx
// ✅
<div className="flex items-center gap-3 px-4 py-3 rounded-[var(--ui-radius-md)]"
     style={{ background: 'var(--ui-surface-card)', border: '1px solid var(--ui-border)' }}>

// ✗ — every one of these fails npm run lint
<div className="rounded-[14px] bg-gray-50 text-[14px] font-bold">
```

Run `npm run lint` (general quality + these token rules) and `npm run lint:arch` (the
`shared/ui ← platform ← products` boundary) separately — they're two different gates for a reason,
see the comment at the top of `eslint.boundaries.config.js`.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase `.jsx` | `Button.jsx` |
| Barrel file | lowercase | `index.js` |
| Hook file | camelCase `.js` | `useAllProfiles.js` |
| API client file | lowercase `api.js`, co-located per feature | `core/people/api.js` |
| Controller file | lowercase `controller.js`, co-located per feature | `core/people/controller.js` |
| Entity file | PascalCase `.js` | `Profile.js` |
| Page export | `[Name]Page` | `HubLeadsPage` |
| Hook export | `use[Name]` | `useAllProfiles` |
| Context export | `[Name]Context` + `[Name]Provider` | `SubscriptionContext`, ... |

---

## State Management Rules

1. **Local UI state** (`useState`) — modals open/closed, active tab, selected row.
2. **Server state** — lives in a custom hook; never fetched directly from a component.
3. **Global state** — React Context only, only when truly cross-tree (auth, billing/subscription,
   toasts). No external store.
4. Pagination state lives inside the hook, not the page. The page gets `goToPage` / `setPageSize`.

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Backend origin |
| `VITE_API_BASE` | `/api` | API path prefix |

All env vars are prefixed `VITE_`, accessed via `import.meta.env.VITE_*`.

---

## What NOT to do

- Don't import an `api.js` (or `apiGateway` directly) inside a page or component — go through a
  controller + hook.
- Don't use default exports for components or hooks (marketing excepted).
- Don't use relative imports across folders (marketing excepted).
- Don't add a new global state library — Context + hooks only.
- Don't hardcode a colour, font size, radius or weight outside the sanctioned three — every one is
  a lint error, not a suggestion.
- Don't create a second Axios instance — everything goes through `src/shared/gateway/apiGateway.js`.
- Don't import `core` or `shared` code from a lower layer than it belongs — `core`
  never imports from `products/*`, and `shared` never imports from `core` or `products/*`.
  `npm run lint:arch` fails the build on a violation.
- Don't add `// comments explaining what the code does` — name things clearly instead. Comments are
  reserved for non-obvious WHY reasoning (see almost any file in `core/layout/` for the style).
