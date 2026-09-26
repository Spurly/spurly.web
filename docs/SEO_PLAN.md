# Spurly SEO Plan

> Living doc: update the status boxes as work lands. Owner: Sarthak.
> Started 2026-09-23.

## Goal

Rank getspurly.com at the top of Google, in two stages:

| Target | Example queries | Realistic timeline | What moves it |
|---|---|---|---|
| **Brand** | "spurly", "getspurly", "spurly linkedin" | 1–3 weeks after the technical work is live and submitted to Search Console | Technical SEO (Phases 1–3) + Search Console + a few brand mentions |
| **Category / intent** | "linkedin lead generation tool", "sales navigator scraper", "dripify alternative" | 3–6+ months, compounding | Content + backlinks (Phase 4–5) |

Nobody can guarantee a #1 spot on a generic keyword in a week. The technical phases stop the site
from handicapping itself. Content and links are what earn the category rankings.

## Where we started (audit, 2026-09-23)

- The public site (home, blog, legal, support) lived in `src/marketing/`: a straight copy of the
  old `spurly.website` repo, **excluded from `lint:arch`**, outside the `shared ← core ← products` layout.
- **It was a client-side-rendered SPA.** Every URL shipped the same empty `<div id="root">` and the
  *homepage's* title/description/OG tags from `index.html`. Per-page tags only appeared after JS ran
  (react-helmet-async).
  - Google renders JS, but in a delayed second pass.
  - LinkedIn / X / Slack link previews, Bing (partly) and AI crawlers (GPTBot, ClaudeBot,
    PerplexityBot) mostly **don't run JS**, so every blog post shared on LinkedIn showed the homepage card.
- `spurly.website` had been migrated to Next.js (commit `73d56bb`, SSR-capable), but that was undone
  when the site was folded into spurly.web, so the SEO gain was lost.
- `sitemap.xml` was hand-written (lastmod June). Nothing stopped app routes (`/dashboard`, `/hub`,
  `/admin`) from being indexed.
- Product screenshots are ~550 KB PNGs each (hurts LCP / Core Web Vitals).

## Decisions

| # | Decision | Why |
|---|---|---|
| D1 | One repo (spurly.web) and one Vite build, no Next.js | Keeps one codebase and one deploy. Build-time prerendering gives the SEO benefit without a framework migration. |
| D2 | Public site lives at `src/products/pages/website/`, like every other page folder | Same conventions, and it's covered by the boundary lint. |
| D3 | **Prerender public routes at build time** (static HTML per route), app routes stay CSR | Crawlers and link previews get real HTML with per-page meta. The app is unchanged. |
| D4 | The SPA fallback serves a separate shell (`app.html`), not the prerendered home | Otherwise every `/dashboard/...` deep link would first paint the marketing homepage. |
| D5 | The app shell is `noindex`; app paths are disallowed in robots.txt | Only marketing pages should compete in search. |
| D6 | The sitemap is generated at build from one route list (`seoRoutes.js`) | Prerender, sitemap and routes can't drift apart. |

## Phases

### Phase 1: Structure (no visual change)
- [x] Move `src/marketing/` → `src/products/pages/website/`
- [x] Remove the `src/marketing/**` ignore from `eslint.boundaries.config.js` and fix any violations
- [x] Remove dead code left from the port (check `AuthModal` / `AuthModalContext` usage first)
- [x] One `Seo` component: title, description, canonical, OG, Twitter, JSON-LD per page

### Phase 2: Prerendering (the big one)
- [x] `src/entry-server.jsx`: renders the real App tree for a given URL (StaticRouter)
- [x] `scripts/prerender.mjs`: after `vite build`, renders each public route and writes
      `dist/<route>.html` with the page's own `<head>` tags and body HTML
- [x] `main.jsx` hydrates when the page was prerendered, otherwise renders as before
- [x] `vercel.json`: `cleanUrls`, and the SPA fallback goes to `/app.html`
- [x] The body gets `class="mkt"` in prerendered HTML so styles apply before JS (no unstyled flash)

### Phase 3: Technical basics
- [x] robots.txt: disallow app paths, point to the sitemap
- [x] `noindex` on the app shell
- [x] Generated sitemap.xml
- [ ] Canonical host decided (`www.getspurly.com`) and the apex 301s to it (Vercel domain setting, **manual**)
- [x] Screenshots → WebP, with explicit width/height, lazy below the fold
- [x] Structured data: Organization + SoftwareApplication + FAQ on home, Article + Breadcrumb on posts

