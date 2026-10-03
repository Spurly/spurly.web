# Spurly SEO + GEO Master Plan

> **Start here.** This is the entry point for all search work on getspurly.com.
> Strategy is decided here (Opus). Tasks in section 7 are written to be executed one at a time (Sonnet).
> Results are logged in section 9 and the plan is adjusted using the rules in section 8.
>
> Companion docs (detail, not strategy):
> - `docs/SEO_CONTENT_PLAN.md`: **positioning, verified feature list, new site map and page outlines. Sonnet writes all public copy from it** (2026-10-02)
> - `docs/SEO_PLAN.md`: how the prerender pipeline works + the original technical checklist
> - `docs/SEO_GROWTH_PLAN.md`: full page inventory (every URL we plan to build) + content clusters
>
> **Live tracker (status of every task, metrics log, decisions):** https://claude.ai/artifact/BGcxLqCHGa6aBHTDJBe8v3 — after finishing a task, mark it done there (ArtifactData, collection `tasks`, doc id = task id lowercased with `.`→`-`, e.g. `t1-3`); after each weekly check, add a row to collection `log`.
> Owner: Sarthak · Written 2026-10-02 · Review: weekly (15 min) + monthly (1 hr)

---

## 1. The goal, made concrete

"Rank at the top for anything LinkedIn-related" is turned into three targets we can measure:

| Tier | Example queries | Realistic | Status |
|---|---|---|---|
| **1. Brand** | spurly, getspurly, spurly linkedin, spurly chrome extension | #1 within 2–4 weeks of indexing | Pages are live; need Search Console data to confirm |
| **2. Buyer intent** | dripify alternative, spurly vs waalaxy, linkedin lead capture extension, linkedin outreach tool for founders | Page 1 in 1–4 months per page | Not started; pages don't exist yet |
| **3. Problem / how-to** | linkedin connection request message examples, linkedin weekly invite limit, how to export sales navigator leads | Page 1 in 3–9 months | 3 blog posts exist |
| **4. AI answers (GEO)** | "best LinkedIn outreach tool for recruiters" asked in ChatGPT / Perplexity / Gemini / Google AI Overviews | Months; depends on off-site mentions | Not started |

**We will never rank for "LinkedIn" itself**; linkedin.com owns that. Nobody can. The real win is owning hundreds of
long-tail queries where someone wants to *find, contact, or track people on LinkedIn* or *compare tools like ours*.
Together these bring more traffic than one head term would, and they convert far better.

---

## 2. Is React (Vite) OK for ranking? **Yes. Keep it.**

Google ranks the **HTML it receives, the content, links and speed**, not the framework. React was only ever a problem
when the site shipped an empty `<div id="root">` (a client-side SPA). We fixed that on 2026-09-23 with build-time
prerendering: every public URL is now a real static HTML file with its own title, meta tags and full text.

**Verified live on 2026-10-02:** `/blog` returns its own title (*"Blog — LinkedIn outreach & prospecting guides | Spurly"*),
its H1 and all three post titles in the raw HTML, a self-canonical, and no noindex. `sitemap.xml` lists 8 URLs, and
`robots.txt` blocks the app paths. three.js on the new hero is loaded with a dynamic `import()`, so it doesn't block first paint.

That is the same output a Next.js or Astro site would give a crawler. So:

| Question | Answer |
|---|---|
| Can a React + Vite site rank #1? | Yes, as long as the public pages are prerendered (they are). |
| Should we migrate to Next.js / Astro now? | **No.** It would cost weeks, give zero ranking gain today, and split the codebase. |
| When would we reconsider? | Only if (a) the public site grows past ~300 pages and build time hurts, or (b) we need pages that update without a deploy (e.g. live data pages). Even then, only the marketing site would move. |
| What *can* still hurt us in this stack? | 1) Someone adds a public page without adding it to `PUBLIC_ROUTES` (it ships as an empty SPA page). Covered by `tests/seo.prerender.test.jsx`. 2) Heavy 3D/JS on public pages slowing LCP on mobile. Watch the Core Web Vitals report (rule in §8). 3) Vercel build command overridden to `vite build` (the prerender step silently skipped). |

---

## 3. Strategies we WILL use (ranked by impact for a new domain)

