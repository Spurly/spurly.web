# Spurly Growth Plan: Site Map, UI Redesign, SEO + GEO

> **Start at `docs/SEO_MASTER_PLAN.md`** (strategy, task backlog, review loop). This file = the full page inventory and content clusters. Note: FAQ schema no longer produces rich results (see master plan N7). The week-based roadmap (§1, §7) is superseded by the v1–v4 versions in the master plan §7.

> Living doc. Companion to `SEO_PLAN.md` (which covers the technical prerender work, already built).
> This file answers: **what pages do we need, in what order, and how do we rank.**
> Owner: Sarthak. Written 2026-10-02.

## 0. Reality check (read once)

- **We cannot rank for "LinkedIn".** linkedin.com owns it. The goal "anyone searching anything LinkedIn-related sees Spurly" is
  really: *own every query where someone wants to find, contact, or track people on LinkedIn, and every query comparing tools like ours.*
  That is hundreds of long-tail queries, not one head term.
- A new domain has little authority. **Backlinks and a steady publishing rhythm are the bottleneck**, not code.
- Order of ease: brand queries (weeks) → "X alternative / vs" queries (1-3 months) → how-to / template / tool queries (2-6 months)
  → broad guides (6-12 months).
- Keyword volumes below are **not validated**. Before writing each cluster, check it in Search Console (once data exists), Ahrefs/Semrush/Ubersuggest,
  and by eyeballing the live SERP (who ranks? can a small site beat them?).

## 1. What first? (the decision)

**Neither alone. Do it in this order, with overlap:**

| Step | When | What | Why this order |
|---|---|---|---|
| A. Launch what's already built | Days 1-3 | Deploy, verify prerender, Search Console + Bing, optimise Chrome Web Store listing | Free, already done, and **starts Google's indexing clock**. Every week we wait is a week of lost aging. |
| B. Decide the site map (this doc) + build page *templates* | Days 1-7 | Lock the page list; design 6 reusable templates | The redesign should be built around the pages we actually need, not the 3 we have. |
| C. Redesign + ship core pages | Weeks 1-3 | Home, Pricing, Features, 3 comparisons, 3 use-cases, Security, About | Money pages. Fewer than 15 pages, high intent, high conversion. |
| D. Content engine | Weeks 3-8, ongoing | 2 pillar guides + clusters, templates library, 1 free tool | Where category rankings come from. |
| E. Authority | Month 2+, ongoing | Directories, Product Hunt, G2, data study, founder LinkedIn posts, guest posts | Backlinks. Without these D plateaus. |

Do **not** redesign everything before publishing anything. Do **not** publish 50 posts into an ugly, slow template.
Build the templates once (C), and after that a new page is *data* (Markdown / JSON), not design work.

## 2. Page inventory (what we need)

Legend: **P0** = build in weeks 1-3 · **P1** = weeks 3-8 · **P2** = month 2+.
Only claim features that are shipped. Confirm each feature below is live and marketable before its page goes up.

### 2.1 Core (P0)
| URL | Purpose | Notes |
|---|---|---|
| `/` | Brand + category landing | One clear promise, Chrome install CTA + signup CTA, proof, FAQ (FAQ schema) |
| `/pricing` | Conversion | Standalone page (currently only a home section). Plan comparison table, FAQ, Product schema/Offer |
| `/features` | Hub linking to every feature page | Internal-link hub |
| `/chrome-extension` | Ranks for "linkedin ... chrome extension" | Mirrors CWS listing; install button; screenshots; permissions explained |
| `/about` | E-E-A-T, entity page | Who's behind it, mission, links to LinkedIn/X/CWS (`sameAs`) |
| `/security` | Trust + "is it safe" objection | Data handling, LinkedIn account safety, what we store. Also helps CWS review |
| `/contact` or keep `/support` | Support | Already exists |
| `/privacy`, `/terms` | Legal | Already exist |
| `/changelog` | Freshness signal, shows momentum | Cheap: one Markdown file |

### 2.2 Feature pages (P0 first 4, rest P1)
Each targets one intent, 800-1200 words, screenshots/GIF, FAQ, links to related features and one use-case.