### Phase 4: Launch checklist (manual, Sarthak)
- [ ] Deploy, then check "View Source" on `/`, `/blog`, and one post. The real text and the right `<title>` must be in the raw HTML.
- [ ] Google Search Console: verify the domain (DNS TXT), submit `sitemap.xml`, and request indexing for home + blog posts
- [ ] Bing Webmaster Tools: import from GSC (it also feeds ChatGPT search / Copilot)
- [ ] Check with Rich Results Test and the LinkedIn Post Inspector (link previews)
- [ ] PageSpeed Insights on home: LCP < 2.5s on mobile

### Phase 5: Content & authority (ongoing, what actually ranks)
- [ ] Move blog posts to Markdown files (cheap to publish)
- [ ] Comparison pages: Spurly vs Dripify / Waalaxy / Expandi / Linked Helper, "best X alternatives"
- [ ] Use-case pages: recruiters, founders, job seekers, agencies
- [ ] Feature pages: Sales Navigator export, LinkedIn email finder, connection-note personalizer
- [ ] One free tool (e.g. an AI LinkedIn connection-note generator) to earn backlinks
- [ ] Off-site: Chrome Web Store listing copy, Product Hunt, G2 / Capterra, SaaS directories, founder posts on LinkedIn
- [ ] Publishing cadence: 1–2 posts/week, each targeting one query

## How it works now (read before touching the public site)

```
npm run build
  1. vite build                              -> dist/            browser bundle
  2. vite build --ssr src/entry-server.jsx   -> dist-ssr/        same app, for Node
  3. node scripts/prerender.mjs
       - dist/app.html        = SPA shell + noindex (served for every non-public URL)
       - dist/index.html, blog.html, blog/<slug>.html, support/privacy/terms.html
                              = real HTML + that page's own <head>, hydrated in the browser
       - dist/sitemap.xml     = generated from PUBLIC_ROUTES
```

- **Add a public page:** add its `<Route>` in `src/app/routes.jsx`, render `<Seo …/>` in it, and
  add it to `PUBLIC_ROUTES` in `src/products/pages/website/seo.js`. `tests/seo.prerender.test.jsx`
  fails if the route is missing, has no `<h1>`, reuses another page's title, or lacks canonical/description.
- **Add a blog post:** add an entry in `blogPosts.js`, a `pages/blog/<Name>Post.jsx` wrapped in
  `<BlogLayout slug=…>`, and its `<Route>`. The sitemap and prerender pick it up from `blogPosts.js`.
- Public-page code must not touch `window` / `document` / `localStorage` **during render** (effects
  are fine), or the build fails in step 3. That's intended: a failed build is better than a blank page.
- Hydration was verified clean (no console errors) on all 6 page types, and the no-JS view shows full
  content and styles.

### Deploy notes (check these once)
- Vercel **Build Command** must be `npm run build` (or left at the default). If it's overridden to
  `vite build`, the prerender step silently won't run.
- `vercel.json` uses `cleanUrls` (so `/blog` serves `blog.html`), and the catch-all now goes to `/app.html`.
- After deploy: `curl -s https://www.getspurly.com/blog | grep '<title'` should print the *blog*
  title, and `curl -s https://www.getspurly.com/dashboard | grep noindex` should match.

## Measuring
- Search Console: impressions, clicks, average position for "spurly" and each target query (check weekly)
- Indexed pages count vs sitemap count

## Log
- 2026-09-23: Audit done, plan written.
- 2026-09-23: **Phases 1–3 built** (uncommitted on `master`). Moved the site to `products/pages/website`,
  deleted the unused AuthModal (LinkedIn-callback error now goes to `/login` instead of `/?auth=signin`),
  moved `CHROME_URL` to `src/shared/extension/constants.js`, added `<Seo>`, the prerender pipeline, a
  generated sitemap, robots rules and noindex on the app shell. Also added Organization/WebSite/Breadcrumb
  JSON-LD. Images: 3 screenshots 1.7 MB → 175 KB (WebP), and the nav logo 517 KB → 9.5 KB (all pages, app too).
  Tests: 10 new prerender tests pass. The 12 pre-existing hub test failures and 7 pre-existing `lint:arch`
  errors (onboarding pages importing products) are unchanged and not caused by this work.
- **Next:** Sarthak deploys → Phase 4 checklist → start Phase 5 content.
