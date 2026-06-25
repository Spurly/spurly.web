# Spurly Web — Coding Patterns & Conventions

> Reference for developers building new features or companion projects. Follow these patterns exactly so new code is indistinguishable from existing code.

---

## Stack

| Layer | Technology |
|---|---|
| Build | Vite 8 (ESM, `type: "module"`) |
| UI | React 19 |
| Routing | React Router v6 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| HTTP | Axios (wrapped in `ApiGateway`) |
| Icons | Lucide React |
| Node | ≥ 20.19.0 |

No Redux, no Zustand, no React Query. All server state lives in custom hooks.

---

## Directory Structure

```
src/
├── core/                   # Framework-independent business logic
│   ├── entities/           # Data models (plain classes, no React)
│   ├── gateway/            # HTTP clients — one file per API domain
│   ├── controllers/        # Orchestration between hook layer ↔ API layer
│   └── context/            # React Contexts (only truly global state)
│
├── hooks/                  # Custom React hooks — one per data domain
├── pages/                  # Route-level components
│   └── [PageName]/
│       ├── index.jsx       # The page component
│       ├── columns.jsx     # DataTable column definitions (if needed)
│       ├── helpers.jsx     # Pure helpers / data transforms
│       └── [Modal].jsx     # Page-scoped modal components
│
├── common/
│   └── components/         # Reusable design-system components
│       └── [ComponentName]/
│           ├── ComponentName.jsx
│           └── index.js    # Barrel re-export
│
├── components/             # App-level shared components (layout, guards)
├── routes.jsx              # All route declarations in one place
├── App.jsx                 # BrowserRouter + providers only
├── main.jsx                # ReactDOM.createRoot entry
└── index.css               # Design tokens (CSS vars) + Tailwind import
```

---

## Architecture — Four Layers

Every data flow goes through exactly these layers, top to bottom. Never skip a layer.

```
Page / Hook  →  Controller  →  API (gateway file)  →  ApiGateway (axios)
                                     ↓
                               Entity (wraps response)
```

### 1. Entity (`core/entities/`)

A plain JS class that wraps raw backend responses and exposes a stable shape to the UI.

```js
// core/entities/Profile.js
export class Profile {
  constructor(data = {}) {
    this._id   = data._id ?? data.id ?? null;
    this.name  = data.name ?? '';
    this.email = data.email ?? '';
    // Always preserve the raw payload for unmapped fields
    this.raw   = data;
  }

  static fromResponse(data) { return new Profile(data); }
  static fromList(list = []) { return list.map(Profile.fromResponse); }
}
```

Rules:
- Use `??` (nullish coalescing) for every field — never `||` to avoid falsing on `0` or `''`.
- `fromResponse` / `fromList` are the only ways to construct entities outside the entity file.
- Keep `this.raw = data` so callers can reach unmapped fields without breaking the entity contract.

### 2. Gateway (`core/gateway/`)

One file per API domain. Calls `apiGateway` (the shared Axios instance), wraps responses in entities.

```js
// core/gateway/profilesApi.js
import apiGateway from 'src/core/gateway/apiGateway.js';
import { Profile } from 'src/core/entities/Profile.js';

class ProfilesApi {
  async getAllProfiles({ limit = 100, skip = 0 } = {}) {
    const response = await apiGateway.get('/profiles/all', { params: { limit, skip } });
    const payload  = response.data;
    if (payload?.success && payload?.data?.profiles) {
      payload.data.entities = Profile.fromList(payload.data.profiles);
    }
    return payload;
  }
}

export default new ProfilesApi();
```

Rules:
- Singleton pattern — `export default new ProfilesApi()`.
- Never import a gateway file from a component or page. Always go through a controller.
- Only do entity wrapping here, not business logic.

### 3. Controller (`core/controllers/`)

Orchestrates calls to one or more gateway files, applies business logic, throws meaningful errors.

```js
// core/controllers/capturedLeadsController.js
import profilesApi from 'src/core/gateway/profilesApi.js';

class CapturedLeadsController {
  async getAllProfiles({ limit = 100, skip = 0 } = {}) {
    const res = await profilesApi.getAllProfiles({ limit, skip });

    if (!res?.success || !res?.data) {
      throw new Error(res?.message || 'Failed to fetch profiles');
    }

    return {
      profiles:   res.data.entities || [],
      pagination: res.data.pagination || { limit, skip, total: 0, pages: 0, hasMore: false },
    };
  }
}

export default new CapturedLeadsController();
```

Rules:
- Singleton pattern — `export default new CapturedLeadsController()`.
- Throw errors with human-readable messages — hooks catch these and surface them as state.
- Return a normalized shape; the hook above should not need to reshape data.

### 4. Custom Hook (`hooks/`)

Manages React state around a controller. Owns `loading`, `error`, and the data state.