| URL | Target intent |
|---|---|
| `/features/linkedin-lead-capture` (P0) | "save linkedin profiles to spreadsheet / CRM", "linkedin lead capture extension" |
| `/features/linkedin-outreach-campaigns` (P0) | "linkedin outreach tool", "linkedin campaign software" |
| `/features/linkedin-sequences` (P0) | "linkedin drip campaign", "linkedin follow-up sequence tool" |
| `/features/linkedin-unified-inbox` (P1) | "linkedin inbox management tool" |
| `/features/linkedin-audience-builder` (P1) | "linkedin lead list builder", "sales navigator alternative / lead search" |
| `/features/linkedin-message-templates` (P1) | "linkedin message templates tool", personalization with tokens |
| `/features/linkedin-crm` (P1) | "linkedin crm", "track linkedin connections" |
| `/features/csv-import-export` (P1) | "import csv linkedin leads" |
| `/features/acceptance-tracking` (P1) | "track linkedin connection acceptance rate" |
| `/features/analytics-insights` (P2, only after Insights ships) | "linkedin outreach analytics" |

### 2.3 Use-case / audience pages (P0 first 3)
URL pattern `/for/<audience>`. Each: the audience's specific pain, a workflow with Spurly, a template pack, FAQ.

- P0: `/for/founders`, `/for/recruiters`, `/for/sales-teams` (SDRs / BDRs)
- P1: `/for/agencies`, `/for/freelancers-consultants`, `/for/job-seekers`
- P2: `/for/startups`, `/for/b2b-saas`, `/for/real-estate`, `/for/financial-advisors` (only with real content, no thin clones)

### 2.4 Comparison + alternatives (highest purchase intent, P0 first 3)
These are the **fastest to rank and convert**. Be honest and specific; a fair table beats a hit piece (also gets cited by AI answers).

