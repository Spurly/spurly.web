# Spurly — Merging `spurly.website` into `spurly.web`

**Goal:** Fold the live marketing site (`spurly.website`, on getspurly.com) into the dashboard repo (`spurly.web`) so there is **one repo, one deploy, one domain** — while keeping spurly.web's coding patterns and not breaking the live site.

**Decisions locked in (from planning):**

1. **Styling** — Keep marketing's `style.css` as-is, but **scope it** so it can never collide with the dashboard's Tailwind. No visual rewrite of the live site.
2. **Routing** — **One domain, path-split.** `getspurly.com/` serves marketing; dashboard moves under `/dashboard`; `/login` for auth.
3. **Conventions** — **Contain now, convert later.** Marketing lands as a self-contained `src/marketing/` module that keeps working as-is; only the route wiring follows spurly.web patterns. Refactor to named exports / absolute imports incrementally afterward.
4. **Host repo** — `spurly.web` is the host (bigger, stricter architecture, the pattern we keep).

---

## 1. Current state (verified from the code)

| | `spurly.website` (marketing, LIVE) | `spurly.web` (dashboard, host) |
|---|---|---|
| React | 18.2 | **19.2** |
| Vite | 4.5 | **8.0** |
| Router | react-router-dom 6.26 | react-router-dom 6.28 |
| Styling | **Plain CSS** — `src/style.css` (701 lines, self-contained tokens) | **Tailwind v4** + CSS custom properties in `src/index.css` |
| Exports | default exports | **named exports only** |
| Imports | relative (`../`) | **absolute** (`src/...` via Vite alias) |
| SEO | `react-helmet-async` + `robots.txt` + `sitemap.xml` + structured data | none |
| Extra deps | `react-helmet-async` | `axios`, `lucide-react` |
| Routes | `/`, `/privacy`, `/terms`, `/support`, `/blog`, `/blog/*` | `/login`, `/dashboard/*`, `/` → redirect to `/dashboard` |
| Deploy | Vercel + `vercel.json` SPA rewrite | **no `vercel.json` yet** |
| Node | (unpinned) | `.nvmrc` 22.22.2, `engines >=20.19` |

**The lucky break:** both already use the **identical design-token set** (same `--gray-*`, `--purple`, `--blue`, `--grad`, glass values). The marketing tokens are a subset of the dashboard's, so scoping is safe and there's no palette drift.

**Marketing source inventory (what moves):**

- `src/App.jsx` (home page composition) + 24 components in `src/components/`
- `src/pages/`: `Privacy`, `Terms`, `Support`, `BlogIndex`, `blog/{FoundersPost,PersonalizePost,RecruitersPost}`
- `src/hooks/`: `useScrollReveal.js`, `useMagnetic.js`
- `src/`: `blogPosts.js`, `icons.jsx`, `sound.js`, `structuredData.js`, `style.css`
- `public/`: `assets/` (6 images), `Spurly icon copy.png`, `robots.txt`, `sitemap.xml`
- `index.html` SEO `<head>` (meta, OG, Twitter, fonts, `data-palette`)

---

## 2. Target structure inside `spurly.web`

```
src/
├── marketing/                  # NEW — self-contained, ported as-is
│   ├── MarketingHome.jsx       # was website/src/App.jsx
│   ├── components/             # all 24 marketing components
│   ├── pages/                  # Privacy, Terms, Support, BlogIndex, blog/*
│   ├── hooks/                  # useScrollReveal, useMagnetic
│   ├── data/                   # blogPosts.js, structuredData.js
│   ├── lib/                    # sound.js, icons.jsx
│   └── marketing.css           # was style.css — SCOPED (see §4)
│
├── core/ hooks/ common/ components/ pages/   # UNCHANGED dashboard code
├── routes.jsx                  # EDITED — adds public marketing routes
├── App.jsx                     # EDITED — Helmet provider wraps tree
├── main.jsx                    # unchanged
└── index.css                   # unchanged (dashboard tokens/Tailwind)
```

