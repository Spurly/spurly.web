# Spurly Website Content Plan (new product positioning)

> What the public site must say now that Spurly is a cloud LinkedIn outreach automation platform, not just a Chrome extension.
> Sonnet writes every public page from this file. Strategy lives in `SEO_MASTER_PLAN.md`; the URL inventory in `SEO_GROWTH_PLAN.md` is superseded by §4 below.
> Written 2026-10-02. Feature status source: Unipile Plan Tracker (snapshot 1 Oct 2026) + `spurly.web/src/app/routes.jsx`.

## 1. The problem with the current site

The site describes the product as it was in June: a Chrome extension that captures profiles into "Sessions" and sends from your browser.
The product today is **Hub**: you connect your LinkedIn account once, and Spurly runs campaigns, sequences, inbox, network sync and posting
from the cloud, 24/7, with safety pacing. The extension still exists but is now one input, not the product.

Statements on the live site that are now **wrong or risky** (fix first, task T0.1 in the master plan):

| Where | Current text | Problem |
|---|---|---|
| Footer / Hero / Webcam section | "Local-only · your data never leaves your device without you", "100% local — the same privacy promise we give your leads" | **False for Hub**: leads, messages and the LinkedIn session are processed on our servers and through Unipile. A false privacy claim is a legal and trust risk, and contradicts the Privacy page once that is updated |
| HowItWorks / FinalCTA | "capture your first **Session**", "capture every profile into a Session" | Sessions were removed in July 2026 |
| Hero / FinalCTA | "The LinkedIn prospecting & outreach tool that lives in your browser", "One click, right inside your browser", "sent without leaving the tab" | Describes the old model; the main value now is that it runs **without** your browser |
| Pricing section | Three plans: Free $0, $29 / ₹2,399, $99 / ₹8,199, manual USD/INR toggle, "Start free" CTAs | **Wrong prices.** Real plan (Razorpay, `seedRazorpayPlans.js`): one monthly plan, **$24.99** outside India / **₹2,499** in India, 7-day free trial. There is no free plan, so "Start free" is also wrong |
| Privacy page | Written for the extension | Must describe server-side processing, Unipile as a sub-processor, data retention. Needs Sarthak's review |
| Testimonial-style example ("Head of Talent, Northwind Labs") | Invented person and company | Fine as a clearly illustrative mock UI; never present it as a customer quote |

## 2. Positioning

**One line:** Spurly runs your LinkedIn outreach for you: find the right people, connect, follow up and reply from one inbox, on autopilot and at a safe pace.