- `/compare/spurly-vs-dripify` · `/compare/spurly-vs-waalaxy` · `/compare/spurly-vs-expandi` (P0)
- `/compare/spurly-vs-linked-helper` · `/compare/spurly-vs-phantombuster` · `/compare/spurly-vs-lemlist` · `/compare/spurly-vs-heyreach` · `/compare/spurly-vs-meet-alfred` · `/compare/spurly-vs-zopto` (P1)
- `/alternatives/dripify-alternatives` · `/alternatives/waalaxy-alternatives` · `/alternatives/expandi-alternatives` · `/alternatives/linked-helper-alternatives` · `/alternatives/phantombuster-alternatives` (P1)
- `/best/linkedin-automation-tools` · `/best/linkedin-lead-generation-tools` · `/best/linkedin-crm-tools` · `/best/chrome-extensions-for-linkedin` (P1, "best of" lists where we're one honest entry among 8-10)

### 2.5 Free tools (link magnets, P1 first one)
Tools earn backlinks and rank for "generator" queries with no sales page needed. Server-side/AI cost must be capped (rate limit, no login or soft email gate).

- `/tools/linkedin-connection-request-generator` (P1, the first one; reuses the AI writer)
- `/tools/linkedin-message-generator` (cold message / follow-up)
- `/tools/linkedin-weekly-invite-limit-calculator` (safe-sending planner)
- `/tools/linkedin-outreach-roi-calculator`
- `/tools/linkedin-boolean-search-builder` (P2)
- `/tools/linkedin-headline-generator` (P2, wide top-of-funnel)

### 2.6 Templates library (programmatic but valuable, P1/P2)
Curated, human-edited examples, not auto-spun. Each page = 8-15 real templates + when to use + tips.

- `/templates` hub
- `/templates/linkedin-connection-request-messages` · `/templates/linkedin-follow-up-messages` · `/templates/linkedin-cold-outreach-messages` · `/templates/linkedin-inmail-examples`
- By role (P2): `/templates/connection-request-for-recruiters`, `...-for-sales`, `...-for-founders`, `...-for-job-seekers`, `...-for-networking`

### 2.7 Blog (P1, ongoing) - topic clusters, hub-and-spoke
Pillar (3000+ words, updated twice a year) + 6-10 supporting posts linking up to it and sideways to feature pages.

1. **LinkedIn outreach** - pillar: *The complete guide to LinkedIn outreach (2026)*.
   Spokes: connection request examples that get accepted; follow-up sequence that works; how to personalise at scale; best time to message; how many requests per week; what a good acceptance rate is.
2. **LinkedIn lead generation** - pillar: *LinkedIn lead generation: the practical playbook*.
   Spokes: Sales Navigator tutorials; export Sales Navigator leads; LinkedIn boolean search cheat sheet; find someone's email from LinkedIn; build a lead list for free.
3. **LinkedIn automation safety** - pillar: *Is LinkedIn automation safe? Limits, risks, and how to stay under them.*
   Spokes: LinkedIn weekly invite limits explained; cloud vs extension tools; what gets accounts restricted; warm-up myth vs reality; LinkedIn's rules on automation. (High trust + high search interest; also answers the objection every buyer has.)
4. **Recruiting on LinkedIn** (existing post lives here): recruiter outreach templates, candidate pipeline, sourcing without Recruiter licence.
5. **LinkedIn as a CRM / tracking** - how to track outreach, spreadsheet vs CRM, measuring acceptance rate.
6. **Founder-led growth** (existing post lives here): founders' outreach, building in public on LinkedIn.
7. **Original data** (P2, strongest backlink magnet): *State of LinkedIn Outreach 2026* from anonymised, aggregated Spurly data (acceptance rates by role/message length). Needs a privacy check and user consent in ToS before use.

Existing 3 posts stay; rewrite titles/intros to fit clusters and add internal links.

### 2.8 Glossary (P2, strong for AI answers)
`/glossary/<term>`: connection acceptance rate, InMail, social selling index, warm outreach, lead enrichment, sales cadence, ICP, drip campaign.
Short (200-400 words), definition first, links to the deep guide.

### 2.9 Housekeeping pages
`/blog/author/<name>` (E-E-A-T), `/blog/category/<cluster>`, `/404` (useful, links to top pages), `/rss.xml`, `/llms.txt`.

### 2.10 Count
P0 ≈ 19 pages (core 9 + 4 features + 3 use-cases + 3 comparisons) · P1 ≈ 40 · P2 ongoing. Build time of the prerender step stays fine up to ~300 pages; re-evaluate Astro/Next only beyond that.

## 3. Marketing UI redesign

**Principle: design six templates, not twenty pages.**

| Template | Used by |
|---|---|
| Home | `/` |
| Product/feature | features, `/chrome-extension` |
| Audience / use-case | `/for/*` |
| Comparison (table-first) | `/compare/*`, `/alternatives/*`, `/best/*` |
| Article (blog + guides + glossary) | blog, glossary, templates |
| Tool | `/tools/*` |
| Pricing | `/pricing` |

SEO requirements the design must satisfy (build these into the templates, not each page):
- One `<h1>`, logical h2/h3 outline, real text (never text-in-image), table of contents on long articles.
- LCP < 2.5s on mobile: WebP/AVIF, explicit width/height, lazy below the fold, no layout shift, no blocking fonts.
- Above the fold: promise, **Add to Chrome** + **Start free**, one proof element. Repeat the CTA after each major section.
- Every page: breadcrumbs, related-pages block (internal links), author + "last updated" on articles, FAQ block with FAQ schema.
- Mobile-first, accessible contrast, keyboard navigable (also a ranking and conversion factor).
- Content lives in data files (Markdown + frontmatter or JSON), rendered by templates. Adding a page never needs a design task.
- Reuse the existing `--ui-*` tokens so marketing and app stay visually one product.

Design process: reference screenshots → home + 1 template per type in Figma or directly in code → review → roll out. Keep the old site live until the new home beats it on speed.

## 4. Technical SEO checklist (extends SEO_PLAN.md Phases 3-4)
- [ ] Deploy and verify (`curl` returns page-specific `<title>`, app routes return `noindex`). *Not verified from this session: the cloud shell couldn't reach the live site.*
- [ ] Canonical host `www.getspurly.com`; apex 301s to it
- [ ] Search Console (DNS TXT), submit sitemap, request indexing for top pages; Bing Webmaster (import from GSC)
- [ ] Per-page OG image (generated, 1200x630) so LinkedIn shares look good, since this is a LinkedIn product
- [ ] Sitemap `lastmod` driven by real content dates, not build date
- [ ] Structured data per type: Organization (+`sameAs`), SoftwareApplication (+Offer on pricing), FAQPage, Article + author, BreadcrumbList, HowTo only where real steps exist
- [ ] Internal linking rules: every page reachable in ≤3 clicks; every new post links to its pillar + 1 feature page + 1 other post; pillar links back to all spokes
- [ ] Redirect map whenever a URL changes (never leave 404s)
- [ ] Core Web Vitals monitored monthly (PageSpeed + Search Console report)
- [ ] RSS feed
- [ ] Decide on India angle: if a lot of traffic is Indian, add `/in` pricing in INR via geo/currency display, but only one canonical English site for now (no hreflang yet)

## 5. GEO (being cited by ChatGPT, Perplexity, Gemini, Google AI Overviews)
AI answers mostly retrieve from the open web + Bing/Google indexes, and lean on third-party sources. So:
- [ ] Be indexed in **Bing** (feeds ChatGPT search and Copilot) and Google
- [ ] robots.txt: explicitly allow GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended
- [ ] `/llms.txt` summarising what Spurly is + links to key pages (cheap; impact is unproven, don't over-invest)
- [ ] **Answer-first writing**: every article opens with a 2-3 sentence direct answer / TL;DR, then detail. Use comparison tables, numbered steps, definition sentences ("X is …")
- [ ] Quotable facts with sources and dates ("Last updated: Oct 2026"); original numbers get cited most
- [ ] Entity consistency: same name, description, logo everywhere (site, Chrome Web Store, Product Hunt, G2, X, LinkedIn page); link them via `sameAs`
- [ ] Get listed where AI looks: G2, Capterra, AlternativeTo, SaaSHub, Product Hunt, "best X tools" roundups, Reddit threads, YouTube demos
- [ ] Monthly check: ask ChatGPT / Perplexity / Gemini ~20 target questions ("best LinkedIn outreach tool for founders", "Dripify alternative"), log whether Spurly appears and which sources they cite; write/earn content for the gaps

## 6. Off-site authority (what moves category rankings)
Ordered by effort/return:
1. Chrome Web Store listing: keyword-rich title/description, screenshots, regular updates, ask happy users for reviews (the CWS page itself ranks on Google)
2. Directories: Product Hunt launch, AlternativeTo, G2, Capterra/GetApp, SaaSHub, BetaList, Indie Hackers, relevant "awesome" GitHub lists
3. Founder-led content on LinkedIn and X (Sarthak already creates content): build-in-public posts linking to guides
4. Free tools + templates pages → natural links
5. Original data study (see 2.7) pitched to newsletters/journalists (Qwoted, Featured, Connectively-style requests)
6. Guest posts / podcast appearances in sales, recruiting, and founder communities
7. YouTube: demo + "how to" videos embedded on the matching pages (video results appear in Google)
Avoid: bought links, PBNs, mass directory spam. They get new domains penalised.

## 7. Roadmap

**Week 0 (days 1-3)**: deploy, verify, GSC + Bing, CWS listing rewrite, lock site map, decide pricing display.
**Weeks 1-3**: six templates + home redesign + `/pricing` + `/features` + 4 feature pages + 3 comparisons + 3 use-case pages + `/about` + `/security` + `/chrome-extension` + `/changelog`.
**Weeks 3-8**: outreach pillar + 4 spokes; safety pillar + 3 spokes; connection-request generator tool; templates hub + 3 template pages; remaining comparisons; Product Hunt + directories.
**Month 3-4**: lead-gen pillar + spokes; alternatives + "best of" pages; remaining features/use-cases; glossary; start data study.
**Month 4-6**: publish data study; programmatic role templates; refresh pillars; backlink push.
Cadence from week 3: **2 pieces/week** (1 money page or tool, 1 article). Quality over count; each page targets one query.

## 8. KPIs (check weekly in Search Console)
- Brand: "spurly", "getspurly" → #1 within ~3 weeks of indexing
- Indexed pages vs sitemap pages (target 90%+)
- Impressions and clicks per cluster; average position for 20 tracked queries
- Referring domains (target: 10 by month 3, 30 by month 6)
- Chrome installs and signups attributed to organic (UTM on CWS links, `?ref=` on signup)
- AI visibility: appearances in the monthly 20-question test
- Core Web Vitals "good" on all templates

## 9. Open decisions (need Sarthak)
1. Which features are live and OK to market right now (Hub inbox, sequences, audience builder, Insights not yet)?
2. Pricing: public numbers on the page, or "from $X"? (Affects Pricing page and Offer schema.)
3. Positioning: is Spurly "LinkedIn lead capture + outreach CRM" or "LinkedIn automation"? This changes the main keyword set and the compliance tone. Recommendation: lead with **lead capture + outreach tracking** (broader, safer), keep automation in feature pages and safety content.
4. Who writes content: Claude drafts + Sarthak adds real experience/screenshots/numbers (recommended: pure AI text with no first-hand detail ranks poorly and is not cited).