```js
// hooks/useAllProfiles.js
import { useState, useEffect, useCallback, useRef } from 'react';
import capturedLeadsController from 'src/core/controllers/capturedLeadsController.js';

export function useAllProfiles() {
  const [profiles, setProfiles]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [pagination, setPagination] = useState({ limit: 100, skip: 0, total: 0, pages: 0, hasMore: false });

  const lastOptionsRef = useRef({ limit: 100, skip: 0 });

  const fetchAllProfiles = useCallback(async (options = {}) => {
    lastOptionsRef.current = options;
    setLoading(true);
    setError(null);
    try {
      const { profiles: list, pagination: pag } = await capturedLeadsController.getAllProfiles(options);
      setProfiles(list);
      setPagination(pag);
    } catch (err) {
      setError(err.message || 'Failed to fetch profiles');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllProfiles({ limit: 100, skip: 0 }); }, []); // eslint-disable-line

  return { profiles, loading, error, pagination, fetchAllProfiles };
}
```

Rules:
- Always export named functions — `export function useXxx()`, never default export.
- Always reset `error` to `null` at the start of each fetch and `loading` in `finally`.
- Use `useRef` to track "last used options" so pagination / filter changes don't lose each other's state.
- Hooks call controllers — never gateways directly.

---

## Components

### Common vs App-level

| Directory | Purpose | Examples |
|---|---|---|
| `src/common/components/` | Design-system primitives — fully reusable, no app-specific imports | `Button`, `Badge`, `DataTable`, `MetricCard` |
| `src/components/` | App-level shared — knows about routing, auth, layout | `DashboardLayout`, `ProtectedRoute`, `LeadDetailSidebar` |

### File structure per component

```
common/components/Button/
├── Button.jsx      # The component implementation
└── index.js        # Barrel: export { Button } from './Button';
```

Every component folder gets an `index.js` barrel so consumers import from the folder:
```js
import { Button } from 'src/common/components/Button';  // ✅
import { Button } from 'src/common/components/Button/Button';  // ✗ never
```

### Component rules

- **Named exports only.** Never `export default` a component.
- Props use destructuring with defaults inline, never a `defaultProps` object.
- Always accept a `className` prop and append it last so callers can extend styles.
- Spread remaining `...props` onto the root DOM element for aria/data attrs.

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

### Headless hook pattern for complex components

When a component has non-trivial state logic, extract it into a co-located `useComponentName.js`:

```
DataTable/
├── DataTable.jsx       # Renders using the hook
├── useDataTable.js     # All selection + sort state
├── TableToolbar.jsx
├── TablePagination.jsx
├── index.js
└── components/         # Sub-components (Header, Body, Row, Cell...)
    └── index.js        # Barrel for all sub-components
```

The hook is the single source of truth for state; the component just renders.

---

## Pages

Each page lives in `src/pages/[PageName]/index.jsx`.

```jsx
// pages/CapturedLeads/index.jsx
export function CapturedLeadsPage() {
  // 1. Local UI state
  const [selectedLead, setSelectedLead] = useState(null);

  // 2. Data hooks
  const { profiles, loading, error, pagination, fetchAllProfiles } = useAllProfiles();

  // 3. Derived values / handlers
  const handleTabChange = (tabId) => { ... };

  // 4. JSX — always wrapped in DashboardLayout
  return (
    <DashboardLayout>
      ...
    </DashboardLayout>
  );
}
```

Co-located files:
- `columns.jsx` — DataTable column definitions for this page
- `helpers.jsx` — pure data-transform functions (no JSX, no hooks)
- `[ModalName].jsx` — modals only used by this page

---

## Routing

All routes are declared once in `src/routes.jsx`. Protected routes wrap their page in `<ProtectedRoute>`.

```jsx
<Route path="/dashboard/leads" element={<ProtectedRoute><CapturedLeadsPage /></ProtectedRoute>} />
```

`App.jsx` only wires providers — no route logic lives there.

---

## Imports

Always use **absolute imports** with the `src/` prefix. Never use relative imports unless you are within the same immediate folder.

```js
import { Button } from 'src/common/components/Button';    // ✅
import { Button } from '../../common/components/Button';  // ✗
```

This is configured via Vite's `resolve.alias`. When adding a new top-level folder, update `vite.config.js` accordingly.

---

## Styling

### Design tokens — always use CSS variables

All colors, surfaces, shadows, and radii are defined as CSS custom properties in `src/index.css`. Never hardcode hex values in component files.

```jsx
// ✅ — uses design token
<div style={{ background: 'var(--surface-card)', color: 'var(--text-primary)' }}>

// ✗ — hardcoded
<div style={{ background: '#ffffff', color: '#1c1c1f' }}>
```

Key token groups:

| Group | Examples |
|---|---|
| Text | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-disabled` |
| Surfaces | `--surface-card`, `--surface-sunken`, `--surface-hover` |
| Brand | `--brand-purple`, `--brand-blue`, `--brand-gradient` |
| Semantic | `--green`, `--green-tint`, `--amber`, `--amber-tint`, `--red`, `--red-tint` |
| Glass | `--glass-thin`, `--glass-regular`, `--glass-chrome`, `--glass-inner-glow` |
| Borders | `--border-hairline`, `--border-glass`, `--separator` |
| Shadows | `--shadow-sm`, `--shadow-glass`, `--shadow-accent` |
| Accent | `--accent`, `--accent-hover`, `--accent-tint`, `--focus-ring` |

### Tailwind + CSS variables together

Use Tailwind utility classes for layout and spacing; use CSS variables inside `style` props or `bg-[var(--...)]` bracket syntax for design-token colors.

```jsx
<div className="flex items-center gap-3 px-4 py-3 rounded-[14px]"
     style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}>
```

### Border radius

Prefer explicit pixel values that match the design system scale: `rounded-[10px]`, `rounded-[12px]`, `rounded-[14px]`, `rounded-[18px]`, `rounded-[999px]` (pill).

### Typography scale

| Role | Class |
|---|---|
| Page title | `text-[20px] font-bold tracking-[-0.018em]` |
| Section heading | `text-[15px] font-semibold tracking-[-0.01em]` |
| Body | `text-[14px]` |
| Caption / label | `text-[13px]` |
| Micro / badge | `text-[12px]` |
| Metric number | `text-[36px] font-bold tracking-[-0.02em] tabular-nums` |

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase `.jsx` | `Button.jsx` |
| Barrel file | lowercase | `index.js` |
| Hook file | camelCase `.js` | `useAllProfiles.js` |
| Gateway file | camelCase `Api.js` | `profilesApi.js` |
| Controller file | camelCase `Controller.js` | `capturedLeadsController.js` |
| Entity file | PascalCase `.js` | `Profile.js` |
| Page folder | PascalCase | `CapturedLeads/` |
| Column definitions | `columns.jsx` | co-located with the page |
| Page component export | `[Name]Page` | `CapturedLeadsPage` |
| Hook export | `use[Name]` | `useAllProfiles` |
| Context export | `[Name]Context` + `[Name]Provider` | `AuthContext`, `AuthProvider` |

---

## State Management Rules

1. **Local UI state** (`useState`) — modals open/closed, active tabs, selected rows.
2. **Server state** — lives in a custom hook; never fetched directly from a component.
3. **Global state** — only via React Context, only when truly cross-tree (e.g. auth). No external store.
4. Pagination state lives inside the hook, not in the page. The page gets `goToPage`, `setPageSize` callbacks.

---

## Context Pattern

```jsx
// core/context/AuthContext.jsx
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // ...
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

```js
// hooks/useAuth.js — always consume via a named hook, never useContext directly in components
import { useContext } from 'react';
import { AuthContext } from 'src/core/context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

---

## ApiGateway

`src/core/gateway/apiGateway.js` is a singleton Axios instance. It handles:
- Base URL from `VITE_API_URL` / `VITE_API_BASE` env vars
- JWT injection via request interceptor (`localStorage.getItem('authToken')`)
- 401 → redirect to `/login` (with loop guard)
- Network errors normalized to `{ status: 0, message: '...' }`

Never create a second Axios instance. All HTTP goes through `apiGateway`.

---

## DataTable Column Definition

Columns are defined as an array of objects, co-located with the page in `columns.jsx`.

```jsx
export const columns = [
  {
    key:       'name',           // maps to row[key]; also used as sort key
    label:     'Name',           // header text; can be a ReactNode
    width:     '180px',          // preferred column width
    minWidth:  '160px',
    sortable:  true,
    align:     'left',           // 'left' | 'center' | 'right'
    render:    (value, row) => <AvatarNameCell value={value} row={row} />,
    headerClassName: '',
    cellClassName:   '',
  },
];
```

Use the typed cell components from `src/common/components/DataTable/components` for consistent rendering: `TextCell`, `EmailCell`, `PhoneCell`, `SkillsCell`, `AvatarNameCell`, `CompanyCell`, `LinkedInCell`.

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Backend origin |
| `VITE_API_BASE` | `/api` | API path prefix |

All env vars are prefixed `VITE_` and accessed via `import.meta.env.VITE_*`.

---

## What NOT to do

- Do not import a gateway or API file inside a page or component — always go through a controller + hook.
- Do not use default exports for components or hooks.
- Do not use relative imports across folders.
- Do not add a new global state library — use Context + hooks.
- Do not hardcode colors — every color must come from a CSS variable.
- Do not create a second Axios instance — use `apiGateway`.
- Do not add `// comments explaining what the code does` — name things clearly instead. Comments are reserved for non-obvious WHY reasoning.
