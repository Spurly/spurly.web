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

For the cross-repo rule (`shared ← platform ← products`) and its rationale, see `ARCHITECTURE.md`.
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
│                            # AdminRoute, SubscribeGate, HubGate
├── shared/                  # domain-free: gateway/apiGateway, utils, entities
│   ├── gateway/apiGateway.js
│   ├── entities/
│   └── utils/
├── ui/                      # design system — no domain knowledge
│   ├── primitives/          # Button, Input, Dialog, Tabs, Toast, ...
│   ├── layout/               # Card, Toolbar
│   ├── tokens/               # tokens.css — the ONLY place colour/type/radius live
│   ├── theme/                 # ThemeProvider, ThemeToggle
│   ├── hooks/                 # useFocusTrap, useOverlayStack, useScrollLock
│   └── icons/
├── platform/                # spans every product — knows the domain, not a specific product
│   ├── auth/  billing/  people/  outreach/  research/  notifications/  admin/
│   ├── layout/               # DashboardLayout, ProductSwitcher (needs auth → not ui)
│   ├── extension/            # useExtension
│   └── DataTable/            # cells resolve company logos + profile photos → not ui
├── products/
│   ├── leadgen/              # campaigns/ connections/ import/ templates/
│   │   ├── personalization/  settings/
│   │   └── people/           # the leadgen VIEW of the shared lead book (platform/people)
│   └── hub/                  # leads/ campaigns/ sequences/ inbox/ settings/ upgrade/
│                              # fully isolated from leadgen — see boundary rule below
└── marketing/                # unchanged, self-contained, ported as-is (own conventions)
```

Each feature owns its own `api.js`, `controller.js` and hooks, co-located. Nothing is spread across
a central `core/gateway`, `core/controllers`, `hooks/`, `features/` or `components/` directory.

**Enforced by `npm run lint:arch`** (`eslint.boundaries.config.js`): `shared`/`ui` ← `platform` ←
`products`. A product may import its own subtree, `platform`, `shared`, and `ui` — never another
product. `platform/hub` importing `platform/leadgen`, or the reverse, fails the build, not just
review. `npm run verify` runs `lint:arch` + `lint` + `test` + `build` — that's the gate before merge.

### Placements the import graph decided, against intuition

- **`research`, `outreach` and `people` are `platform`,** even though a feature is
  leadgen-flavoured in name. `LeadDetailSidebar` renders `ResearchPanel` and the outreach
  summary, and hub renders the same People data — so the *data* layer (api, controller,
  columns, cells, filters, detail sidebar) lives in `platform/people/`, while the leadgen-only
  *page* (with its create-campaign bulk action) lives in `products/leadgen/people/`. Follow the
  imports, not the name, when deciding where a new file belongs.
- **`DataTable` is `platform`, not `ui`.** Its cells resolve company logos and profile
  photos — a design-system primitive doesn't know what a company is.
- **A file that wraps a platform API client is not a `utils`.** `companyLogo.js` /
  `profilePhoto.js` live in `platform/people/`, not `shared/utils/`.

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
// platform/people/Profile.js
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
// platform/people/api.js
import apiGateway from 'src/shared/gateway/apiGateway.js';
import { Profile } from 'src/platform/people/Profile.js';

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
// platform/people/controller.js
import peopleApi from 'src/platform/people/api.js';

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
// platform/people/useAllProfiles.js
import { useState, useEffect, useCallback, useRef } from 'react';
import capturedLeadsController from 'src/platform/people/controller.js';

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

### `ui/` vs `platform/` vs `products/`

| Directory | Purpose | Examples |
|---|---|---|
| `src/ui/primitives/` | Design-system atoms — zero domain knowledge, zero API imports | `Button`, `Dialog`, `Tabs`, `Toast` |
| `src/platform/**` | Cross-product components that DO know the domain (auth, billing, a lead) | `DashboardLayout`, `NotificationBell`, `LeadDetailSidebar` |
| `src/products/<name>/**` | Everything specific to one product | `hub/sequences/SequenceStepBuilder.jsx` |

A component graduates from a product folder to `platform/` the moment a second product needs it —
never copy-pasted between `products/leadgen/` and `products/hub/`.

### File structure per component

```
ui/primitives/Button/
├── Button.jsx       # implementation
├── variants.js       # VARIANTS / SIZES constants, if the component has them
└── index.js          # barrel: export { Button } from './Button';
```

Every component folder gets an `index.js` (or `index.jsx`) barrel so consumers import from the
folder, never the file:
```js
import { Button } from 'src/ui/primitives/Button';        // ✅
import { Button } from 'src/ui/primitives/Button/Button';  // ✗ never
```
`src/ui/primitives/index.js` re-exports every primitive from one place — most call sites should
import from there (`import { Button, Dialog } from 'src/ui/primitives'`).

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
platform/DataTable/
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
// products/leadgen/people/PeoplePage.jsx
export function PeoplePage() {
  const [selectedLead, setSelectedLead] = useState(null);         // 1. local UI state
  const { profiles, loading, error, fetchAllProfiles } = useAllProfiles(); // 2. data hooks
  const handleTabChange = (tabId) => { ... };                     // 3. derived values / handlers

  return (                                                        // 4. JSX, wrapped in DashboardLayout
    <DashboardLayout title="People">
      ...
    </DashboardLayout>
  );
}
```

```js
// products/leadgen/people/index.js — a feature's PUBLIC interface
export { PeoplePage } from './PeoplePage.jsx';
```

**A feature's public interface is its `index.js`/`index.jsx`.** Don't reach into another feature's
internals (`import { helper } from 'src/products/hub/leads/audience.js'` from outside `hub/leads/`
is a smell even where the lint config doesn't catch it structurally).

Co-located files, as needed:
- `columns.jsx` — DataTable column definitions
- `helpers.js` — pure data-transform functions, no JSX, no hooks
- `[ModalName].jsx` — modals only that page uses

---

## Routing

All routes are declared in `src/app/routes.jsx`. `App.jsx` wires providers only — no route logic.

```jsx
<Route path="/dashboard/people" element={<ProtectedRoute><PeoplePage /></ProtectedRoute>} />
<Route path="/hub/leads" element={<ProtectedRoute><HubGate><LeadsPage /></HubGate></ProtectedRoute>} />
```

Route namespaces are the actual product boundary at runtime: `/dashboard/*` is leadgen, `/hub/*` is
hub. `HubGate` and the backend's own 403 are what actually enforce entitlement — anything in the
sidebar is a courtesy on top, never the boundary itself.

---

## Imports

Always use **absolute imports** with the `src/` prefix (Vite alias). Relative imports (`../../`)
are allowed only inside `src/marketing/`, ported as-is.

```js
import { Button } from 'src/ui/primitives/Button';    // ✅
import { Button } from '../../ui/primitives/Button';  // ✗
```

---

## Styling — design tokens are enforced, not just documented

All colour, type scale, radius and spacing come from `src/ui/tokens/tokens.css` (`--ui-*` custom
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
| A raw `<button>` | `<Button>` / `<IconButton>` from `src/ui/primitives` |

The only sanctioned exception is third-party brand marks (`src/ui/icons/**`,
`src/platform/auth/icons.jsx`) — a Google "G" or LinkedIn glyph is fixed by someone else, not a
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
| API client file | lowercase `api.js`, co-located per feature | `platform/people/api.js` |
| Controller file | lowercase `controller.js`, co-located per feature | `platform/people/controller.js` |
| Entity file | PascalCase `.js` | `Profile.js` |
| Page export | `[Name]Page` | `PeoplePage` |
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
- Don't import across `src/products/*` — a product may use `shared`, `ui`, `platform`, and its own
  subtree only. `npm run lint:arch` fails the build on a violation.
- Don't add `// comments explaining what the code does` — name things clearly instead. Comments are
  reserved for non-obvious WHY reasoning (see almost any file in `platform/layout/` for the style).