| # | Strategy | Why it works for us | Effort |
|---|---|---|---|
| W1 | **Search Console + Bing Webmaster set up properly** | No data, no decisions. Bing also powers ChatGPT search and Copilot, so it's half of GEO for free. | 1 hr, once |
| W2 | **Comparison + alternatives pages** (`/compare/spurly-vs-dripify`, `/alternatives/waalaxy-alternatives`) | Highest buying intent, low competition from big sites, fastest to rank for a new domain. AI answers quote fair comparison tables a lot. | 1 page/day with a template |
| W3 | **Feature + use-case pages** (`/features/...`, `/for/recruiters`) | Match what people literally search ("linkedin lead capture chrome extension"). These are our money pages. | Template once, then content |
| W4 | **Topic clusters** (pillar guide + 6–10 supporting posts, all interlinked) | Shows Google we cover a topic in depth, which is how small sites beat big ones on specific topics. | 2 pieces/week, ongoing |
| W5 | **Free tools** (connection-request generator, invite-limit calculator) | Earn backlinks without asking, and rank for "generator"/"calculator" queries. Reuses our existing AI writer. | 2–4 days per tool |
| W6 | **Templates library** (curated real message examples) | "linkedin connection request message examples" type queries have big volume and suit us. | Content work |
| W7 | **Off-site authority**: Chrome Web Store listing, Product Hunt, G2, Capterra, AlternativeTo, SaaSHub, founder posts on LinkedIn/X | Backlinks + brand mentions are the bottleneck for a new domain, and the main input for AI answers. | Ongoing, mostly Sarthak |
| W8 | **Answer-first writing (GEO)**: 2–3 sentence direct answer at the top, tables, numbered steps, "X is …" definitions, dated facts | Gets quoted in AI Overviews/ChatGPT/Perplexity and wins featured snippets. Costs nothing extra. | A writing rule |
| W9 | **Structured data**: Organization (+`sameAs`), SoftwareApplication + Offer, Article + author, BreadcrumbList | Helps Google and AI understand who we are and what we sell. | Small, once per template |
| W10 | **Per-page OG images** | We sell a LinkedIn tool; every page shared on LinkedIn should show a proper card. Clicks from shares feed brand searches. | Once, in the build |
| W11 | **Internal linking rules** | Cheapest ranking lever we control. Every page ≤3 clicks from home; every post links to its pillar + one feature page. | A rule + a "related" block |
| W12 | **Original data study** ("State of LinkedIn Outreach 2026" from anonymised, aggregated Spurly data) | The strongest backlink and AI-citation magnet there is. Needs a privacy/ToS check first. | Month 3+ |
| W13 | **Refresh, not just publish**: update top pages every 3–6 months with a new "Last updated" date | Freshness matters for "2026"-type queries and AI answers. | Monthly review |

## 4. Strategies we will NOT use (and why)

| # | Strategy | Why not |
|---|---|---|
| N1 | **Buying backlinks, PBNs, link exchanges, "guest post" farms** | Against Google's spam policies. A new domain caught doing it can lose rankings for months. Not worth the risk. |
| N2 | **Mass AI-generated pages** (hundreds of auto-spun "LinkedIn tool for {city/job}" pages) | Google's "scaled content abuse" policy (since March 2024) targets exactly this, whether AI or human. Thin pages also drag down the whole site. We do programmatic pages *only* where each page has unique, useful content (e.g. real templates per role). |
| N3 | **Doorway / city pages** ("LinkedIn automation in Mumbai") | Same reason. No unique value, so they get filtered. |
| N4 | **Targeting the head term "LinkedIn"** or "LinkedIn login" | Unwinnable and the wrong intent. Those people want linkedin.com. |
| N5 | **Migrating to Next.js / Astro now** | See §2. Zero ranking gain today, weeks of work. |
| N6 | **Blog on a subdomain** (blog.getspurly.com) or a separate CMS | Splits authority. Everything stays on `www.getspurly.com/...`. |
| N7 | **Relying on FAQ / HowTo rich snippets** | Since Aug 2023 Google shows FAQ rich results only for well-known government/health sites and dropped HowTo results. We keep FAQ *content* (good for AI answers and users) and FAQPage schema where it's already there (harmless), but expect no visual snippet from it. (`SEO_GROWTH_PLAN.md` listed FAQ schema as a ranking item; this overrides that.) |
| N8 | **Keyword stuffing, hidden text, cloaking** (showing bots different content than users) | Penalty risk, and it reads badly. Our prerender serves the same HTML to everyone, and must stay that way. |
| N9 | **Fake or incentivised reviews** (G2, Chrome Web Store, Capterra) | Against those sites' rules and consumer-protection law. Instead we *ask* real happy users for reviews after a success moment. |
| N10 | **Spamming Reddit / Quora / LinkedIn comments with links** | Gets accounts banned and the brand remembered badly. Instead, answer genuinely, with a link only when it's the real answer. |
| N11 | **Expensive SEO tools now** (Ahrefs/Semrush ~$100+/mo) | Not needed until there's traffic to analyse. Free stack: Search Console, Bing Webmaster, GA4, PageSpeed Insights, Google Keyword Planner, Ubersuggest/Ahrefs free tiers, and looking at the live results page. Reconsider at month 3. |
| N12 | **Multi-language / hreflang** | No translated content and not the bottleneck. One English site. Revisit if a market asks for it. |
| N13 | **Google Ads "to help SEO"** | Ads have no effect on organic rankings. Ads can be a separate decision for testing which keywords convert. |
| N14 | **Over-investing in `llms.txt`** | Cheap to add (we will, task T1.5), but no major AI engine has confirmed using it. Off-site mentions matter far more for GEO. |
| N15 | **Expired domains / 301-redirecting bought domains** | Spam-policy territory. No. |