**Category we compete in:** cloud LinkedIn outreach automation (Expandi, HeyReach, Dripify, Waalaxy, Lemlist's LinkedIn steps, Linked Helper, PhantomBuster).
This **replaces** the earlier recommendation of "lead capture & outreach" as the main pitch; "LinkedIn automation" is now the honest description.

**Differentiators to lead with** (only claims we can show):
1. **Runs in the cloud** — campaigns keep going with the laptop closed (vs extension tools like Waalaxy's browser mode / Linked Helper desktop).
2. **Safety built in** — per-account pacing, pause on reply, action ledger with daily caps, stale invites withdrawn. Phrase as "designed to stay within LinkedIn's limits", **never** "100% safe" or "undetectable" (no tool can promise that, and LinkedIn's User Agreement prohibits automation; say so plainly on the safety page).
3. **Everything LinkedIn in one place** — campaigns, multi-step sequences, unified inbox with attachments and reactions, your network synced, profile viewers, post scheduling, engagement.
4. **Find people from signals, not only searches** — people who view your profile, follow your page, post about a topic, or work at companies that are hiring.
5. **Capture from anywhere** — Chrome extension for one-click capture on LinkedIn / Sales Navigator pages, plus CSV import.

**Tone:** confident, specific, warm-editorial (matches the redesign). Numbers and screenshots over adjectives.

## 3. Feature inventory for marketing

Rule: a feature appears on the site only if its status is **Market now**. "Mention carefully" = may appear with the stated wording limit. Re-check against the tracker before each page ships.

| Feature (customer words) | Product area | Status | Notes / wording limits |
|---|---|---|---|
| Connect your LinkedIn account once (secure hosted login) | M7 hosted auth | Market now | Say "secure connection via our partner"; don't promise "no password" details we haven't confirmed |
| Account health card + reconnect alerts | M1, M7 | Market now (reconnect banner pending live check) | "We tell you the moment LinkedIn needs you to reconnect" once M7 verified |
| Campaigns: connection requests at a safe daily pace, acceptance detected automatically | Hub campaigns, M2 | Market now | |
| Multi-step sequences: invite → wait → message → follow-up, plus visit profile, follow, endorse, like/comment steps | Hub sequences | Market now | InMail step: **don't market** until verified on Premium |
| Pause automatically when someone replies | Safety layer | Market now | |
| Unified inbox: all LinkedIn conversations, reply, reactions, send/receive files and PDFs, new messages in real time | M3 | Market now | No read receipts (LinkedIn doesn't provide them). Voice/video send: don't mention |
| Sent invitations: see and withdraw; auto-withdraw stale invites | M2 | Market now | Auto rules are off by default: "optional" |
| Incoming invitations: accept from Spurly; optional auto-accept rules | M2 | Mention carefully | Decline untested |
| Audience builder: LinkedIn people search with filters | Hub leads / Phase 8 | Market now | Classic search; **not** Sales Navigator search |
| Discover: company search → people at those companies; posts search → import authors; jobs search as a hiring signal | M5 | Market now | |
| Paste any LinkedIn URL to import | M5 | Market now | |
| Your network synced (all 1st-degree connections) | M1 relations | Market now | |
| Profile viewers as leads | M1 viewers | Market now | Free accounts see limited viewers (LinkedIn limit) — say so |
| Followers of you or your company page as an audience | M1 followers | Market now | |
| Company profiles | M1 | Market now (minor) | |
| Posts: schedule text and image posts; see likes and comments; like/comment on leads' posts | M4 | Market now | AI drafts need approval: "you approve every AI comment" |
| Bulk engagement rules | M4 W3 | **Don't market** | Off until circuit breaker exists |
| Email & phone enrichment | Hub enrichment, dashboard/enrich | Market now | Check credit model wording with Sarthak |
| Chrome extension: capture profiles from LinkedIn / Sales Navigator pages, outreach and templates tabs | Extension | Market now | Now a feature page, not the headline |
| CSV import with column mapping | Import | Market now | |
| Message templates with variables, live preview; AI writer | Templates | Market now | Check AI writer is still shipped (leadgen decommission plan) |
| Notifications (connection accepted, enrichment done, etc.) + daily email digest | Notifications | Market now | |
| Acceptance analytics / Insights | Spec only | **Don't market** | |
| InMail | M3 | **Don't market** | Unverified |
| Recruiter / Sales Navigator inboxes and search | M5, M6 | **Don't market** | Not built / excluded |
| Job postings (hiring side) | M8 | **Don't market** | Todo |

## 4. New site map (replaces SEO_GROWTH_PLAN §2 for P0/P1)

Navigation: **Product ▾ · Solutions ▾ · Pricing · Resources ▾ · Log in · Start free**

| Priority | URL | Page job | Primary search target |
|---|---|---|---|
| P0 | `/` | New positioning, hero, 4 pillars, how it works in 3 steps, safety, proof, pricing teaser, FAQ | spurly; linkedin outreach automation |
| P0 | `/pricing` | Plans incl. Hub, credits explained, FAQ | spurly pricing; linkedin automation pricing |
| P0 | `/product/campaigns` | Campaigns + sequences | linkedin automation tool; linkedin drip campaign |
| P0 | `/product/inbox` | Unified LinkedIn inbox | linkedin inbox management |
| P0 | `/product/lead-finder` | Audience builder + Discover (companies, posts, jobs, URL paste) + viewers + followers | linkedin lead generation tool; find leads on linkedin |
| P0 | `/product/safety` | How pacing, caps, reply-pause and ledger work; honest risk statement | is linkedin automation safe; linkedin automation limits |
| P0 | `/product/chrome-extension` | Capture from LinkedIn / Sales Navigator, works with Hub | linkedin chrome extension lead capture |
| P1 | `/product/network` | Network sync, profile viewers, followers, invitations | who viewed my linkedin profile leads |
| P1 | `/product/posts` | Scheduling + engagement | schedule linkedin posts |
| P1 | `/product/enrichment` | Email and phone finder | linkedin email finder |
| P0 | `/solutions/founders`, `/solutions/sales-teams`, `/solutions/recruiters` | Audience pages | linkedin outreach for founders / recruiters |
| P1 | `/solutions/agencies`, `/solutions/job-seekers` | | |
| P0 | `/compare/spurly-vs-expandi`, `-vs-dripify`, `-vs-waalaxy` | Honest comparison, cloud vs extension | expandi alternative etc. |
| P1 | `-vs-heyreach`, `-vs-linked-helper`, `-vs-phantombuster`, `-vs-lemlist`; `/alternatives/*`; `/best/linkedin-automation-tools` | | |
| P0 | `/about`, `/security` (data handling, Unipile, encryption, retention) | Trust / E-E-A-T | |
| P1 | `/changelog` | Shows momentum; the tracker gives months of real entries | |
| keep | `/blog/*` (3 posts: update intros + CTAs to Hub), `/support`, `/privacy` (rewrite), `/terms` (review) | | |
| P1+ | `/tools/*`, `/templates/*`, `/glossary/*` | As in SEO_GROWTH_PLAN §2.5–2.8 | |

Old URLs: none of the current public URLs change, so no redirects are needed.

## 5. Decisions (Sarthak, 2026-10-02)

| Decision | Value |
|---|---|
| Hero line | **"LinkedIn outreach that runs itself."** |
| Plan | One plan, monthly. **$24.99/month** outside India, **₹2,499/month** in India |
| Trial | **7-day free trial** in both regions, one per account |
| Region | Detected from the visitor's IP (same logic as billing: `spurly.backend/src/shared/utils/geo.js`, fast-geoip). Billing region is fixed on the account once they subscribe |
| Webcam "see yourself" section | **Removed.** Replaced by a product explainer video |
| CTA wording | "Start 7-day free trial" (primary) · "Watch the 2-min demo" (secondary). Never "Start free" / "Free plan" |

**Trial payment (decided 2026-10-03): a card or UPI is required to start the trial.** Exact copy to use everywhere the trial is mentioned (hero micro-line, pricing card, FAQ, signup):

> *"Add a card (or UPI in India) to start your 7-day free trial. You won't be charged until day 8. Cancel anytime before then and you pay nothing."*

Rules for this copy:
- Never say "no credit card required" anywhere (the old extension-era copy did; remove it in T0.1).
- Always show the price next to the trial: "7-day free trial, then $24.99/month" (or ₹2,499/month).
- "Cancel anytime" must link to how (Settings → Billing → Cancel); access runs to the end of the paid period.
- Don't promise a reminder email before day 8 until one exists (no trial-ending email found in spurly.backend on 2026-10-03; see task T1.12).

## 5a. How regional pricing works on the public site (task T1.10)

Prerendered HTML is static, so price can't be decided on the server per visitor. The pattern:

1. **Prerendered default = USD** ($24.99). Googlebot crawls mostly from the US, so what Google indexes matches what US visitors see. That is localisation, not cloaking, and is allowed.
2. **After hydration**, the pricing component calls a new **public** endpoint `GET /api/public/region` → `{ region: "IN" | "INTL" }` (no auth, reuses `regionFromIp`, `Cache-Control: private, max-age=86400`). The existing `/api/subscriptions/pricing` needs login, so it can't be used here. Controller-layer error handling only; on failure, keep USD.
3. India → show **₹2,499/month** and a line "Prices shown in INR for India". Everyone else → **$24.99/month**.
4. **No manual currency toggle** (remove the old one): checkout charges by the backend's region anyway, so a toggle could show a price the visitor can't pay. If someone is on a VPN, the checkout page shows the real price before payment.
5. GA4: send `user_region` (`IN`/`INTL`) as an event parameter on `add_to_chrome_click`, `sign_up`, `begin_checkout`, so conversions can be split by market.
6. **Structured data** (`SoftwareApplication` on `/` and `/pricing`): two `Offer`s, `{price: "24.99", priceCurrency: "USD"}` and `{price: "2499", priceCurrency: "INR", eligibleRegion: "IN"}`, plus `priceSpecification` with `billingDuration: P1M`, and mention the 7-day trial in the description. Only real prices, updated if Razorpay plans change.

## 5b. Home page outline (P0, write first)

Sections in order. Each line = purpose · content · SEO/GEO note.

1. **Hero.** H1 "LinkedIn outreach that runs itself." Sub (1 sentence): find the right people, connect, follow up and reply from one inbox, from the cloud, at a safe pace. CTAs: *Start 7-day free trial* / *Watch the 2-min demo* (scrolls to 2). Micro-line under CTAs: "$24.99/month after the trial · cancel anytime" (region-aware). Visual: 3D hero + a real campaign screen.
2. **Product explainer video** (replaces the webcam section). 90–120 s, Sarthak records: connect → build audience → launch sequence → reply in inbox. Hosted on **YouTube** (ranks in YouTube and Google video results) and embedded with a **click-to-load facade** (thumbnail + play button; the iframe loads only on click, so LCP is untouched). Under it: chapter list with timestamps and a collapsible **transcript** (text Google and AI engines can read). `VideoObject` structured data (name, description, thumbnailUrl, uploadDate, duration, embedUrl).
3. **"Works with" strip.** LinkedIn (free and Premium) · Sales Navigator pages (via the extension) · CSV · Chrome. Facts only, no fake customer logos.
4. **The problem.** Short: manual LinkedIn outreach means hours of copy-pasting, forgotten follow-ups and replies lost across tabs. 3 pain points → 3 answers. No invented statistics.
5. **Four pillars** (cards, each links to its product page): Find the right people · Automate connect and follow-up · One inbox for every conversation · Safety built in.
6. **How it works** (4 numbered steps with small screenshots): Connect LinkedIn securely · Build an audience · Launch a sequence · Reply from one inbox. Answer-first, good for featured snippets.
7. **Feature tour** (tabbed: Campaigns & sequences · Inbox · Lead finder · Network & viewers · Posts). Each tab: 2-sentence explanation + real screenshot + "Learn more →" to its product page. All tab text is present in the prerendered HTML (hidden tabs are still in the DOM, not loaded on click).
8. **Signals: reach people when they're interested.** Profile viewers, people posting about your topic, companies that are hiring, followers of your page. Strong differentiator; links to /product/lead-finder.
9. **Safety.** Daily caps per account, human-like pacing, pause on reply, stale invites withdrawn, action log. Honest line: "No tool can guarantee LinkedIn won't restrict an account; Spurly is designed to stay well inside LinkedIn's limits." Link to /product/safety.
10. **Cloud vs browser-extension tools** (comparison table, generic, no competitor names here): runs with laptop closed · one inbox · multiple steps · safe pacing · works without keeping a tab open. Highly quotable by AI answers; feeds the /compare pages.
11. **Chrome extension** (short block): "Prefer capturing as you browse? The Spurly extension saves profiles from LinkedIn and Sales Navigator pages straight into Hub." Add-to-Chrome button (tracked `add_to_chrome_click`).
12. **Who it's for** (4 cards → /solutions/*): Founders · Sales teams · Recruiters · Agencies. One concrete workflow line each.
13. **Pricing** (single plan card, region-aware): price, "7-day free trial", everything-included list (all *Market now* features from §3), CTA, link to /pricing for FAQ.
14. **Built by** (founder note, E-E-A-T): Sarthak's photo, 2–3 sentences on why Spurly exists, link to his LinkedIn. Real person = trust for Google, AI engines and buyers.
15. **Proof** (hidden until real): customer quotes with name, role, photo and permission. Until then, show product facts instead (e.g. "Syncs your full network, 847 connections in one test account"). Never fabricated reviews.
16. **FAQ** (8–10, answer-first, also on /pricing where relevant): Is LinkedIn automation safe? · Does it work with a free LinkedIn account? · Do I need Sales Navigator? (no) · Does it run when my laptop is off? (yes) · How many connection requests per day? · What data do you store and where? · What happens after the 7-day trial? (card/UPI charged on day 8 unless cancelled) · Do I need a card to start the trial? (yes) · Can I cancel anytime? · Why is the price different in India? · Do I still need the Chrome extension? (optional)
17. **Final CTA.** "Start your 7-day free trial", with the price line.

Removed from the current home: webcam section, three-plan pricing, all "local / in your browser / Session" copy.

## 5c. Pricing page outline (`/pricing`, P0)

H1 "Simple pricing: one plan, everything included" · region-aware plan card ($24.99 / ₹2,499 per month, 7-day free trial) · full feature list grouped by pillar · "How the trial works" (3 steps: add a card or UPI → use everything for 7 days → billed on day 8 unless you cancel; exact copy in §5) · "Why is pricing different in India?" (one honest sentence: local pricing in INR) · payment methods (Razorpay: cards, UPI for India; confirm list) · FAQ (cancel, refunds, invoices/GST for India, currency, what counts toward limits) · CTA. Target searches: "spurly pricing", "linkedin automation tool pricing", "affordable linkedin automation".

## 6. Template for every product page

H1 = outcome ("Run LinkedIn campaigns that follow up for you") · answer-first intro (2–3 sentences) · screenshot/GIF · 3–5 capabilities, each one heading + 2 sentences + image · "How it works" numbered steps · safety note where relevant · related features (internal links) · FAQ (4–6) · CTA. 800–1,200 words. One target search in title (≤60 chars) and description (≤155).

## 7. Order of work (maps to versions in SEO_MASTER_PLAN §7: item 1 + 2b = v1, items 3–6 = v2)

1. **T0.1 (now, before any SEO push):** remove the false "local-only / 100% local / never leaves your device" claims and "Session" wording site-wide; soften "lives in your browser"; **remove the Webcam section**; **replace the 3-plan pricing with the single $24.99 / ₹2,499 plan and 7-day trial**, and change "Start free" CTAs to "Start 7-day free trial". Ship same day.
2. ~~Sarthak decides~~ All decided (§5): pricing, hero, webcam removal, card/UPI required for the trial.
2b. **T1.10** public region endpoint + region-aware price display (§5a). **T1.11** explainer video section with facade + transcript + VideoObject (after Sarthak records the video).
3. Home page rewrite (§5) inside the redesign templates.
4. /pricing, 5 P0 product pages, /security, /about.
5. 3 solutions pages, 3 comparisons.
6. Privacy policy rewrite (Sarthak + legal review), then P1 pages.

Screenshots: every product page needs 1–3 real screenshots from the app (Sarthak captures, Sonnet places). No mock data that looks like real customers.
