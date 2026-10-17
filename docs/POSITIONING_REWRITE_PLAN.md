# Positioning rewrite: "AI SDR for LinkedIn" (living plan)

Created 2026-10-17. Update this file at the end of every page / work session so any chat can resume from it.
Scope: CONTENT, POSITIONING and SEO/GEO of the public site. The UI (colors, fonts, "AI look") is a separate later plan.

## Status (keep current)
- Last updated: 2026-10-17 (session 5, executor)
- Phase: EXECUTING. Batches 1-2 approved. Batches 3-25 ALL BUILT (2026-10-17, on Sarthak's "complete entire plan in one go") and waiting for review. Remaining by hand: Batch 0 (GA cleanup) and Batch 26 (off-site listings). Batch 0 (GA cleanup) is still Sarthak's manual task.
- Next action: Sarthak reviews the built pages in the browser (order: /product/*, /solutions/*, /compare/*, /glossary/ai-sdr, /glossary/intent-signals, blog quick wins), then commits and pushes. Then Batch 0 and Batch 26.
- Planned in Opus, executed in Sonnet (Sarthak, 2026-10-17). The executor follows section 10 literally; anything not covered there goes back to Sarthak, not improvised.
- Workflow per page (Sarthak, 2026-10-17): Claude writes "this page says X now -> change to Y" here -> Sarthak reviews -> Claude edits -> Sarthak reviews -> push to prod.

## 0. End goal (how we know this plan worked)
- Baseline (Sarthak, 2026-10-17): **0 customers, 0 real sign-ups**. GA shows 2 key events in 28 days and ~45 /signup views, but those are Sarthak's own tests.
- Goal 1 (first 30 days after the home rewrite ships): **first 10 real trial sign-ups, first 3 paying customers.**
- North star after that: **paying customers who arrived through the website**. Copy and SEO are only means.
- Measured as a funnel, every week: visitors -> /signup visits -> trials started -> paid on day 8.
- Targets to confirm with Sarthak (set after baseline is measured):
  - 90 days: visitor -> trial >= 3% on the home page (today unknown, needs a GA4 key event); non-brand Search Console clicks from ~0 to 50+/week; home and 5 product pages indexed and in the top 20 for their target query; Spurly appears in AI answers for "AI SDR for LinkedIn" / "Claude LinkedIn MCP".
  - 6 months: website is a steady source of trials without Sarthak posting links (Organic + AI referrals > Direct).
- Measurement: the web app already sends `sign_up` (core/auth/controller/auth.js) and `begin_checkout` (core/billing/controller/subscriptions.js) to GA4. Sarthak to confirm both are marked as Key events in GA4 Admin. Trial-started and paid counts come from the backend/admin dashboard.

## 1. Why we are doing this
- The current landing pages get no leads. The 2026-10-05 positioning (category "LinkedIn automation", H1 "Get leads from LinkedIn on autopilot", spec claude/home_positioning_v3_spec.md) is SUPERSEDED by this plan (Sarthak, 2026-10-17).
- Competitors win attention with different words, not more features. Spurly has more features (profile viewers, followers, enrichment, send AND receive invitations, auto-accept, auto-withdraw, posts, inbox, Claude/MCP, extension, CSV).
- Sarthak's input (2026-10-17): wants Spurly positioned as an AI product ("AI SDR", "AI agent", "intent signals", "ICP", "AI-personalized outreach"), like Beeze, lemlist, LeadWoo. Wants the pages to push every visitor to start a trial.

## 2. Traffic today (what the rewrite has to work with)
- GA4, last 7 days to 2026-10-17: ~38 users. India 19, United States 12, Singapore 3, Canada 1, Spain 1, Colombia 1, UAE 1.
- GA4 last 28 days (from SEO_MASTER_PLAN): 98 sessions = Direct 77, Referral 14, Organic 6, Social 1. Most visitors come from Sarthak's own links/posts, not from Google.
- Search Console (Domain property getspurly.com), 7 days 08-14 Oct 2026: **3 clicks, 191 impressions, CTR 1.6%, average position 61.4**, 78 queries.
  - Only clicks: "spurly" (3 clicks / 15 impressions).
  - Every other query is INFORMATIONAL and served by blog/glossary/templates pages: inmail / what is inmail (~20 impr. across variants), linkedin connection request message / templates / examples / samples (~35), linkedin cold message template, follow up template, ICP meaning / what is an icp / icp stands for (~15), linkedin social selling index, linkedin account restricted, linkedin (weekly) connection request limit 2026, is linkedin automation safe, linkedin focused inbox.
  - Competitor queries we already show for: dripify cost, dripify pricing plans, waalaxy pricing, "waalaxy", waalaxy subscriptions, phantombuster vs dripify, phantombuster alternative(s).
  - One query no one else owns: **claude linkedin mcp** (1 impression).
  - ZERO impressions for: linkedin automation tool, ai sdr, linkedin ai sdr, linkedin outreach tool, linkedin lead generation tool. Our money pages do not rank at all yet.
- Conclusion: two separate jobs.
  1. CONVERSION: the ~40 people/week who already land (mostly direct) must understand in 5 seconds that Spurly is an AI SDR and start a trial. This is the copy rewrite (sections 5-6).
  2. SEO/GEO: get found. "ai sdr" alone is owned by 11x, Artisan, Salesforge, AiSDR and big listicles; the home page will not rank for it soon. We win the long tail first (section 4).

### 2.1 Three-month exports (received 2026-10-17)
- Search Console, last 3 months: 9 clicks, 253 impressions. Home `/` ranks 2.75 for "spurly" and gets 8 of the 9 clicks. United States: 164 impressions at position 68, 0 clicks. India: 28 impressions, 9 clicks (brand).
- Average position is getting worse (2 -> 78) because Google is now testing our new pages for broad queries at the back of the results. Normal for a young site; it means the pages are indexed, not that they are good enough yet.
- Pages closest to page 1 (position 10-35) = quickest SEO wins: blog/what-gets-linkedin-accounts-restricted (13), blog/free-linkedin-outreach-pipeline-founders (14), blog/personalize-linkedin-connection-requests (18), blog/linkedin-account-warm-up (19), product/lead-finder (29), blog/is-linkedin-automation-safe (31), blog/linkedin-weekly-invitation-limit (32), blog/linkedin-account-restricted-what-to-do (34).
- Pages with the most impressions but buried (position 68-90): blog/linkedin-connection-request-examples (32 impr.), compare/spurly-vs-dripify (27), glossary/inmail (25), glossary/icp (19), templates (11).
- Best BUYER-intent cluster we already touch: **Dripify pricing** ("dripify pricing plans", "dripify cost", "how much is dripify", "dripify price", ~19 impressions) + waalaxy pricing + expandi + phantombuster alternatives. People pricing a competitor are ready to buy a tool; these pages must lead with the answer and then with Spurly's price.
- Generative AI report: 1 impression in 3 months (solutions/sales-teams). GEO presence is effectively zero.
- Links report: still "processing" (Domain property is new). Recheck in a few days.
- GA4, 28 days to 2026-10-16: 314 sessions (Direct 227, Referral 30, Organic Search 27, Organic Social 27). New users: Direct 133, Organic Social 24, Organic Search 11. Day-7 retention ~0.
- **GA is polluted by Sarthak's own use of the app.** Top "page" is "Spurly — LinkedIn Lead Capture & Outreach Chrome Extension" (2,690 views; that is index.html's default title, i.e. app pages), then Inbox, Dashboard, Admin. Real website views in 28 days: home ~210 (two old titles), pricing 33, founders 12, recruiters 11, compare pages ~14, blog ~30.
  - Fix 1: in every GA report filter **Content group = website** (analytics.js already tags it).
  - Fix 2: GA Admin > Data streams > Configure tag settings > Define internal traffic (Sarthak's IP), then activate the "Internal traffic" data filter. Also exclude test accounts from the admin sign-up count.
  - Fix 3: confirm `sign_up` and `begin_checkout` are Key events.

## 3. Competitor wording (researched 2026-10-17)
| Product | Eyebrow / category | H1 | Words they repeat | Price |
|---|---|---|---|---|
| Beeze (beeze.ai) | "AI Agent for LinkedIn Outreach" | "Capture & Contact High-Intent Leads on LinkedIn" | AI agent, ICP, intent signals, warm leads, hyper-personalized, 24/7, book calls | $79-$159/mo |
| lemlist | "Let AI handle it" | "The only platform you need to make Outbound work." | outbound, ICP, high-intent, intent signal agents, "know who to target and why now", personalize, multichannel | - |
| Valley (joinvalley.co) | "For founders, sales teams and agencies" | "Unbelievably good outbound. To people who actually want it." | signal, "in your voice", relevant, research, real conversations; steps Find/Qualify/Research/Write/Send | $149-$199/seat |
| HeyReach | none | "10x your LinkedIn outbound. Unlimited senders, one fixed cost" | LinkedIn outbound, warm leads, book more meetings, unified inbox, "turn signals into pipeline" | - |
| SalesRobot | "Two-in-one LinkedIn and cold email automation tool" | "Message 100s of people on LinkedIn and cold email. Every Week. Automatically." | AI appointment setter, AI inbox manager, safest, reply rate, MCP/API/CLI | - |
| LeadWoo | leadwoo.com is a parked domain for sale; could not read their page. Sarthak to send the right URL if we want it. | | | |
- Pattern: (a) say WHO you reach ("high-intent", "people who actually want it"), (b) say WHY NOW (signals), (c) AI does the writing "in your voice", (d) outcome word: pipeline / meetings / conversations, (e) "outbound" more than "automation".
- Their weaknesses we can beat honestly: Beeze has no proof and a thin feature set; Valley is $149+/seat; none of them lead with Claude/MCP; few offer inbound-invitation rules.
- Note: Spurly's price ($24.99) is 3-8x cheaper. That is a headline-worthy fact, use it.

## 4. SEO + GEO plan (so the new words also rank)
Keyword volumes below are NOT validated. Check each cluster in Google Keyword Planner (free) before building a new page; keep using Search Console weekly.

### 4.1 Keyword set by page
| Page | Primary query | Secondary queries |
|---|---|---|
| Home `/` | ai sdr for linkedin | linkedin ai sdr, ai linkedin outreach, linkedin automation tool, linkedin ai agent |
| `/product/lead-finder` | linkedin intent signals | find high intent leads linkedin, linkedin profile viewers leads, linkedin lead finder (we already show) |
| `/product/campaigns` | ai linkedin outreach | ai personalized linkedin messages, linkedin outreach sequence |
| `/product/inbox` | linkedin unified inbox | linkedin focused inbox (we already show) |
| `/product/ai-assistants` | claude linkedin mcp | linkedin mcp server, linkedin ai assistant |
| NEW `/product/invitations` (optional) | auto accept linkedin invitations | auto withdraw linkedin invitations, linkedin pending invitations |
| `/compare/*`, `/alternatives/*` | dripify pricing, waalaxy pricing, phantombuster alternative | "X vs Y", "X alternative" (we already show) |
| glossary | what is an icp, what is an ai sdr (new), what are intent signals (new), what is inmail | |
| templates/blog | linkedin connection request message examples, linkedin follow up template, linkedin weekly connection limit 2026 | |

### 4.2 Actions (ordered by what pays first)
1. **Money-page titles/descriptions** carry the new words AND the old ranking words ("AI SDR" + "LinkedIn automation"). Title <= 60, description <= 155, one target query per page (SEO_MASTER_PLAN section 7).
2. **Push the pages that already get impressions to page 1** (avg position 61 = page 7). For inmail, connection-request templates, ICP, connection limits, SSI, dripify/waalaxy/phantombuster pages: answer in the first 2 sentences, add a FAQ block, add the year where it is a "2026" query, link to them from the home page and from each other.
2b. **Fix the 8 pages already at position 10-35 first** (section 2.1): they are one good edit from page 1. Then the Dripify/Waalaxy/Expandi pricing pages (buyer intent).
3. **Every informational page converts**: a short "Do this automatically with Spurly's AI SDR" box + trial CTA after the first answer. Today those 190 impressions lead nowhere.
4. **Own "claude linkedin mcp"** now, while nobody does: retitle `/product/ai-assistants` around it.
5. **New glossary pages**: "What is an AI SDR?", "What are intent signals on LinkedIn?". These are the exact questions AI answer engines get; a clean definition gets quoted (GEO).
6. **GEO basics**: one quotable definition sentence used everywhere (section 5); FAQPage JSON-LD on home and product pages (exists, update text); update scripts/llmsTxt.mjs; SoftwareApplication JSON-LD with price.
7. **Off-site (biggest GEO lever)**: AI answers about "best AI SDR for LinkedIn" cite listicles (salesrobot.co, getfuzzy.ai, joinvalley.co, 11x.ai, salesforge.ai blogs). Get Spurly onto lists like these, plus Product Hunt, G2, Capterra, AlternativeTo, SaaSHub, with the same one-line description.
8. **Brand**: we are still not a clean #1 for "spurly" (S0.7 in SEO_MASTER_PLAN).
- Data still wanted from Sarthak: Search Console > Performance > **Pages** tab (which URLs get the impressions) and the **3-month** Queries export (CSV). That decides which existing pages to fix first.

## 5. New positioning (final)
- Category label: **AI SDR for LinkedIn**. Keep "LinkedIn automation" in titles/meta/body for SEO.
- One-sentence definition (reuse everywhere: Hero, homeFaq, structuredData, seo.js ORGANIZATION_LD, Footer, llmsTxt):
  > **Spurly is an AI SDR for LinkedIn: it finds high-intent leads that match your ICP, writes personalized messages with AI and follows up until they reply, while you approve every message.**
- Promise: define your ICP -> Spurly finds the people and the warm ones (signals) -> AI writes, Spurly sends and follows up -> you reply from one inbox or from Claude.
- Differentiators to push: warm-lead signals (viewers, followers, post authors, hiring companies, inbound invitations), Claude/MCP, invitation autopilot (auto-accept by headline keywords, auto-withdraw stale), enrichment (email + phone), price, control.
- Primary audience: founders and small B2B sales teams ("an AI SDR instead of hiring one"). Recruiters/agencies stay on /solutions/*.

### Vocabulary: use in bulk
AI SDR, AI agent, ICP / define your ICP, intent signals, warm leads, high-intent, AI-personalized outreach, in your voice, pipeline, outbound, conversations, book meetings (as the goal, not as an automatic action).

### Claim rules: only what ships today (Sarthak: "do not lie")
OK to claim (verified in code 2026-10-17 where marked):
- Define an ICP via audience filters, company search, post authors, pasted URLs, CSV.
- "Intent signals" = what the lead finder surfaces: people posting on a topic, companies hiring, profile viewers, followers of you or your company page, your network, people who invite you. No automatic scoring.
- Auto-accept incoming invitations (all, or when the inviter's headline matches keywords) and auto-withdraw invitations after N days. Verified: spurly.backend src/products/hub/invitations/service/rules.js.
- AI writes one personalized template (tokens fill per lead) and drafts comments; user reviews and approves.
- Multi-step sequences (visit, connect, message, follow, like, comment, wait), stop on reply, one inbox, cloud (runs with laptop closed).
- Email and phone enrichment.
- **24/7** (corrected 2026-10-17, Sarthak + Settings > Sending hours): campaigns and sequences run around the clock, weekends included, with uneven human-like gaps. Replies land in the inbox the moment they arrive, day or night. OK to say "runs 24/7", "works while you sleep".
- **Your hours, your pace** (market as its own feature): "Slow down overnight" toggle, user-chosen quiet window (e.g. 22:00-08:00 in the user's timezone, edges shift daily), sends ~4x further apart while quiet; "stop a person the moment they reply"; "skip anyone contacted in the last 30 days" across campaigns. Sarthak wants per-user customisation of running hours marketed separately.
- Claude/MCP: read, draft, act (act is off by default, passes the same limits). Claude can triage replies and DRAFT answers for approval.
NOT OK until built:
- "Scores every profile / keeps the top 10%" (only a plan: claude/discover_posts_relevance_plan.md).
- "AI replies / handles objections / books meetings automatically" (no auto-reply exists in the backend; Claude drafts, the user approves).
- Invented ratings, user counts, logos, testimonials, case-study numbers.
- Safety: keep "no tool can promise zero risk"; frame tone as control.

## 6. PAGE 1: HOME, current -> proposed (FINAL: use Option A H1, see section 9)
Proposed section order: Hero -> LogoCloud -> HowItWorks -> **Signals (new on home; component exists unmounted)** -> FeatureTour -> ClaudeSection -> Solutions -> Pricing -> FAQ -> FinalCTA.
(Current: Hero, LogoCloud, HowItWorks, FeatureTour, ClaudeSection, Solutions, Pricing, FAQ, FinalCTA.)

### 6.1 SEO tags (HomePage.jsx <Seo>)
| | Current | Proposed |
|---|---|---|
| title | Spurly: LinkedIn Automation Tool for Lead Generation | **Spurly: AI SDR & LinkedIn Automation Tool** (41 chars) |
| description | Spurly finds your ideal prospects on LinkedIn, writes personal messages with AI and follows up automatically. For founders and sales teams. 7-day free trial. | **Spurly is an AI SDR for LinkedIn. It finds high-intent leads that match your ICP, writes personalized outreach with AI and follows up. 7-day free trial.** (~150) |

### 6.2 Hero (components/Hero.jsx)
| Element | Current | Proposed |
|---|---|---|
| Chip | LinkedIn automation for founders and sales teams | **AI SDR for LinkedIn, built for founders and B2B sales teams** |
| H1 | Get leads from LinkedIn / *on autopilot.* | **Option A (recommended):** Find high-intent leads on LinkedIn. / *Let your AI SDR do the outreach.* <br>Option B: Your AI SDR for LinkedIn. / *Working 24/7, in your voice.* <br>Option C: Turn LinkedIn intent / *into real conversations.* |
| Lead | Spurly is a LinkedIn automation tool that finds your ideal prospects, writes personal messages with AI and follows up automatically, stopping when they reply. You approve every message. | **Spurly is an AI SDR for LinkedIn. Tell it your ICP and it finds the right people, spots the warm ones (profile viewers, new followers, people posting about your topic, companies hiring), writes personalized messages with AI and follows up until they reply. It runs 24/7 in the cloud, and you approve every message.** |
| Primary CTA | Start 7-day free trial | keep |
| Secondary CTA | See it in action | **See how it works** (#how) |
| Micro line | 7-day free trial, then {price}/month. Card or UPI to start, nothing charged until day 8. Cancel anytime. | keep |

### 6.3 LogoCloud (components/LogoCloud.jsx)
| | Current | Proposed |
|---|---|---|
| Label | Works with the accounts and files you already have | **Plugs into what you already use** |
| Pills | LinkedIn free and Premium · Sales Navigator pages · CSV import · Chrome extension | LinkedIn free and Premium · Sales Navigator pages · **Claude (MCP)** · CSV import · Chrome extension |

### 6.4 How it works (components/home/HowItWorks.jsx)
| | Current | Proposed |
|---|---|---|
| H2 | Three steps from a search to *a conversation.* | **Your AI SDR, *live in three steps.*** |
| Lead | Spurly runs LinkedIn outreach in three steps: connect your account, launch an AI-written sequence and reply from one inbox. | **Define your ICP, let AI write and run the outreach, and step in when someone replies.** |
| Step 1 | Connect LinkedIn securely: Sign in once... nothing to install. | **Define your ICP.** Connect LinkedIn once, with nothing to install. Describe who you sell to with filters such as title, company and location, or start from target companies, post authors, profile viewers or a CSV. |
| Step 2 | Pick an audience, launch a sequence: Search with filters... AI drafts the connection note and follow-ups, and you approve them. | **AI writes and runs the outreach.** AI drafts a personalized connection note and follow-ups in your voice. You approve them once, then Spurly visits profiles, connects, messages, likes and follows up on schedule at a safe pace. |
| Step 3 | Reply from one inbox: Spurly connects, waits for the accept and follows up... | **You take the warm conversations.** When someone replies, their sequence stops and the chat lands in one inbox. Answer there, or ask Claude to sort replies and draft answers for you to approve. |

### 6.5 Signals (components/home/Signals.jsx, ADD to HomePage)
| | Current (unused component) | Proposed |
|---|---|---|
| Eyebrow | Signals | **Intent signals** |
| H2 | Reach people *when they're interested.* | **Start with warm leads, *not cold lists.*** |
| Lead | Most tools start from a search... | **A cold list gets ignored. Spurly starts from people who already showed interest in you or in the problem you solve.** |
| Card 1 | People who viewed your profile | **Viewed your profile**: They already checked you out. Reach them while you are still on their mind. |
| Card 2 | People who follow you or your page | **Follow you or your company page**: Followers know who you are. They are your warmest audience. |
| Card 3 | People posting about your topic | **Posting about your topic**: Find people talking about the problem you solve and add them to a campaign. |
| Card 4 | Companies that are hiring | **Hiring for the job you help with**: An open role means a real need and a budget. |
| Link | See the lead finder → | **See every intent signal →** |
(Alt card 4 if preferred: "Invited you: auto-accept invitations whose headline matches your ICP.")

### 6.6 Feature tour (components/home/FeatureTour.jsx)
| | Current | Proposed |
|---|---|---|
| Eyebrow | What you get | **What your AI SDR does** |
| H2 | Everything from first search to *first reply.* | **Every SDR job on LinkedIn, *in one tool.*** |
| Tab 1 | Campaigns and sequences | **AI campaigns and sequences**: AI writes a personalized connection note and follow-ups for your ICP, and you approve them. Spurly combines visit, connect, message, follow, like, comment and wait, sends each step at a safe daily pace and stops when someone replies. |
| Tab 2 | Inbox | **Unified inbox**: Every LinkedIn conversation in one list, with replies from your campaigns on top. Reply, react and send files and PDFs as messages arrive. |
| Tab 3 | Lead finder | **ICP lead finder**: Filtered LinkedIn search, company search, post authors, pasted URLs and CSV all feed one audience. Hiring companies and posts on your topic point to people with a reason to talk. |
| Tab 4 | Network and viewers | **Warm leads**: Your network is synced, and profile viewers and followers of you or your company page become an audience in one click. |
| Tab 5 (NEW, Settings > Sending hours screenshot) | - | **24/7, on your terms**: Spurly works around the clock with uneven, human-like gaps. Choose quiet hours and it slows right down overnight instead of stopping. It stops a person the moment they reply and skips anyone contacted in the last 30 days. |
| Tab 6 (NEW, no screenshot) | - | **Invitations and enrichment**: Auto-accept incoming invitations from people whose headline matches your keywords, auto-withdraw invitations nobody accepted, and find work emails and phone numbers for your leads. |

### 6.7 Claude section (components/home/ClaudeSection.jsx)
| | Current | Proposed |
|---|---|---|
| Eyebrow | Works with Claude | **Works with Claude** (keep) |
| H2 | Run your outreach *from a Claude chat.* | **Talk to your AI SDR *in Claude.*** |
| Lead | Connect Spurly to Claude and ask for what you need. Review your results, triage replies and plan the next campaign without opening a dashboard. | **Connect Spurly to Claude through MCP and manage outreach in plain language: check results, sort replies, draft answers and plan the next campaign, without opening a dashboard.** |
| Points / chat | 4 points + example chat | keep (already honest) |

### 6.8 Who it's for (components/home/Solutions.jsx)
| | Current | Proposed |
|---|---|---|
| H2 | Built for people who *live in outbound.* | **An AI SDR for everyone *who sells on LinkedIn.*** |
| Lead | Spurly is built first for founders and small sales teams who want pipeline without hiring an SDR. Recruiters use it too. | **Built first for founders and small B2B sales teams who want an SDR's pipeline without an SDR's salary. Recruiters use it too.** |
| Founders | Fill your pipeline without an SDR / Define one sharp audience... | **Pipeline without hiring an SDR** / Your AI SDR finds warm leads, writes and follows up while you build the product. You step in when someone replies. |
| Sales teams | Keep every rep's outreach steady | **An AI SDR next to every rep** / Each rep runs AI-written sequences from their own LinkedIn account and works replies in one inbox. |
| Recruiters | From a role to a shortlist | keep |

### 6.9 Pricing (components/Pricing.jsx + planFeatures.js)
| | Current | Proposed |
|---|---|---|
| H2 | One plan. *Everything included.* | **An AI SDR for *{price}/month.*** |
| Lead | 7-day free trial, then {price}/month. No tiers to compare. | **Everything included, no tiers to compare. Less than a day of an SDR's salary.** (check the claim reads OK in INR too) |
| Bullets | starts "Campaigns and multi-step sequences..." | Lead with: "AI-written, personalized messages and sequences" · "Intent signals: profile viewers, followers, post authors, hiring companies" · "Auto-accept and auto-withdraw invitations" · "Works with Claude (MCP)", then the existing list |

### 6.10 FAQ (components/home/homeFaq.js; drives FAQPage JSON-LD)
- "What is Spurly?" -> rewrite the first sentence to the one-sentence definition (section 5); keep the rest.
- NEW "What is an AI SDR?" -> "An AI SDR (AI sales development rep) does the top-of-funnel work a human SDR does: finds people who match your ideal customer profile, writes personalized outreach and follows up until they reply. Spurly does this on LinkedIn, and you approve every message before it goes out."
- NEW "What are intent signals?" -> "Intent signals show that someone may be ready to talk: they viewed your profile, follow you or your company page, posted about the problem you solve, invited you, or work at a company hiring for a related role. Spurly turns each of these into a list you can reach."
- NEW "Does Spurly run 24/7?" -> "Yes. Campaigns and sequences run around the clock from Spurly's servers, weekends included, with uneven gaps like a person's. You can set quiet hours, and Spurly slows right down overnight instead of stopping."
- NEW "Can Spurly reply to leads for me?" -> "Not on its own. When someone replies, their sequence stops and the chat waits in your inbox. If you connect Claude, it can sort replies and draft answers, and you approve each one before it is sent."
- "How does Spurly use AI?" -> add "in your voice" and the Claude line.
- Keep safety, Sales Navigator, card, cancel, data, India price.

### 6.11 Final CTA, Nav, Footer, Mobile menu
| | Current | Proposed |
|---|---|---|
| FinalCTA H2 | Get leads from LinkedIn, *on autopilot.* | **Put your AI SDR *to work today.*** |
| FinalCTA lead | Connect your LinkedIn account, build an audience and launch your first campaign in minutes... | **Define your ICP, approve your first AI-written sequence and launch in minutes. 7-day free trial, then {price}/month.** |
| Nav | Features · How it works · Who it's for · Pricing · Blog | Features · **Intent signals** (#signals) · How it works · Pricing · Blog |
| Footer blurb | LinkedIn automation for lead generation. Spurly finds your ideal prospects... | **AI SDR for LinkedIn. Spurly finds high-intent leads, writes personalized messages with AI and follows up until they reply, from the cloud at a safe pace.** |

### 6.12 Files that must change together with the copy
structuredData.js (SOFTWARE_LD + HowTo steps), seo.js ORGANIZATION_LD, scripts/llmsTxt.mjs SUMMARY, tests/website.assets.test.js (~45-48), tests/llmsTxt.test.js (line 11). Run `npm run content` only if .md changed. Sarthak runs tests in his terminal (baseline: 12 hub test failures + 7 lint:arch errors pre-exist).

## 7. Constraints from the codebase
- Content pages are .md in src/products/pages/website/content/ (frontmatter: title, description <=155, seoTitle <=60, faq, ...). Rules: content/README.md, docs/SEO_MASTER_PLAN.md section 7.
- Visible FAQ text must equal FAQPage JSON-LD (homeFaq.js drives both). Public pages must not touch window/document during render (prerender).
- Rules: function-based JS, no classes; try/catch only in controllers; no commits unless asked; GIT_OPTIONAL_LOCKS=0, no stash, no branch switching.

## 8. Page-by-page tracker
Status: [ ] todo, [~] drafted for review, [x] done.

### 1. Home
- [x] Batch 1 approved 2026-10-17; applied to src/ on 2026-10-17 (all sections of section 6 + structured data, llms.txt, shared CtaBand, tests). Done.

### 2. Pricing (content/pricing.md)
- [x] Batch 2 approved 2026-10-17. Was: title/description/seoTitle, plan bullets, FAQ; "AI SDR for less than..." angle; compare price to Beeze/Valley only with facts

### 3. Product pages (content/product/*.md)
- [ ] ai-assistants.md (target "claude linkedin mcp")  - [ ] ai-assistants-setup.md
- [~] campaigns.md (target "ai linkedin outreach"), Batch 3 applied, awaiting review  - [ ] lead-finder.md (target "linkedin intent signals")  - [ ] inbox.md
- [ ] network.md  - [ ] enrichment.md  - [ ] posts.md  - [ ] safety.md  - [ ] chrome-extension.md
- [ ] decide: new invitations.md (auto-accept / auto-withdraw)

### 4. Solutions (content/solutions/*.md)
- [ ] founders.md  - [ ] sales-teams.md  - [ ] recruiters.md  - [ ] agencies.md  - [ ] job-seekers.md

### 5. Compare and alternatives (content/compare/*, alternatives/*, best/*)
- [ ] Re-angle around AI SDR / Claude; prioritise dripify, waalaxy, phantombuster (already get impressions)
- [ ] consider Spurly vs Beeze page (verifiable facts only)

### 6. Glossary, templates, blog (the pages Google already shows)
- [ ] NEW glossary: what-is-an-ai-sdr, intent-signals
- [ ] glossary icp + inmail: answer-first, FAQ, AI SDR CTA box
- [ ] templates/connection-request pages: answer-first, add 2026 limits, CTA box
- [ ] blog (16 posts): intros + CTA box only
- [ ] about.md, security.md, changelog.md, book-demo, support, tools/linkedin-connection-request-generator.md

### 7. Off-site / GEO
- [ ] Product Hunt, G2, Capterra, AlternativeTo, SaaSHub listings with the one-sentence definition
- [ ] outreach to "best AI SDR for LinkedIn" list authors

### Build status (2026-10-17)
- [~] review: Batches 3-24 (all of sections 3-6 above, content/*.md) built; Batch 25 (in-app strings) built. Not yet built: Batch 0 (Sarthak, GA4) and Batch 26 (off-site).

### Later (separate plan)
- UI refresh: colors, fonts, "looks like an AI product".

## 9. Decisions (settled 2026-10-17)
1. Home H1: **Option A** (Sarthak). "Find high-intent leads on LinkedIn. / *Let your AI SDR do the outreach.*"
2. SEO title "Spurly: AI SDR & LinkedIn Automation Tool": **yes** (Claude's call; keeps the old ranking words).
3. Signals section on home + "Intent signals" nav link: **yes** (Claude's call).
4. Signals card 4: **hiring companies**; inbound invitations live in Feature tour tab 6 (Claude's call).
5. Pricing H2 "An AI SDR for {price}/month" + "Less than a day of an SDR's salary": **yes, both** (Sarthak).
6. Price stays $24.99 for this plan. Price testing is out of scope.
7. LeadWoo: dropped (parked domain).
8. GSC/GA exports: received.
9. "24/7 replies" = **replies arrive 24/7** (Sarthak). No claim that AI answers leads by itself.
10. Review flow: **one page per batch**, Sarthak reviews each in the browser before the next (Sarthak). Exception: "pattern batches" (section 10) where the first page is reviewed alone and the rest follow the approved pattern in one batch.

## 10. EXECUTION PLAN (for the executor session)

### 10.1 How to run a batch
1. Read this whole file first, especially sections 5 (claim rules) and 7 (constraints). Read the files you will touch before editing.
2. Do ONE batch from the list in 10.3, in order. Do not start the next batch.
3. Use the copy written here word for word where it is given. Where only a brief is given, write the copy yourself inside the brief, using the vocabulary list and claim rules in section 5.
4. Self-check (10.2), then mark the batch `[~] review` in the tracker (section 8 / 10.3), append a line to the session log, and tell Sarthak exactly which files changed and what to look at in the browser.
5. Sarthak reviews (`npm run dev`, `npm test`), approves or asks for changes. Only after approval mark `[x]`. Sarthak commits and pushes; the executor never commits, pushes, stashes or switches branches (GIT_OPTIONAL_LOCKS=0 for any git read).

### 10.2 Rules for every batch (self-check before handing over)
- Claims: only what section 5 allows. Never write: automatic scoring, "top 10%", AI replying or booking meetings by itself, invented numbers, ratings, logos or testimonials.
- Allowed and wanted: "AI SDR", "24/7" / "works while you sleep", "intent signals", "ICP", "warm leads", "AI-personalized", "in your voice", "quiet hours".
- Competitor facts (prices, features): only if fetched live from the competitor's own site in this session; write "as of <Month YYYY>". If you cannot verify, leave it out.
- Frontmatter: `seoTitle` <= 60 chars, `description` <= 155 chars, set `target_query`, bump `updated:` to today. Title (H1) contains the target query or a close variant. The first 2 sentences answer the query directly.
- Keep the honest safety line ("no tool can promise zero risk") wherever safety is discussed.
- Visible FAQ must equal FAQPage JSON-LD (homeFaq.js drives both; .md `faq:` drives both for content pages).
- Code style: function-based JS, no classes, no try/catch outside controllers, no `window`/`document` during render on public pages (prerender).
- After .md edits: `npm run content` must pass (validates frontmatter). Sarthak runs `npm test` in his terminal (baseline: 12 hub failures + 7 lint:arch errors already exist; do not add new ones). Update tests that pin old copy in the same batch.
- Grep check at the end of each batch: the old phrases you replaced ("on autopilot", "LinkedIn automation tool that finds", "Get leads from LinkedIn") must not remain in the files you touched.

### 10.3 Batches (in order)

**Batch 0 (Sarthak, manual, before Batch 1 ships): clean analytics**
- [ ] GA4 Admin > Data streams > web > Configure tag settings > Define internal traffic: add your home IP. Then Admin > Data filters > "Internal Traffic" > Active.
- [ ] GA4 Admin > Events: mark `sign_up` and `begin_checkout` as Key events.
- [ ] Note today's baseline in the session log: website sessions (Content group = website), sign-ups, trials, paid = 0.

**Batch 1: Home page** `[x]` (approved by Sarthak 2026-10-17) (copy is final in section 6, with decisions in section 9)
- [ ] Files: HomePage.jsx (Seo title/description, mount `<Signals />` after `<HowItWorks />`), components/Hero.jsx, components/LogoCloud.jsx, components/home/HowItWorks.jsx, Signals.jsx, FeatureTour.jsx (tabs 1-4 rewritten, add tab 5 "24/7, on your terms" and tab 6 "Invitations and enrichment"; tabs without a screenshot render text only, `shot` is optional), ClaudeSection.jsx, Solutions.jsx, components/Pricing.jsx, components/planFeatures.js, components/home/homeFaq.js, components/FinalCTA.jsx, components/Nav.jsx (add `{ href: "#signals", label: "Intent signals" }`, drop "Who it's for" to keep 5 links), components/MobileMenu.jsx (same links), components/Footer.jsx blurb.
- [ ] Same-batch consistency: structuredData.js (SOFTWARE_LD description + HowTo steps = the 3 new How-it-works steps), seo.js ORGANIZATION_LD description, scripts/llmsTxt.mjs SUMMARY. All use the one-sentence definition from section 5.
- [ ] Shared CTA copy (it appears on every content page, so this is the cheapest conversion win): templates/parts.jsx `CtaBand` default title "Put your AI SDR to work" and paragraph "Spurly is an AI SDR for LinkedIn. It finds high-intent leads, writes personalized messages with AI and follows up 24/7 until they reply. 7-day free trial, then {price}/month." `InlineCta` text unchanged.
- [ ] Tests: tests/website.assets.test.js (~45-48) and tests/llmsTxt.test.js (line 11) updated to the new strings.
- [ ] Optional screenshot for tab 5: Sarthak can provide a Settings > Sending hours screenshot as /assets/app-sending-hours.webp (1700 wide); until then tab 5 is text only.

**Batch 2: Pricing (content/pricing.md)** `[x]` (approved by Sarthak 2026-10-17)
- [ ] title: "One AI SDR, one plan, everything included" · seoTitle: "Spurly Pricing: AI SDR for LinkedIn, 7-Day Trial" · target_query: spurly pricing · description: "Spurly is an AI SDR for LinkedIn for one flat monthly price: intent signals, AI-written outreach, 24/7 sequences, inbox and Claude. 7-day free trial."
- [ ] Body: lead with the plan bullets in the order of planFeatures.js (Batch 1). Add a short "What you would pay elsewhere" table ONLY with live-verified prices (Beeze, Valley, Dripify, Waalaxy), dated. Keep trial/card/UPI/cancel facts unchanged.
- [ ] FAQ: add "Is there a free trial?" (exists? keep), "Does the price include AI?" (yes, AI writing included), "Does Spurly run 24/7?" (same answer as home FAQ).

**Batch 3-12: Product pages** `[~] review` (all built 2026-10-17) (one per batch, in this order; body keeps existing true facts, re-angled; add an FAQ of 3 questions to each)
| Batch | File | title (H1) | seoTitle (<=60) | target_query | Must cover |
|---|---|---|---|---|---|
| 3 `[~] review` | product/campaigns.md | AI LinkedIn outreach that follows up 24/7 | AI LinkedIn Outreach: Campaigns & Sequences \| Spurly | ai linkedin outreach | AI writes note + follow-ups in your voice, user approves; step types; runs 24/7 with quiet hours; stop on reply; skip contacted in 30 days |
| 4 | product/lead-finder.md | Find high-intent leads on LinkedIn | LinkedIn Intent Signals & Lead Finder \| Spurly | linkedin intent signals | define your ICP (filters, companies, post authors, URLs, CSV); the 5 signals (viewers, followers, post authors, hiring, invitations); keep "linkedin lead generation tool" phrase in body |
| 5 | product/ai-assistants.md | Your AI SDR inside Claude: LinkedIn outreach over MCP | Claude LinkedIn MCP: Run Outreach From Claude \| Spurly | claude linkedin mcp | read / draft / act; act off by default; same limits; reply triage + drafts for approval; link to setup page |
| 6 | product/inbox.md | Every LinkedIn reply in one inbox, 24/7 | LinkedIn Unified Inbox: Every Reply in One Place \| Spurly | linkedin unified inbox | replies arrive any time and stop sequences; reply/react/files; Claude drafts answers for approval |
| 7 | product/network.md | Your LinkedIn network and invitations on autopilot | Auto-Accept LinkedIn Invitations & Network \| Spurly | auto accept linkedin invitations | auto-accept (all or by headline keywords), auto-withdraw after N days, synced connections, viewers and followers as audiences |
| 8 | product/safety.md | 24/7 outreach that stays inside LinkedIn's limits | Is LinkedIn Automation Safe? How Spurly Paces It | is linkedin automation safe | keep honest risk statement; 24/7 with uneven gaps; quiet hours slow down ~4x overnight; per-action limits; stop on reply; skip contacted 30 days; remove any "only during working hours" wording |
| 9 | product/enrichment.md | Work emails and phone numbers for your LinkedIn leads | LinkedIn Lead Enrichment for Outreach \| Spurly | linkedin lead enrichment | light touch: AI SDR framing in intro + FAQ |
| 10 | product/posts.md | Warm up your audience with scheduled LinkedIn posts | Schedule LinkedIn Posts From One Place \| Spurly | schedule linkedin posts | light touch: posts make outreach warmer; AI drafts comments for approval |
| 11 | product/chrome-extension.md | (keep) | (keep) | (keep) | light touch: intro sentence + CtaBand handles the rest |
| 12 | product/ai-assistants-setup.md | (keep) | (keep) | spurly mcp setup | add one line "claude linkedin mcp" in intro; link back to batch 5 page |

**Batch 13-17: Solutions** `[~] review` (all built 2026-10-17) (one per batch)
| Batch | File | title (H1) | seoTitle | Angle |
|---|---|---|---|---|
| 13 | solutions/founders.md | An AI SDR for founders: LinkedIn pipeline without hiring | AI SDR for Founders: LinkedIn Pipeline \| Spurly | replace "on autopilot"; you build, it prospects 24/7, you take replies |
| 14 | solutions/sales-teams.md | An AI SDR next to every rep | AI SDR for Sales Teams on LinkedIn \| Spurly | each rep's own account, AI-written sequences, one inbox |
| 15 | solutions/agencies.md | Run AI SDR outreach for every client | LinkedIn AI SDR for Agencies \| Spurly | per-client campaigns; only claim multi-account if it ships (check Team tab; else leave out) |
| 16 | solutions/recruiters.md | (keep title) | (keep) | light: "AI-personalized notes", intent signals = open-to-work? only if surfaced; else keep |
| 17 | solutions/job-seekers.md | (keep) | (keep) | light touch only |

**Batch 18: compare/spurly-vs-dripify.md** `[~] review` (built with 19-20 in one pass)
- [ ] target_query -> "dripify pricing"; seoTitle "Dripify Pricing 2026 vs Spurly: Price and Features"; first section "How much does Dripify cost?" answered with live-verified, dated plan prices; then "Spurly vs Dripify" table adding rows: AI SDR / AI-written messages, intent signals, Claude (MCP), invitation autopilot, 24/7 with quiet hours, price.
**Batch 19 (pattern, after 18 is approved):** apply the same pattern to compare/spurly-vs-waalaxy (target "waalaxy pricing"), -expandi ("expandi pricing"), -heyreach, -lemlist, -linked-helper, -phantombuster ("phantombuster alternative" keep).
**Batch 20 (pattern):** alternatives/*.md (5) + best/linkedin-automation-tools.md: Spurly entry rewritten as "AI SDR for LinkedIn", same new rows; refresh "(October 2026)" dates only if content was re-verified.

**Batch 21: new glossary pages** `[~] review`
- [ ] glossary/ai-sdr.md: title "What is an AI SDR?", target "what is an ai sdr", path /glossary/ai-sdr. First sentence: the AI SDR definition from homeFaq (Batch 1). Sections: what it does, AI SDR vs AI-assisted tools vs human SDR, on LinkedIn specifically, what to look for (signals, personalization, approval, safety), FAQ 3.
- [ ] glossary/intent-signals.md: title "What are intent signals on LinkedIn?", target "linkedin intent signals" is taken by lead-finder, so use "what are intent signals". List the 5 signals Spurly surfaces plus general B2B ones (labelled as general).
- [ ] Add both to glossary/index.md; link them from home FAQ answers and lead-finder.

**Batch 22: quick-win pages (position 10-35 in Search Console), pattern: review the first, then the rest**
- Pages: blog/what-gets-linkedin-accounts-restricted, blog/free-linkedin-outreach-pipeline-founders (add seoTitle + target_query "linkedin outreach for founders without sdr"), blog/personalize-linkedin-connection-requests (add seoTitle + target "personalize linkedin connection requests"), blog/linkedin-account-warm-up, blog/is-linkedin-automation-safe, blog/linkedin-weekly-invitation-limit, blog/linkedin-account-restricted-what-to-do.
- [ ] For each: first 2 sentences answer the query; add/refresh a 3-question FAQ; add one paragraph that links to the most relevant product page with AI SDR wording; add 2 internal links to sibling posts; fix any "working hours" wording to 24/7 + quiet hours.

**Batch 23: buried high-impression pages, same pattern**
- blog/linkedin-connection-request-examples, glossary/inmail, glossary/icp (link to new glossary/ai-sdr and intent-signals), templates/index + 3 templates pages, glossary/social-selling-index.

**Batch 24: remaining blog posts, light touch** (intro line + one product link each; CtaBand already changed in Batch 1).

**Batch 25** `[~] review`: in-app copy consistency (spurly.web app, not the website)**
- Strings that say sending is "paced through your working hours" contradict 24/7: src/products/campaigns/hooks/useCampaignDetail.js:165, useCampaigns.js:71, src/products/pages/campaigns/components/SendMessagePreviewDialog.jsx:79, statusView.js:7, src/products/pages/campaigns/index.jsx:77. Replace with "paced 24/7, slower during your quiet hours". Check with Sarthak first; it is product copy.

**Batch 26 (Sarthak + Claude, off-site, not code)** `copy ready` in docs/POSITIONING_LISTINGS_COPY.md (submission is manual)
- [ ] Product Hunt, G2, Capterra, AlternativeTo, SaaSHub listings with the one-sentence definition. Chrome Web Store title/description to "Spurly: AI SDR for LinkedIn".

### 10.4 Measuring (weekly, Monday)
- Search Console: clicks, impressions, avg position; positions for the target_query of each changed page.
- GA4 (Content group = website, internal traffic filtered): sessions, /signup views, `sign_up`, `begin_checkout`.
- Admin dashboard: trials, paid.
- Log the 4 numbers in the session log. Goal (section 0): 10 real sign-ups and 3 paying customers within 30 days of Batch 1.

## Session log (append newest at the bottom)
- 2026-10-17: Positioning research done (Spurly live site vs beeze.ai); this plan created; no page changed.
- 2026-10-17 (2): Added Sarthak's GA + Search Console data, lemlist/Valley/HeyReach/SalesRobot research, SEO+GEO plan with keyword-per-page, one-sentence definition, verified auto-accept/auto-withdraw in backend, full Home current->proposed draft (section 6). No src/ change yet.
- 2026-10-17 (3): Received GSC 3-month + GA 28-day exports; baseline 0 customers/0 sign-ups; 24/7 claim allowed (sending runs around the clock, quiet hours slow down); added 24/7 tab + FAQ, quick-win page list, GA cleanup steps, end goal = first 10 sign-ups / 3 paid in 30 days.
- 2026-10-17 (4): Decisions settled (H1 A, 24/7 replies = arrive 24/7, pricing lines yes, one page per batch). Added section 10, the execution plan for a Sonnet session: 27 batches with exact titles/targets/briefs, rules, self-check, measuring. Found shared CtaBand (one edit updates every content page) and in-app 'working hours' strings that contradict 24/7.
- 2026-10-17 (5, executor): Executed Batch 1 (Home). Changed: HomePage.jsx (Seo title/description, `<Signals />` mounted after HowItWorks), Hero, LogoCloud (+ Claude (MCP) pill), HowItWorks, Signals, FeatureTour (tabs 1-4 rewritten, tabs 5 "24/7, on your terms" and 6 "Invitations and enrichment" added, text only), ClaudeSection, Solutions, Pricing, planFeatures.js (4 new lead bullets), homeFaq.js (definition in "What is Spurly?", + What is an AI SDR / What are intent signals / Does Spurly run 24/7 / Can Spurly reply to leads for me, "How does Spurly use AI?" extended), FinalCTA, Nav + MobileMenu (Features, Intent signals, How it works, Pricing, Blog), Footer blurb, structuredData.js (SOFTWARE_LD + 3 HowTo steps), seo.js ORGANIZATION_LD, scripts/llmsTxt.mjs SUMMARY, templates/parts.jsx CtaBand (title + paragraph), tests/llmsTxt.test.js and tests/website.assets.test.js. No .md changed, so `npm run content` was not needed. Grep for "on autopilot" / "LinkedIn automation tool that" / "Get leads from LinkedIn" in touched files: clean. Ran in the executor sandbox: llmsTxt, website.assets, website.claims, seo.prerender, content.templates, content.system, sitemap.lastmod, analytics tests all pass (not the full suite). Nothing committed. Open points for Sarthak: (1) "Less than a day of an SDR's salary" now shows next to the INR price too (usePrice switches to Rs 2,499 after hydration); confirm it holds in India or ask for a USD-only version. (2) components/ContentShell.jsx (the nav on content pages) still links "Who it's for" (/#who) and has no "Intent signals" link; it is not in Batch 1's file list, so left alone. (3) PAGE_UPDATED["/"] in pageDates.js not bumped (not in the brief). (4) components/home/Pillars.jsx is unmounted and still says "on autopilot"; untouched. (5) Tab 5 has no screenshot until /assets/app-sending-hours.webp is supplied.
- 2026-10-17 (6, executor): Follow-ups on Batch 1 (no new batch started). ContentShell nav: "Who it's for" -> "Intent signals" (/#signals). PAGE_UPDATED["/"] bumped to 2026-10-17. Pricing lead: "Less than a day of an SDR's salary." now hidden for India visitors (price.region === "IN", ₹2,499 may exceed a day of an Indian SDR's salary); Sarthak can revert if he wants it everywhere. Batch 1 still awaiting review.
- 2026-10-17 (7, executor): Batch 1 approved by Sarthak. Executed Batch 2 (content/pricing.md): new title/seoTitle/description per brief, `updated: 2026-10-17`, intro re-angled as AI SDR, "What is included" now one flat list in planFeatures.js order (4 new lead bullets first), new dated table "What you would pay elsewhere" (live-fetched 2026-10-17 from waalaxy.com/pricing, dripify.com/pricing, beeze.ai, joinvalley.co/pricing; Waalaxy page did not state billing term for its EUR prices; Dripify/Beeze/Valley show $ with no currency code), 2 new FAQs ("Does the price include AI?", "Does Spurly run 24/7?"). Trial/card/UPI/cancel text unchanged. FLAG for Sarthak: pricing.md FAQ and "How the trial works" say NO card is needed, but the home FAQ/TRIAL_NOTE say a card or UPI IS needed to start. One of them is wrong; left both as is per the brief.
- 2026-10-17 (8, executor): Sarthak confirmed the trial needs NO card (backend shared/utils/trial.js agrees). Corrected the stale "card/UPI required, charged on day 8" copy everywhere on the public site: pricing.js TRIAL_NOTE (now "No card needed to start your 7-day free trial. Subscribe when it ends to keep going, and cancel anytime."; Hero, FinalCTA, CtaBand, Pricing and /pricing show it automatically), Hero micro line, homeFaq ("Do I need a card" -> No), Support.jsx, llmsTxt SUMMARY, about.md, 2 blog posts that embedded the note, 6 compare pages (table row) plus dripify/heyreach prose (the lines saying Dripify wins on the card are removed since both start without a card), tests/content.system.test.js and tests/website.claims.test.jsx. Banned-claims regex /no credit card/ left in the tests; copy avoids that exact phrase. Rule for all later batches: never say a card is needed for the trial.
- 2026-10-17 (9, executor): Batch 2 approved. Executed Batch 3 (content/product/campaigns.md): title/seoTitle/description/target_query per table, updated 2026-10-17; intro answers the query in 2 sentences; new sections "AI writes the messages, you approve them" and "Runs 24/7, on your hours" (quiet hours ~4x slower, own timezone); 30-day skip added to "What a campaign does"; launch step 3 mentions AI drafts; 3 new FAQs (AI writes messages, 24/7, contacted recently) added to the existing 5; safety paragraph and honest-risk FAQ kept. Screenshot alt still says "sending window" (the real screenshot's label; not changed).
- 2026-10-17 (10, executor): Sarthak asked for the whole plan in one go. Built Batches 3-25 in parallel (3 workers + executor). Product pages 4-12: lead-finder, ai-assistants, inbox, network, safety, enrichment, posts, chrome-extension, ai-assistants-setup (each +3 FAQ; network title changed to "...handled for you" because the plan's own title said "on autopilot", which rule 10.2 bans). Solutions 13-17 (agencies title is "AI SDR outreach for agencies and consultants": no multi-account ships). Compare 18-19 (dripify, waalaxy, expandi, heyreach, lemlist, linked-helper: dated "How much does X cost?" + AI-feature table; prices fetched live 2026-10-17; phantombuster got the AI table only because its pricing page would not load), alternatives/best 20 (Dripify now Pro $79 / Advanced $99, Lemlist $69 monthly). New glossary ai-sdr + intent-signals (21) linked from glossary index, icp, lead-finder. Blog/glossary/templates 22-24 (23 files; Batch 24 got a "Where an AI SDR fits" section, not an intro line). Batch 25 (in-app, Sarthak authorized by asking for the whole plan): 5 strings now say "paced 24/7, slower during your quiet hours" (useCampaignDetail.js, useCampaigns.js, SendMessagePreviewDialog.jsx, statusView.js, campaigns/index.jsx); left the sequence setting label 'Only send inside the working-hours window' and invitations 'outside working hours' because they may describe real settings. Checks: `npm run content` 65 pages; full `vitest run`: 12 failures, all hub.* tests (= baseline), 0 new. Not done: home-FAQ answers do not link to the new glossary pages (FAQ text must equal the FAQPage JSON-LD, plain text only); Batch 0 and Batch 26 are manual. Nothing committed.
- 2026-10-17 (11, executor): security.md payments line now names Razorpay (live); stale calendar todo removed and About page now links /book-demo (Calendly) next to the email. Sarthak asked to say Spurly has no limits; NOT published: connect (10/h, 80/day, 200/wk) and message (20/h, 100/day, 500/wk) are capped in the limits registry and the safety page lists them. Claims that are true: one plan with the same limits for everyone, caps sit at LinkedIn's own ceiling, all other actions are paced only. Batch 26 prepared: docs/POSITIONING_LISTINGS_COPY.md (Chrome Web Store, Product Hunt, G2/Capterra/AlternativeTo/SaaSHub, list-author outreach). Everything buildable in the plan is built; only Batch 0 (GA4) and submitting Batch 26 remain, both manual.
- 2026-10-17 (12, executor): Search Console shows 18 pages 'Discovered - currently not indexed' (all new compare/alternatives/best/product/solutions/template pages). Added footer links to every one of them (Footer.jsx: Product +4, Solutions +2, new Compare column with 7 pages, new Resources column with 11 pages) so Google reaches them from every page. IndexNow submitted 71 URLs (HTTP 200). Sarthak is requesting indexing in batches of ~10/day.


## 9. UI restyle of the home page (Beeze-style, started 2026-10-17, session 6)
Decided with Sarthak 2026-10-17: after the content rewrite, the home page gets a short, visual, low-text layout modelled on beeze.ai's principles (one idea per screen, show the product instead of describing it, big headline + 1-2 lines, pills, progressive disclosure, light-to-dark mood shift). Keep Spurly's blue brand; copy the structure, not Beeze's claims (no scoring, no auto-booking, no invented logos). Go section by section; Sarthak reviews each. Other pages keep the old style until the home page is done.

- [x] Top bar (components/Nav.jsx, MobileMenu.jsx, navLinks.js, website.css "Top bar"): floating navy pill; logo left; Features (#tour), Intent signals (#signals), Pricing (#pricing), FAQ (#faq); one "Book a demo" button -> /book-demo. No Sign in / Dashboard / Start trial / Blog / How it works in the bar (Sign in and Start trial stay in the footer). Pill tightens and the wordmark folds on scroll. Mobile: logo + Book a demo + menu button. Checked in the browser at desktop and mobile widths. ContentShell (blog/legal pages) still uses the old `.nav`, restyle later.
- [x] Hero (components/Hero.jsx, components/home/HeroVideo.jsx, website.css "Hero"): pill "AI SDR | LinkedIn automation & outreach"; H1 "Your AI SDR for LinkedIn."; one line "An AI agent that finds people already interested in you, writes personal messages and follows up until they reply."; ONE button (Start 7-day free trial) + "No card needed · then {price}/month · cancel anytime"; then a dark demo-video frame that says "Product demo, coming soon". The old dashboard screenshot left the hero (belongs in Features). Big pale card behind the hero removed so the ribbons show. TO ADD THE VIDEO: paste the YouTube id + upload date in components/home/video.js; the frame becomes a click-to-play player and VideoObject JSON-LD turns on (no other change). Updated tests/website.assets.test.js to the new hero text (Sarthak runs tests).
  - Keyword decision (2026-10-17): "AI SDR" = headline (what buyers and the product-style results use for "AI SDR for LinkedIn"); "LinkedIn automation" + "outreach" = pill; "AI agent" = one mention in the copy only (SERP for "LinkedIn AI agent" is mostly marketplaces, dev tutorials and blogs; broad intent). Title/meta already carry "AI SDR" + "LinkedIn automation tool". Keyword volumes still NOT validated (use Google Keyword Planner).
- [ ] Proof strip ("Plugs into" row + example-messages wall, clearly labelled Example)
- [ ] What it does (4 short steps with a visual)
- [ ] Intent signals (pills grouped by type)
- [x] Features (components/home/FeatureTour.jsx, website.css "Features"): dark band, numbered list left, one panel right. 01 Find, 02 Run it from Claude, 03 Campaigns that follow up, 04 Invitations on autopilot, 05 "Everything else" (swaps the panel for the full grouped feature list incl. analytics dashboard, enrichment, quiet hours, Claude MCP). Items 1-4 auto-advance every 8s (stops on click). Panel shows screenshot (find, follow up) or a "Demo coming soon" placeholder (Claude, invitations) until clips exist.
  - RECORDINGS TO MAKE LAST (8-12s, silent loops, fake data only; set `clip` in FeatureTour.jsx FEATURES, keep `shot` as poster, files in public/assets/clips): (1) find: filters tick, lead rows fill, CSV chip drops in, count rises; (2) claude: chat asks "find 50 founders hiring SDRs, draft a campaign", tool steps run, campaign appears; (3) follow up: AI note types, Approve clicked, steps light up Visit>Connect>Message>Wait>Follow-up, reply arrives and sequence stops; (4) invitations: incoming invite matches keyword and is accepted, stale invite withdrawn.
  - [x] (1) find SHIPPED 2026-10-17: public/assets/clips/find.mp4 (1.07 MB) + .webm + find-poster.webp, 1280x800, 60 fps, 14.4 s, seamless loop; wired as FEATURES[0].clip. Real app (Vite) with mocked /api, rendered frame by frame on a virtual clock at 2x with eased camera zooms; source + re-render steps in demo-clips/ (README). Storyboard is the REAL flow: New audience -> Build from filters -> Review (Location "Berlin, Germany", Industry, 2nd, Title contains) -> Run import -> WorkingLine + rows land. Imported rows show no company/title (true for search-only rows until enriched). Invented people, companies and logo marks. Note: the video's poster is still `shot` (app-leads.webp, different aspect); find-poster.webp is ready if we want the poster to match frame 1. website tests 149 pass.
  - [x] (2) claude, (3) follow up, (4) invitations SHIPPED 2026-10-18: public/assets/clips/{claude,follow,invitations}.mp4 + -poster.webp (970 KB / 1.0 MB / 0.87 MB; 13.4 / 14.9 / 13.9 s; 1280x800, 60 fps, loop); wired in FeatureTour (Claude and Invitations got `shot` = their new poster, since they had none). mp4 only (webm skipped by decision; find.webm is on disk but unused). Storyboards, all real screens: claude = Dashboard "Run Spurly from Claude" card -> /oauth/consent (Read + Draft ticked, Act unticked) -> Approve -> Settings > AI assistants (Claude connected Read/Draft, actions switch OFF, Recent activity: get_dashboard, list_inbox_chats, run_people_search, create_campaign) -> Campaigns: Claude's campaign in Draft. Never shows Claude sending. follow = draft campaign -> Edit note -> Write (AI) -> Save -> Start sending -> Review before sending -> paced banner -> sequence Enrolled tab, replied leads stopped. invitations = Sent: withdraw a stale request (confirm dialog) -> Received: accept a founder -> Rules: auto-withdraw on (21 days) + auto-accept on, keywords "founder, head of growth" -> Save.
  - App code touched for the clips: sequences/components/columns.jsx STOP_REASON gained 'lead-replied': 'Replied — handed to you' (backend already stops on reply; the table used to show "Message — stopped"). Known bug NOT fixed: SendMessagePreviewDialog never passes the member's company to previewValuesFor, so {{company}} previews blank (clip note avoids {{company}}).
  - [x] Hero product demo SHIPPED 2026-10-18: public/assets/video/spurly-demo.mp4 (62 s, 1920x1080, 60 fps, 10.6 MB, H.264 + AAC) + spurly-demo-poster.webp. HeroVideo now plays the self-hosted file on click (nothing loads before the click; a YouTube id in video.js still takes over when pasted); video.js gained src/width/height/uploadDate/duration and videoLd() emits VideoObject with contentUrl. Ad cut: hook ("Okay, stop." / "by hand?" strike) -> real-app clips in a browser frame with kinetic captions -> "the last trick" -> Claude prompt -> CTA card. Voice: ElevenLabs "Lara" (v4) at 1.08x; music bed + all SFX synthesised (no licence needed). NOTE: the voice needs a paid ElevenLabs plan for commercial use (free plan = no commercial use, attribution required). Sources + re-render steps: demo-clips/ad/ (demo.py, timeline.json, sfx.py, music.py, README).
  - Old standalone ClaudeSection (HomePage) now overlaps item 02: decide whether to drop it.
- [ ] Claude (MCP) block
- [ ] Pricing, FAQ, final CTA, footer
Feature inventory for this work: see the numbered list agreed in chat 2026-10-17 (62 features; "Not listed" items can be added; do not claim scoring, auto-reply/booking, InMail, Insights, Sales Navigator search).

- [x] Intent signals (components/home/Signals.jsx, website.css "Intent signals grid"): Beeze-style grid. Cards: Interested in you (viewed profile, follows you, follows company page), Showing a need (posted about your topic, company is hiring), Your network (accepted your invitation, sent you an invitation, in your network), "Then Spurly acts" (visit, connect, message, follow, like, comment, endorse a skill), wide "Read from every profile" (headline, title and company, about, work history, education, skills, location, followers, email and phone). Centre: made-up "Example" lead card. Chip "8 intent signals tracked" is computed from the cards.
  - Verified in code 2026-10-17: full profile (work_experience with dates, skills, education etc.) is stored as a raw blob; endorse works only for 1st-degree connections (vendor rule); a lead's posts are fetched only when a like/comment step runs. NOT claimed: job change, promotion, time in role, latest posts as signals (no code detects or filters them). If wanted, build a "Career changes" filter from work_experience dates first, then add the card.
  - HomePage order is now Hero, Features, Signals, Claude, Solutions, Pricing, FAQ, Final CTA. LogoCloud and HowItWorks are unmounted (files kept); Sarthak to confirm they stay out.
- [x] Pricing (components/Pricing.jsx, website.css "Pricing (home)"): "One plan. Everything included." One card: dark price panel ($24.99 / INR via usePrice, 7-day trial badge, one button) + 8 highlights (all from planFeatures.js). Notes under it: TRIAL_NOTE verbatim + /pricing link, safety line. Removed "Less than a day of an SDR's salary". PlanCard stays for /pricing (old style). Remaining: FAQ, final CTA, footer, old Claude/Solutions blocks.
- [x] FAQ + Final CTA + nav logo (2026-10-17): FAQ is title-left (sticky) / rows-right, homeFaq.js untouched so FAQPage JSON-LD still matches. Final CTA is a dark panel, one line, one button. Nav logo now sits in a white tile and the "Spurly" wordmark no longer folds on scroll (it was easy to miss on the dark pill). REMOVED from the home page: ClaudeSection, Solutions, LogoCloud, HowItWorks (files kept, unmounted). Home order: Hero, Features, Signals, Pricing, FAQ, Final CTA, Footer. Remaining: footer restyle, ContentShell header for blog/legal, clips, optional proof strip.
- [x] Footer (components/Footer.jsx unchanged, website.css "foot-*"): dark navy, white logo tile, mono column headings, all ~50 links kept (internal linking for SEO). Shared by every marketing page, so blog/legal pages get the dark footer too. Next: ContentShell header (blog/legal), then optional proof strip, then demo clips last.
- [x] Content-page header + background (2026-10-17): ContentShell now uses the same floating Nav/MobileMenu (home={false} makes the section links point at "/#..."), so blog, legal, pricing and product pages match. Old .nav/.nav-links CSS deleted. Ribbon/thread backdrop hidden on the public site only (`body.mkt::before{display:none}`; index.css still draws it for the app). Fixed a class clash: my Features band rule `.feat` also hit PlanCard (`price glass feat`) and made /pricing text white-on-white, now scoped to `section.feat`. Remaining: optional proof strip, demo clips last. Check a production build for any flash of the open mobile menu before CSS loads (seen in dev only).
- [x] Nav: added quiet "Log in" text link before "Book a demo" (desktop); on mobile it is a ghost button under Book a demo in the menu. "Start free trial" deliberately NOT in the bar (hero/pricing/final CTA carry it).
- [x] Full-page review (2026-10-17): desktop 1440 and mobile 375 pass, no horizontal overflow; home is ~7.7k px tall on desktop. website tests: 149 pass (assets test updated for the new sections, CTA count now >=3). `npm run build` could not run in the sandbox (vite cannot empty dist: no delete permission), so Sarthak must run it and check prerender. Open: hero demo frame and Claude/Invitations panels both say "coming soon" until clips exist.

## 10. App restyle (started 2026-10-17): landing theme in the logged-in app
- Done as a demo, Dashboard first: tokens.css "v7" block (Instrument Sans for sans+display, IBM Plex Mono, display tracking -0.035em, radii md12/lg16/xl22); `.ui-rail` class on the sidebar <aside> re-points tokens to site navy (dark rail, white logo tile); `.ui-display` weight 700; ribbon `body::before` removed from index.css. Revert: delete the v7 block + `ui-rail` class, restore the ribbons rule. NOT yet seen by Claude (the preview browser is not signed in); Sarthak reviews in his own tab. Next: review, then Leads, Inbox, Campaigns, etc., then demo clips.
- [x] App restyle polish: removed the unused Newsreader @font-face; active sidebar row no longer has the outline shadow (`.ui-rail [aria-current="page"]{box-shadow:none}`). Other pages follow the theme through tokens (no hard-coded old fonts anywhere); awaiting Sarthak click-through screenshots.
- [x] App restyle, inside Leads (2026-10-17): primary button gradient + 12px radius (variants.js uses --ui-btn-primary-bg), chip radius 8, white page header band, flat table header + semi-bold, bolder active tab. Awaiting Sarthak screenshot.