---

## 5. Where we are today (baseline, 2026-10-02)

| Area | State |
|---|---|
| Prerendering | ✅ Live. Public pages ship real HTML + per-page meta |
| robots.txt / sitemap / app noindex | ✅ Live (8 URLs in the sitemap) |
| GA4 | ✅ Collecting since ~27 Sep 2026 (`G-LJP9HM0XT1`), enhanced measurement on, email redaction on, linked to Search Console. Last 28 days: **98 sessions = Direct 77 · Referral 14 · Organic Search 6 · Organic Social 1**. Users: US 21, India 14 (7 days) |
| ⚠️ GA4 data is mixed | The tag loads on the logged-in app too, and every app page has the same title, so "Spurly — LinkedIn Lead Capture…" shows ~2k views from 53 users. That is **app usage, not website visits**. Direct/Referral are mostly app users and your own testing. Fix in T1.3 (content groups) + S0.11 (internal traffic) before trusting any GA4 number |
| ⚠️ Key events | 0 recorded. The 3 listed (`close_convert_lead`, `qualify_lead`, `purchase`) are GA4's "Generate leads" template placeholders; none fire. Replaced by T1.3 events |
| Search Console | ✅ Set up as a **URL-prefix** property (`https://www.getspurly.com/`), not a Domain property. Sitemap submitted 21 Jun, last read 28 Sep, *Success*, 8 discovered |
| Search performance (3 months to 2026-10-02) | **11 clicks · 162 impressions · CTR 6.8% · avg position 7.8.** Only 4 queries, all brand: `spurly` (4 clicks / 83 impr.), plus misspellings `spurgly`, `spurley`, `sprungly`. **Zero non-brand queries.** |
| ⚠️ Brand ranking | Avg position 7.8 with mostly the query "spurly" means **we are not #1 for our own name**. Likely other things called "Spurly" outrank us. Fixing this is priority #1 (tasks S0.7, T1.1) |
| Indexing | 5 of 8 indexed. 3 = *Discovered – currently not indexed* (Google knows the URL but hasn't bothered to crawl it, a typical low-authority signal). Which 3 not yet known |
| AI features (GSC → Performance → Generative AI) | 17 impressions in 3 months, 16 on home. We already appear in AI Overviews occasionally |
| Core Web Vitals | "Not enough usage data". Too little traffic for field data, so use PageSpeed Insights (lab) instead |
| HTTPS | ✅ No issues |
| Bing | ❓ Not confirmed |
| Apex → www redirect | ❓ Not verified (cloud shell can't reach the site directly) |
| Public pages | Home, Blog index, 3 posts, Support, Privacy, Terms = **8 pages** |
| Money pages (pricing, features, compare, use-case) | ❌ None |
| Backlinks | ❌ Effectively **zero**. 1 external link (google.com → `/privacy`, i.e. the OAuth consent screen). Internal links: 8 |
| Redesign | 3D "warm editorial" home merged (PR #43). Other public pages are still to be designed |

---

## 6. Measurement setup (do once, then trust the numbers)

### 6.1 Google Search Console (the main SEO dashboard)
- Property type: **Domain property** (`getspurly.com`, verified by DNS TXT), so www, apex, http and https are all covered.
- Sitemaps → submit `https://www.getspurly.com/sitemap.xml`. Status must read *Success* and *Discovered pages: 8+*.
- URL Inspection → "Request indexing" for `/` and each blog post (once, after big changes only).
- Add Sarthak's co-founder/dev as a *restricted* user if needed (never share the owner role).

### 6.2 Bing Webmaster Tools
- Sign in → "Import from Google Search Console" (2 minutes). This also covers ChatGPT search / Copilot discovery.
- Turn on **IndexNow** (Bing notifies instantly when pages change). Optional code task T1.6.

### 6.3 GA4 (what visitors do after arriving)
- Admin → Data streams → web stream → *Enhanced measurement* ON (page views on route changes, outbound clicks).
- **Key events** (Admin → Events → mark as key event). These come from code task T1.3:
  - `add_to_chrome_click`: any "Add to Chrome" button (outbound to Chrome Web Store)
  - `sign_up`: account created (fire in the app after successful signup)
  - `begin_checkout` / `purchase`: when a paid plan starts (from the billing flow)
- Link GA4 ↔ Search Console (Admin → Product links → Search Console). This puts queries next to behaviour.
- Reports to use: *Acquisition → Traffic acquisition* filtered to **Organic Search**; *Engagement → Landing page*.
- Chrome Web Store links carry `utm_source=getspurly&utm_medium=website&utm_campaign=<page>`, so installs can be traced to pages.

### 6.4 The tracked keyword list (`docs/seo/keywords.csv`, task T1.7)
~30 queries across the four tiers in §1. Columns: `query, tier, target_url, position, impressions, clicks, date`.
Filled from Search Console each month. A query with no target page yet = a content gap → becomes a task.

### 6.5 AI visibility check (monthly, manual, 20 min)
Ask the same 15 questions in ChatGPT, Perplexity, Gemini and Google (AI Overview). Log in `docs/seo/ai_visibility.csv`:
`question, engine, spurly_mentioned (y/n), sources_cited, date`. Example questions:
best LinkedIn outreach tool for recruiters · Dripify alternatives · free LinkedIn lead capture Chrome extension ·
how to save LinkedIn profiles to a spreadsheet · is LinkedIn automation safe · LinkedIn weekly invite limit.
The *sources cited* column tells us exactly which sites to get listed on (§3 W7).

---

## 7. Execution backlog (for Sonnet: one task per session)

**Versions, not weeks.** Building is fast with AI: each version can be built in one night. A version is done when every task is built, `npm run verify` passes, it's deployed, and Sarthak has reviewed the copy. The next version starts right after.

| Version | What ships | Needs from Sarthak | Done when |
|---|---|---|---|
| **v1** Truth + foundation | Wrong claims, old pricing and webcam removed; tracking, structured data, OG images, robots/llms.txt, region-aware price, 404, sitemap dates | Manual setup (v1.b), ~2 hrs | Live site has no false claims; GA4 shows `sign_up` / `add_to_chrome_click` |
| **v2** New product site | Content system + templates; new home, /pricing, 5 product pages, /security, /about, 3 solutions, 3 comparisons; blog posts updated; privacy rewrite | Screenshots, explainer video, founder bio/photo, copy review, trial-payment answer, privacy sign-off | All P0 pages live and in the sitemap; requested in Search Console |
| **v3** Content engine | Pillar guides + supporting posts, first free tool, templates library, P1 product pages, remaining comparisons/alternatives/best-of, changelog, glossary | Review each page (10 min), one real insight per page | Built in batches of ~10 pages, each reviewed before publishing |
| **v4** Authority (ongoing) | Product Hunt, directories, G2/Capterra, founder posts, guest posts, data study | Mostly Sarthak's own accounts and outreach | Referring domains growing month over month |

**What AI speed can't compress** (plan around it, don't fight it): Google takes days to weeks to crawl and index new pages; rankings settle over weeks to months; backlinks and reviews come from other people. So results are measured on a calendar (§8), even though building is not. And speed is not a risk by itself, but thin pages are: 60 unreviewed pages published in one night can trip Google's scaled-content policy (§4 N2). That's why v3 ships in reviewed batches.

**How to execute a task:** read this section + the matching section of `SEO_GROWTH_PLAN.md`. Follow the repo rules in
`SEO_PLAN.md` → "How it works now". Every new public page: route in `src/app/routes.jsx` + `<Seo>` + entry in
`PUBLIC_ROUTES` (`src/products/pages/website/seo.js`). Run `npm run verify` before committing. Tick the box and add a
line to §9 Log. Only claim features that are shipped. If unsure, list it as a question for Sarthak instead of writing it.
Never change app (logged-in) code outside what the task names.

## v1 — Fix the truth + technical foundation

### v1.a Fix wrong claims on the live site (first thing in v1)
- [x] **T0.1** Remove the Webcam section; replace 3-plan pricing ($0/$29/$99) with the single plan **$24.99 / ₹2,499 per month, 7-day free trial**; "Start free" → "Start 7-day free trial"; remove any "no credit card required" text (a card/UPI is required). Remove "local-only / 100% local / your data never leaves your device" claims (Footer, Hero, Webcam section) and all "Session" wording; soften "lives in your browser / without leaving the tab". Hub processes data server-side, so these are now false. See `SEO_CONTENT_PLAN.md` §1. *Accept:* `grep -ri "local-only\|never leaves\|100% local\|Session" src/products/pages/website` returns nothing user-facing.

### v1.b Manual setup (Sarthak, ~2 hrs, no code, in parallel with v1.a/v1.c)
- [ ] **S0.1** Search Console: confirm Domain property, sitemap submitted & *Success*, request indexing for `/` + 3 posts
- [ ] **S0.2** Bing Webmaster: import from GSC, enable IndexNow
- [ ] **S0.3** GA4: enhanced measurement on, link to Search Console
- [ ] **S0.4** Vercel → Domains: `getspurly.com` 308/301-redirects to `www.getspurly.com` (check: open `https://getspurly.com/blog` and confirm the address bar ends on `www.`)
- [ ] **S0.5** Chrome Web Store listing: rewrite title + short description with the main keyword ("Spurly – LinkedIn Lead Capture & Outreach"), 5 screenshots, link to website. Ask 5 real users for reviews
- [x] **S0.6** Search Console + GA4 screenshots sent (2026-10-02)
- [ ] **S0.7** Win the brand query: Google `spurly` in a private window and note who ranks above us. Then: create/complete a LinkedIn company page and an X profile named "Spurly" linking to getspurly.com; make sure the Chrome Web Store listing links to the site; list on Product Hunt + AlternativeTo + SaaSHub with the same name/description. These, plus `sameAs` (T1.1), tell Google which "Spurly" is the entity
- [ ] **S0.8** Search Console → Pages → click *Discovered – currently not indexed* → note the 3 URLs → URL Inspection → *Request indexing* on each. Then link to them from the home page if they aren't already
- [ ] **S0.9** Add a **Domain property** (`getspurly.com`, DNS TXT) alongside the existing URL-prefix one, so apex/http variants are covered too
- [ ] **S0.11** GA4 cleanup: Admin → Data streams → web stream → *Configure tag settings* → *Define internal traffic* (add your home/office IP), then Admin → *Data filters* → set "Internal traffic" to **Active**. Un-star `close_convert_lead` and `qualify_lead` in Admin → Events (template placeholders). Star `add_to_chrome_click` and `sign_up` once T1.3 ships and they appear
- [ ] **S0.10** Run PageSpeed Insights on `/` (mobile) and log Performance score + LCP in §9, since field data won't exist for months

### v1.c Technical finishing (Sonnet)
- [x] **T1.1** `ORGANIZATION_LD`: add `sameAs` (Chrome Web Store, LinkedIn page, X, Product Hunt once live), `description`, `foundingDate`. Add `SoftwareApplication` with `applicationCategory: BusinessApplication`, `operatingSystem: Chrome`, `offers` (only real prices). *Accept:* Rich Results Test shows no errors on `/`.
- [x] **T1.2** Per-page OG images: generate 1200×630 PNGs at build time (title + brand) for every `PUBLIC_ROUTES` entry; `<Seo>` uses the page image, falling back to the default. *Accept:* LinkedIn Post Inspector shows the page-specific card for a blog post.
- [x] **T1.3** GA4 content groups + events. (a) Send `content_group: 'website'` from prerendered public pages and `content_group: 'app'` from `app.html`, and give app routes their own `document.title` (e.g. "Contacts · Spurly"), so website and app traffic can be split in every report. (b) Events: a tiny `track(event, params)` helper (no-op when `window.gtag` is missing, so prerender stays safe). Fire `add_to_chrome_click` on every Chrome Web Store CTA (plus UTM params on those links), `sign_up` after successful signup, `begin_checkout`/`purchase` in billing. *Accept:* events appear in GA4 → DebugView.
- [x] **T1.4** robots.txt: explicitly `Allow: /` for `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Bingbot` (keeping the app disallows for each). *Accept:* robots test in GSC passes for `/` and blocks `/dashboard`.
- [x] **T1.5** `/llms.txt`: generated at build from `PUBLIC_ROUTES`: one-paragraph description of Spurly + a list of key pages with one line each.
- [ ] **T1.6** IndexNow: generate a key file in `public/`, and add a post-deploy script (or GitHub Action) that pings IndexNow with changed URLs from the sitemap. Optional; skip if it takes more than half a day.
- [x] **T1.7** Create `docs/seo/keywords.csv` (30 starter queries from §1 + `SEO_GROWTH_PLAN.md` §2) and `docs/seo/ai_visibility.csv` (15 questions, empty results).
- [x] **T1.8** 404 page: useful (search-like links to top pages), returns real 404 status for unknown *public* paths if Vercel allows (check before building).
- [x] **T1.10** Public `GET /api/public/region` in spurly.backend (no auth, reuses `regionFromIp`) + region-aware price on `/` and `/pricing` (USD prerendered, INR after hydration for India), `user_region` GA4 param, two Offers in structured data. Spec: `SEO_CONTENT_PLAN.md` §5a.
- [ ] **T1.11** Explainer video section: YouTube upload (Sarthak), click-to-load facade, chapters, transcript, `VideoObject`. Spec: `SEO_CONTENT_PLAN.md` §5b item 2.
- [x] **T1.9** Sitemap `lastmod` comes from each page's content date (frontmatter/data), never the build date.

## v2 — The new product site

### v2.a Content system + templates (inside the 3D redesign)
- [ ] **T2.1** Content as data: pages built from Markdown/JSON files with frontmatter (`title, description, slug, date, updated, author, cluster, faq[]`), read at build time so they prerender. Migrate the 3 existing posts. *Accept:* adding a `.md` file = new prerendered page + sitemap entry, no JSX needed.
- [ ] **T2.2** Templates, built on the new design tokens: Article, Feature, Use-case (`/for/*`), Comparison (table-first), Pricing, Tool. Each has one H1, breadcrumbs (+ BreadcrumbList), "Last updated", author box, related-pages block, CTA after each main section, FAQ block.
- [ ] **T2.3** Author page `/about` + `/blog/author/sarthak` (real person, photo, LinkedIn link). Real authorship is a trust signal for Google and for AI.
- [ ] **T2.4** `/pricing` as its own page (Offer schema with real prices; needs the decision in §11).

### v2.b Money pages (each page = one task)
**Superseded by `SEO_CONTENT_PLAN.md` §4–§7** (product is now cloud automation; new URLs under `/product/*`, `/solutions/*`, `/compare/*`). Order: home rewrite → /pricing → 5 P0 product pages → /security + /about → 3 solutions → 3 comparisons. The list below is the old extension-era plan, kept for reference.
- [ ] **T3.1–T3.3** `/compare/spurly-vs-dripify`, `-vs-waalaxy`, `-vs-expandi`: honest table, pricing as of date (sourced), who should pick which
- [ ] **T3.4–T3.7** `/features/linkedin-lead-capture`, `/features/linkedin-outreach-campaigns`, `/features/linkedin-sequences`, `/chrome-extension`
- [ ] **T3.8–T3.10** `/for/recruiters`, `/for/founders`, `/for/sales-teams`
- [ ] **T3.11** `/features` hub + `/security` (account safety, what data we store)

## v3 — Content engine (then v4 — authority, ongoing)
- [ ] **T4.x** Pillar 1 *LinkedIn outreach guide 2026* + spokes; Pillar 2 *Is LinkedIn automation safe?* + spokes (list in `SEO_GROWTH_PLAN.md` §2.7)
- [ ] **T4.x** Tool #1: `/tools/linkedin-connection-request-generator` (rate-limited, no login, reuses the AI provider chain; cost cap)
- [ ] **T4.x** `/templates` hub + 3 template pages
- [ ] **T4.x** Alternatives + "best of" pages
- [ ] **Off-site (Sarthak):** Product Hunt launch (after Sprint 3), AlternativeTo, SaaSHub, G2, Capterra, BetaList, Indie Hackers; one founder post per week on LinkedIn linking to a guide

**Content rules for every page Sonnet writes:**
1. One target query per page (stated in frontmatter as `target_query`). Title ≤ 60 chars and contains it; description ≤ 155 chars.
2. First 2–3 sentences answer the query directly (GEO). Then detail.
3. At least one table or numbered list, one real screenshot/GIF from Sarthak, and a "Last updated" date.
4. Facts about competitors (prices, limits) carry a source link and the date checked.
5. Links: up to its pillar, across to 1 feature page + 1 related page; the pillar links back.
6. No invented testimonials, numbers or customer names. Mark gaps as `TODO(Sarthak): ...` for first-hand detail.
7. Sarthak reviews and adds one personal insight before publishing (pure AI text with no first-hand detail ranks poorly and doesn't get cited).

---

## 8. The review loop (how the plan tweaks itself)

### Weekly (15 min, Monday): Search Console → Performance, last 7 days vs previous
Log 4 numbers in §9: clicks, impressions, avg position, indexed pages. Then check *Pages → Why pages aren't indexed* for new errors.

### Monthly (1 hr, 1st of month): last 28 days, export Performance → Queries + Pages as CSV
Give the CSVs + `keywords.csv` to Claude with: *"Run the monthly SEO review per docs/SEO_MASTER_PLAN.md §8."* Claude applies these rules and turns each hit into a task in §7:

| Signal (Search Console, 28 days) | Meaning | Action |
|---|---|---|
| Impressions ≥ 100, CTR < 1.5%, position ≤ 10 | Ranking but nobody clicks | Rewrite title + description (test one change, recheck in 4 weeks) |
| Position 8–20 for a target query | Close to page 1 | Add 300–600 words answering missing sub-questions, add 3 internal links *to* it from related pages |
| Position 20–50 after 3 months | Not competitive | Check the live results: if the top 10 are all big brands or a different intent, change the target query; else rebuild the page deeper |
| A query we have no page for gets ≥ 50 impressions | Google already associates us with it | New page or section for it (high-priority task) |
| Page in sitemap but "Crawled – currently not indexed" > 4 weeks | Google thinks it's thin or duplicate | Improve or merge it with a stronger page (301) |
| Page with 0 impressions after 90 days | Wrong target or no links | Re-target or merge |
| Core Web Vitals report shows "Poor" URLs | Speed problem (watch the 3D hero) | Fix before publishing more pages on that template |
| Organic sessions up but `add_to_chrome_click` / `sign_up` flat | Traffic but wrong intent or weak CTA | Fix the CTA / page intent before chasing more traffic |
| AI check: competitor cited from a site we're not on | GEO gap | Get listed / mentioned on that source |

### Quarterly: rethink the strategy
Re-read §3/§4 with three months of data. Decide: which cluster to double down on, whether to pay for an SEO tool (N11),
whether the data study (W12) is ready.

---

## Deferred (noted, not scheduled)
- [ ] **T1.12** (spurly.backend) *Deferred by Sarthak 2026-10-03, not in v1–v4.* Trial-ending email 2 days before the first charge: "Your trial ends on <date>; you'll be charged <price>. Cancel here." Reduces chargebacks and disputes. Until it ships, the site must not promise a reminder.

## 9. Log

| Date | Clicks (7d) | Impr. (7d) | Avg pos | Indexed / sitemap | Notes |
|---|---|---|---|---|---|
| 2026-10-02 | 11 (3 mo) | 162 (3 mo) | 7.8 | 5 / 8 | Baseline from GSC screenshots. Brand only, not #1 for "spurly". 0 real backlinks. 3 pages Discovered-not-indexed. 17 AI-feature impressions. GA4: Organic Search 6 sessions / 28 days (the real website-from-Google baseline); 0 key events; app traffic mixed in. |
| 2026-10-03 | | | | | **T0.1 done** (uncommitted): Webcam removed; single $24.99/₹2,499 plan + exact trial copy; "Start 7-day free trial" CTAs; local-only/Session/no-card claims removed from components, FAQ, structured data, Support, blog. Privacy/Terms still carry old wording, left for the v2 rewrite. |
| 2026-10-03 | | | | | **T1.3 done** (uncommitted): `src/shared/analytics/analytics.js` (`track`, content groups, app page titles, UTM'd Chrome links). Tag now loads with `send_page_view:false`; `PageViewTracker` sends every page_view with `content_group` website/app. Events: `add_to_chrome_click` (footer + onboarding), `sign_up`, `begin_checkout`, `purchase` (trial start = value 0). `user_region` attached once known. Not yet verified in GA4 DebugView (needs a deploy). |
| 2026-10-03 | | | | | **T1.10 done** (uncommitted, both repos): backend `GET /api/public/region` (`platform/subscriptions/route/publicRoutes.js`, mounted before the auth routers, `Cache-Control: private, max-age=86400`), checked live with supertest (US IP → INTL, Indian IP → IN, no JWT). Web: `usePublicRegion`/`usePrice`, USD prerendered, INR after hydration on hero, pricing card, final CTA and blog CTA; currency toggle removed; two Offers with `priceSpecification` in structured data (`pricing.js` is the single source). `tests/public.region.test.js` is written but jest won't start on the dev VM (runner not found), so run `npm run test:unit` locally. `user_region` is only known after the region call or checkout, so it is missing on direct-to-/signup visits. `/pricing` page itself is v2. New `tests/website.claims.test.jsx` pins the banned claims. |
| 2026-10-03 | | | | | **T1.1 done**: Organization gets `legalName`, `description`, `foundingDate: 2026`, `sameAs` (LinkedIn company page + Chrome Web Store; no X account; Product Hunt TODO once live). SoftwareApplication has the two real Offers (done in T1.10). Rich Results Test not run (needs the live URL); a test pins the JSON-LD shape. |
| 2026-10-03 | | | | | **T1.2 done** (not built end to end): `scripts/ogImages.mjs` (satori + resvg, Fraunces/Instrument Sans from @fontsource) writes `dist/og/<slug>.png` for every `PUBLIC_ROUTES` entry from `prerender.mjs`; `<Seo>` points og:image/twitter:image at the page's own card. Generator tested standalone and the cards viewed. **Run `npm install` (4 new devDependencies), then `npm run build`.** Check with LinkedIn Post Inspector after deploy. |
| 2026-10-03 | | | | | **T1.4 done**: `public/robots.txt` has an explicit group per AI/search crawler (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Bingbot) plus `*`, each repeating the app Disallows (a bot with its own group ignores `*`). `tests/robots.test.js` parses it. |
| 2026-10-03 | | | | | **T1.5 done**: `scripts/llmsTxt.mjs` builds `dist/llms.txt` from the prerendered titles/descriptions (summary + page and blog lists); `prerender.mjs` writes it. |
| 2026-10-03 | | | | | **T1.9 done**: sitemap `lastmod` comes from `pageDates.js` (home/support/privacy/terms) and each post's `updated`/`date`; nothing uses the build date (test pins it). Home, support and the 3 posts bumped to 2026-10-03 because T0.1 changed their text. |
| 2026-10-03 | | | | | **T1.8 done** (verify on a Vercel preview): new noindex 404 page (`pages/NotFound.jsx`) replaces the redirect-to-home; `prerender.mjs` writes `dist/404.html`; `vercel.json` now rewrites only the app prefixes (dashboard, hub, admin, onboarding, subscribe, signup, login, forgot-password, reset-password, dev) to `/app`, so any other unknown path gets Vercel's real 404 using `404.html`. A test checks every app route prefix in `routes.jsx` is covered. |
| 2026-10-03 | | | | | **T1.7 done**: `docs/seo/keywords.csv` (30 queries, tiers 1-3, extra `notes` column marking unbuilt pages and gaps) and `docs/seo/ai_visibility.csv` (15 questions x 4 engines, blank results). |
| 2026-10-03 | | | | | **Full `npm run build` verified** (T1.2, T1.5, T1.8 now end to end): `npm install` run; build exits 0; `dist/og/*.png` 8 files at 1200x630 (home, blog, 3 posts, support, privacy, terms), `dist/llms.txt`, `dist/404.html`, `dist/sitemap.xml` (8 urls); og:image meta points at `/og/<slug>.png`. Note: vite needs delete permission to empty `dist/` from the sandbox. Still open: backend jest run, Vercel preview check of T1.8 rewrites. |
| 2026-10-03 | | | | | **Copy cleanup** (uncommitted): Privacy.jsx and Terms.jsx stale lines patched (no more "data never leaves your device", "Sessions", "free plan"; Terms now says single paid plan with 7-day trial). Founders blog post title, shortTitle, description and excerpt no longer say "free"; slug kept (`free-linkedin-...`), decision 2026-10-03. Hero H1 and home title tag left for v2. vitest: 257 pass, same 12 pre-existing hub failures. |
| 2026-10-03 | | | | | **v1 verified**: backend `npm run test:unit` 72 suites / 1262 tests pass (includes `public.region.test.js`). Vercel preview checked: `/random-path` is a real HTTP 404 with the new page; `/login` and `/signup` load. `/dashboard` not checked (same rewrite). Preview-origin CORS/500 on `/api/auth/me` is the unlisted `*.vercel.app` origin, not a regression. Open: delete 2 og-preview PNGs, key events in GA4 after deploy, single commit per repo when Sarthak says done. |

---

## 10. Screenshots needed from Sarthak (to fill the baseline)

**Google Search Console** (search.google.com/search-console):
1. Property picker (top-left dropdown): shows whether it's a *Domain* or *URL-prefix* property
2. **Overview** page
3. **Indexing → Pages**: the chart + the "Why pages aren't indexed" table
4. **Indexing → Sitemaps**: status and discovered count
5. **Performance → Search results**: date range *Last 3 months*, with all four boxes ticked (clicks, impressions, CTR, position), then the **Queries** tab and the **Pages** tab
6. **Links**: top linking sites (if any)
7. **Experience → Core Web Vitals** (may say "not enough data". That's fine)

**GA4** (analytics.google.com):
8. Admin → Data streams → the web stream (shows enhanced measurement)
9. Reports → Acquisition → Traffic acquisition, last 28 days
10. Admin → Events (shows which are marked as key events)

**Other:** 11. Whether Bing Webmaster Tools is set up (yes/no) · 12. The Chrome Web Store listing URL

---

## 11. Decisions needed from Sarthak (blocking some tasks)

1. **Positioning / main keyword.** ~~Lead capture & outreach~~ → **changed 2026-10-02: Spurly is now a cloud LinkedIn outreach automation platform (Hub); lead with that, safety as the differentiator.** Hero line decided: "LinkedIn outreach that runs itself." See `SEO_CONTENT_PLAN.md` §2.
2. ~~Public prices~~ **Decided:** $24.99/month (outside India), ₹2,499/month (India), 7-day free trial, region by IP. Trial needs a card (or UPI in India) up front; charged on day 8 unless cancelled. Copy in `SEO_CONTENT_PLAN.md` §5.
3. **Which features are live and OK to market now?** (Hub inbox, sequences, audience builder; Insights is not built.) Pages are only written for shipped features.
4. **Target market**: global (USD, English) first, or India first? Changes competitor set and examples, not the site structure.
5. **Who reviews content before publishing?** Recommended: Sarthak, 10 min per page, adding one real insight/screenshot.