Marketing keeps its internal relative imports for now (decision #3). Only `routes.jsx` and `App.jsx` are edited to spurly.web's standard.

---

## 3. Conflict matrix & resolutions

| # | Conflict | Resolution |
|---|---|---|
| C1 | React 18 → 19 | Marketing components are plain function components; they run on 19 unchanged. **Only real risk: `react-helmet-async`** (see C2). |
| C2 | SEO via `react-helmet-async` on React 19 | React 19 hoists `<title>`/`<meta>`/`<link>`/`<script>` natively from anywhere in the tree. **Plan: keep `react-helmet-async` first** (it works on 19 with a peer-dep override) to minimize change; convert to native React 19 metadata in the later refactor pass. Pin with an npm `overrides` entry if install warns. |
| C3 | Plain CSS vs Tailwind | Scope marketing CSS under a `.mkt` root class so its global selectors (`.nav`, `.brand`, `body{}`, etc.) never leak into the dashboard, and Tailwind's reset never restyles marketing. (§4) |
| C4 | `body` styling — marketing sets `body{background,overflow}` + `data-palette` | Move body-level rules to the `.mkt` wrapper / a route-scoped effect. Don't let marketing mutate global `body` permanently. |
| C5 | default vs named exports | Allowed inside `src/marketing/` for now. New wiring (`routes.jsx`) uses named exports per pattern. |
| C6 | relative vs absolute imports | Allowed inside `src/marketing/` for now. Documented as tech-debt for the convert-later pass. |
| C7 | `/` redirects to `/dashboard` | Change: `/` → `MarketingHome`. Dashboard root becomes `/dashboard`. Update any internal links / post-login redirect target. |
| C8 | apiGateway 401 → `window.location.href='/login'` | Marketing pages make **no** authed calls, so no bounce in practice. Harden anyway: the 401 guard should only fire on `/dashboard*` paths (one-line guard tweak) so a stray call can never yank a marketing visitor to login. |
| C9 | Asset path collisions in `public/` | Marketing references `/assets/*`, `/Spurly icon copy.png`. web's `public/` has `Spurly icon.png`, `vite.svg`. No name clash, but **verify** every marketing `/...` reference resolves after the merge. |
| C10 | No `vercel.json` in web | Add one with SPA fallback **plus** preserve `robots.txt`/`sitemap.xml` as static. (§7) |
| C11 | `index.html` head (SEO/fonts/favicon) | Merge marketing's `<head>` (meta, OG, Twitter, Inter font, favicon) into web's `index.html`. Title/description stay marketing-focused for `/`; per-route overrides via Helmet. |
| C12 | Env / Node | web's `.env` already has the needed vars. Keep `.nvmrc` 22.22.2. Marketing has no env needs. |
| C13 | `react-router` version mismatch | Both v6; align on web's 6.28. No API differences used. |

---

## 4. Styling scoping — the exact technique

Marketing's `style.css` has global selectors (`body{}`, `.nav`, `.hero`, etc.) and re-declares `:root` tokens. To contain it:

1. Rename to `src/marketing/marketing.css`.
2. Wrap every marketing route's output in a single root element: `<div className="mkt"> … </div>`.
3. Prefix the stylesheet's selectors so they only apply inside `.mkt`. Two safe options:
   - **Preferred (mechanical, low-risk):** run the file through a scoping step — wrap all rules in `.mkt { … }` is not valid CSS for top-level rules, so instead prefix each selector with `.mkt ` (e.g. `.nav` → `.mkt .nav`, `body` → `.mkt`, `:root` → `.mkt`). This is a deterministic find/transform, reviewable in the diff.
   - **Alternative:** load `marketing.css` only on marketing routes via dynamic import in a `MarketingLayout`, and rely on distinct class names. Lower effort but weaker isolation — not recommended given Tailwind's global preflight.
4. Keep `:root` design tokens **also** defined at `:root` (they're identical to the dashboard's, so no harm) — only the *layout/component* selectors need `.mkt` scoping. This avoids breaking `var(--…)` lookups.
5. Tailwind preflight: confirm marketing visuals don't depend on default UA styles that preflight resets (lists, headings). Spot-check after merge; the marketing CSS already sets most of these explicitly.

**Verification:** load `/dashboard` and `/` side by side — neither should shift. Diff screenshots against current production (see §8).

---

## 5. Phase-by-phase execution

Each phase is atomic, independently testable, and committed separately. **Nothing touches production until Phase 8 passes.**

### Phase 0 — Safety net (do first, no code changes)
- Create branch `feat/merge-marketing` off `spurly.web` main. All work happens here.
- Confirm `spurly.website` repo + its current Vercel deployment stay **untouched** — that's the rollback.
- Tag/record the current production commit of `spurly.website`.
- Capture **baseline screenshots** of every live marketing page (`/`, `/pricing` section, `/privacy`, `/terms`, `/support`, `/blog`, each blog post) at desktop + mobile widths. These are the visual-regression reference.
- Note current production behaviors to preserve: SEO meta per page, sitemap URLs, sound onboarding, scroll/magnetic effects.

### Phase 1 — Tooling & dependencies reconcile
- Add to `spurly.web/package.json`: `react-helmet-async` (matched to a React-19-compatible version; add npm `overrides` if peer warning).
- `npm install`; confirm clean install on Node 22.22.2.
- Build the untouched dashboard (`npm run build`) to confirm baseline green before adding marketing.
- **Gate:** dashboard builds and runs exactly as before.

### Phase 2 — Port marketing as a contained module
- Copy marketing source into `src/marketing/` per the §2 layout (rename `App.jsx` → `MarketingHome.jsx`).
- Fix only the imports that broke due to the move (internal relative paths stay relative; just re-root them within `src/marketing/`).
- Do **not** wire routes yet. Temporarily render `MarketingHome` at a throwaway path (e.g. `/__mkt`) to smoke-test it renders.
- **Gate:** `/__mkt` renders the home page; console clean.

### Phase 3 — Scope the styles (§4)
- Add `marketing.css`, apply `.mkt` scoping transform, wrap marketing output in `.mkt`.
- Verify dashboard pages are visually unchanged AND `/__mkt` looks identical to the live home.
- **Gate:** both surfaces pixel-match their baselines.

### Phase 4 — Merge routing
- Edit `src/routes.jsx`:
  - Public routes (no `ProtectedRoute`): `/` → `MarketingHome`, plus `/privacy`, `/terms`, `/support`, `/blog`, `/blog/:slug` (or the 3 explicit blog paths).
  - Move dashboard home to `/dashboard` (already there); **remove** the `/` → `/dashboard` redirect.
  - Decide the catch-all `*`: marketing 404 page vs redirect. Keep it serving a public page, not the dashboard.
- Add a `ScrollToTop` on route change (marketing relied on this) — port from website's `main.jsx`.
- Post-login redirect target → `/dashboard` (confirm `AuthContext`/`Login` uses that).
- Wrap the app in `HelmetProvider` in `App.jsx` (above `AuthProvider`).
- **Gate:** every marketing URL and every dashboard URL resolves correctly; auth flow still works; logged-out user hitting `/dashboard` still redirects to `/login`.

### Phase 5 — SEO & metadata
- Merge marketing's `<head>` into web's `index.html` (meta description, OG, Twitter, Inter font preconnect+link, favicon, `data-palette="violet"`).
- Confirm per-page Helmet tags (canonical, structured data) render on marketing routes.
- Harden apiGateway 401 guard (C8): only redirect when path starts with `/dashboard`.
- **Gate:** view-source / inspected `<head>` on `/` matches today's production meta; blog/legal pages keep their canonicals.

### Phase 6 — Public assets & SEO files
- Copy `public/assets/*`, `Spurly icon copy.png`, `robots.txt`, `sitemap.xml` into `spurly.web/public/`.
- Update `sitemap.xml` if any path changed (paths stay the same under path-split, so likely no change — **verify**).
- Grep marketing code for every `"/..."` asset reference; confirm each file exists in the merged `public/`.
- **Gate:** no 404s in network tab on any marketing page; favicon + OG image load.

### Phase 7 — Deployment config
- Add `spurly.web/vercel.json` with SPA fallback rewrite (mirror website's: rewrite everything except real files/`assets` to `/index.html`), ensuring `robots.txt` and `sitemap.xml` are still served as static files (the website rewrite already excludes paths containing a `.`).
- Confirm env vars in the Vercel project for the merged app (`VITE_API_URL`, `VITE_API_BASE`, `VITE_LINKEDIN_CLIENT_ID`).
- Deploy to a **Vercel preview URL** (not production domain).
- **Gate:** full preview deploy is green.

### Phase 8 — Verification / QA (the "110%" gate)
Run the full checklist in §8 against the preview deploy. Do not proceed until every item passes.

### Phase 9 — Cutover & rollback
- Point `getspurly.com` (+ `www`) DNS / Vercel domain at the merged `spurly.web` project.
- Watch: marketing pages, then log in and exercise the dashboard, in production.
- **Rollback:** the old `spurly.website` Vercel project is still deployed and untouched — re-point the domain back to it. Instant revert, zero data risk. Keep it parked for at least 1–2 weeks before retiring.

---

## 6. Verification checklist (Phase 8)

**Marketing parity (vs baseline screenshots):**
- [ ] `/` home — hero, logo cloud, product showcase, how-it-works, audiences, webcam, live demo, pricing, final CTA, footer all render identically (desktop + mobile).
- [ ] Scroll-reveal and magnetic-button effects work.
- [ ] Sound onboarding / sound toggle behave as before.
- [ ] Mobile menu opens/closes; body scroll lock works and **releases** on navigation.
- [ ] `/privacy`, `/terms`, `/support` render.
- [ ] `/blog` index + all 3 blog posts render.
- [ ] All "Start free" / Chrome-store CTAs point to correct URLs.

**Dashboard parity:**
- [ ] `/login` works; login → `/dashboard`.
- [ ] `/dashboard`, `/dashboard/leads`, `/dashboard/leads/:id`, `/dashboard/signals`, `/dashboard/settings` all load.
- [ ] Logged-out access to any `/dashboard*` → `/login`.
- [ ] DataTable, modals, API calls function; no Tailwind regressions.

**Cross-cutting:**
- [ ] No CSS bleed: marketing styles absent on dashboard; Tailwind preflight absent on marketing.
- [ ] `<head>` on `/` matches production meta (description, OG image, canonical, fonts, favicon).
- [ ] `robots.txt` and `sitemap.xml` served at root; sitemap URLs valid.
- [ ] No console errors / no 404 assets on any route.
- [ ] `npm run build` clean; bundle size sane (marketing + dashboard).
- [ ] Lighthouse SEO on `/` ≥ current production score.
- [ ] 401 guard doesn't bounce marketing visitors.

**Recommended:** run a visual-diff (screenshot compare) of every marketing route preview-vs-production before cutover.

---

## 7. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CSS bleed between Tailwind & marketing | Med | High | `.mkt` scoping (§4) + side-by-side visual check |
| `react-helmet-async` peer issue on React 19 | Med | Med | npm `overrides`; fallback to React 19 native metadata |
| `/` redirect change breaks deep links / post-login | Low | High | Explicit route audit in Phase 4; test auth redirect |
| Asset 404s after public/ merge | Med | Med | Grep all `/...` refs; network-tab sweep (Phase 6) |
| SEO regression (lost meta/sitemap) | Low | High | Merge head carefully; compare view-source; Lighthouse |
| Production outage at cutover | Low | High | Old site parked as instant DNS rollback (Phase 9) |
| Body-level style/`data-palette` side effects | Med | Low | Scope to `.mkt`; route-scoped effects (C4) |

---

## 8. Effort & sequencing notes

- Phases 0–7 are a few focused sessions; the bulk of effort is Phase 3 (scoping) and Phase 8 (QA), not the file moves.
- The "convert-later" refactor (named exports, absolute imports, splitting marketing into web's 4-layer where it makes sense, swapping Helmet for native React 19 metadata) is a **separate follow-up** tracked as tech-debt — it does not block launch and should not be bundled into the merge to keep the diff reviewable.
- Keep each phase a separate commit/PR so any regression bisects to one change.

---

## 9. Open items to confirm before Phase 4
- Exact post-login redirect target and any hardcoded `/` links inside the dashboard.
- Whether the catch-all `*` should be a marketing 404 or redirect to `/`.
- Final Vercel project strategy: reuse the existing `spurly.web` Vercel project and attach `getspurly.com`, or create fresh — either works; reusing keeps env vars in place.
