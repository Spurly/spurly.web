# Regional Pricing + Onboarding Activation — Living Plan

**Owner:** Sarthak · **Planned:** 2026-09-20 (Opus) · **Executed by:** Sonnet
**Status:** `PLANNED — NOT STARTED`
**Repos touched:** `spurly.backend`, `spurly.web` (no extension changes, no admin.dashboard changes required — one optional admin item, see B4)

> **This document is the source of truth.** Update the Status Dashboard below
> after every unit of work, in the same commit. Anyone (any chat, any account)
> must be able to read this file alone and know exactly what is done, what is
> next, and why each decision was made.

---

## 0. How to resume this work in a fresh chat

Paste this into a new session:

> Read `spurly.web/docs/PRICING_GEO_AND_ONBOARDING_PLAN.md`. Continue from the
> first unchecked item in the Status Dashboard. Follow the traps in §7 exactly.
> Update the dashboard in the same commit as the code.

Ground rules for whoever executes:

1. **Work through phases in order.** Phase A must land before B; C is
   independent; D must land before E (the audience step needs a linked account).
2. **Never switch git branches with `device_bash`** — the sandbox cannot
   unlink, so `checkout` half-applies. Use `git checkout -b` on the tree as it
   stands. Always `GIT_OPTIONAL_LOCKS=0`. Never `git stash`.
3. **One commit per numbered item**, message prefixed with the item id
   (e.g. `A3: region-aware base price`).
4. Run the suites before marking anything done:
   `spurly.backend` → `npm test` (788+ tests) and `npm run lint`
   `spurly.web` → `npx vitest run` (89+ tests), `npm run lint`, `vite build`
   (build to a scratch `--outDir`, not `dist/` — the `dist/.DS_Store` trap).
5. Branches: `feat/regional-pricing-onboarding` in **both** repos.

---

## 1. Status Dashboard

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

### Phase A — Region & currency foundation (backend) — 0/8
- [ ] **A1** Add `geoip-lite`; add `shared/utils/geo.js` (`resolveRegionFromRequest`)
- [ ] **A2** `app.set('trust proxy', 1)` + verify real client IP reaches Express in prod
- [ ] **A3** Add `billingRegion` to the User model (`'IN' | 'INTL' | null`)
- [ ] **A4** Stamp `billingRegion` at signup / first pricing read
- [~] **A5** Make `subscriptions/service.js` region-aware (`PRICING` table replaces `BASE_AMOUNT`)
      → *partially done 2026-09-20: `BASE_AMOUNT` is now `2499` (INR still hardcoded).
      The region table still needs to replace the constant.*
- [ ] **A6** Seed/update the `FIRSTMONTH` promo: ₹99 **and** $1 — *both currencies mandatory*
- [ ] **A7** Public unauthenticated pricing endpoint (mount-order trap — see §7.3)
- [ ] **A8** `money.js` round-to-2-decimals helper; use at every compute/compare/send boundary

### Phase B — Pricing surfaces (web) — 0/5
- [ ] **B1** Currency formatter in `shared/utils/` (₹ vs $, no hardcoded glyphs)
- [ ] **B2** `SubscribePage.jsx` renders from `pricing.currency` (4 hardcoded `₹` today)
- [ ] **B3** Country override control on `/subscribe`
- [ ] **B4** Marketing `Pricing.jsx` — default the existing USD/INR toggle from detected region
- [ ] **B5** *(optional)* Admin promo form exposes `firstCycleAmountUSD`

### Phase C — USD checkout rail (provider-agnostic) — 0/4
- [ ] **C1** `subscriptions/providers/` interface (`createOrder`, `verifyWebhook`, `fetchOrder`)
- [ ] **C2** Move Cashfree behind it; `INR → cashfree` routing
- [ ] **C3** `INTL_CHECKOUT_ENABLED` flag; graceful "not yet available" path when off
- [ ] **C4** Build + verify the Cashfree IPG adapter against **sandbox** (prod flip waits on approval — see §3)

### Phase D — Onboarding: LinkedIn connect step — 5/5
- [x] **D1** `onboardingStage` on User (null-safe, **no backfill** — see §7.5)
- [x] **D2** `returnTo` allow-list on `POST /hub/account/link`
- [x] **D3** `/onboarding/linkedin` page + route + stepper
- [x] **D4** Return handling uses `refresh()` (vendor pull) with 2×5s retry — **not** `load()`
- [x] **D5** Visible "I'll do this later" skip

### Phase E — Onboarding: first audience step — 0/4
- [ ] **E1** `/onboarding/audience` page reusing `AudienceFilterForm` + `FilterTagPicker`
- [ ] **E2** Prefill from survey answers where they map
- [ ] **E3** Submit → `POST /hub/searches` with `filters`; handle "no linked account"
- [ ] **E4** Completion copy sets the right expectation (cron-paced, not instant)

### Phase F — Verification — 0/6
- [ ] **F1** Backend unit tests: pricing per region, promo per currency, no cross-currency leak
- [ ] **F2** Backend test: existing paid users unaffected (regression guard)
- [ ] **F3** Web tests: SubscribePage renders both currencies; onboarding step order
- [ ] **F4** Web test: existing onboarded user is **not** re-dumped into onboarding
- [ ] **F5** Manual: one real Cashfree sandbox INR round-trip at the new ₹99
- [ ] **F6** Prod IP check — confirm `trust proxy` gives real client IPs (§7.2)

---

## 2. What we are building

| | India (`IN` / `INR`) | Outside India (`INTL` / `USD`) |
|---|---|---|
| First payment | **₹99** | **$1** |
| Every payment after | **₹2499** | **$29.99** |
| Period | 30 days | 30 days |
| Rail | Cashfree Orders (live) | **not yet chosen** — see §3 |

Plus: after paying, onboarding gains a **LinkedIn connect** step and an
**audience builder** step, so a new user's leads page is already filling when
they first arrive.

New onboarding order:

```
signup → verify → PAY → survey → LinkedIn connect → audience → install extension → dashboard
                          (1)      (2)                (3)        (4)
```

---

## 3. 🔴 The USD problem — read this before writing any C-phase code

**Cashfree cannot charge USD on this merchant account today.** Confirmed twice:
the code comment in `cashfreeClient.js`, and the live merchant dashboard
(read 2026-09-20).

### What the merchant account actually holds

**Activated:** Payment Gateway (the live rail), Payment Links, Payment Forms,
Relay. Digital KYC complete; INR settlements confirmed working.

**Rejected:** **International Payment Gateway**, Subscriptions, Payouts.

**Available, not activated:** Global Collections ("Complete Activation"),
One Click Checkout, Cashgram, BBPS, SoftPOS, RiskShield.
FlowWise shows "Activation in Process".

### Two things that look like an escape hatch and are not

1. **The Payment Gateway card advertises "domestic and international
   payments."** That is generic marketing copy on the base product. **IPG** is
   the product that actually enables foreign-card acceptance, and it is
   rejected. Do not read the blurb as capability.

2. **Global Collections is not a checkout product.** It issues virtual
   USD/EUR/GBP/CAD accounts that a foreign customer pays by **bank wire —
   ACH / SEPA / Faster Payments / SWIFT** — capped around **$10,000 per
   invoice**, with e-FIRA issued for compliance. It is built for exporters and
   freelancers invoicing clients, funds cannot be retained in the collection
   account, and there is no card checkout. **You cannot put a $29.99 subscribe
   button on it.** Not a path.

### The one genuinely useful finding

The IPG dashboard card offers **"Try Test Environment"**. So the USD adapter can
be **built and fully verified against Cashfree's IPG sandbox now** — only the
production flip waits on approval. C4 is therefore real work, not dead code.

### Rails, in order of preference

| Option | Gate | Notes |
|---|---|---|
| **Cashfree IPG** | Cashfree approval | One gateway, one webhook, one settlement. Sandbox is open today. Approval generally wants a registered entity (Pvt Ltd / LLP) rather than a proprietorship — the same reason Subscriptions was refused. **Action: contact care@cashfree.com and ask what entity type IPG needs.** |
| **Merchant of Record** (Dodo / Paddle / Lemon Squeezy) | none | They become seller of record and handle global VAT/GST. Onboard proprietorships. Fastest route to actually charging $29.99. Second webhook + second order shape. |
| **Stripe** | Stripe India rules | Verify before committing — Stripe India settles INR and restricts foreign-card acceptance. |

**Until a rail is live in production**, international users see USD pricing and
an honest path (waitlist, or pay the INR equivalent) — *never* a pay button the
gateway will refuse. C3 owns that behaviour.

## 4. Current state of the code (verified 2026-09-20)

### Backend — `spurly.backend/src/platform/subscriptions/`

| File | What matters |
|---|---|
| `service.js` (722 lines) | `REGION='IN'`, `CURRENCY='INR'`, `BASE_AMOUNT=2000`, `PERIOD_DAYS=30` as **module constants**. This is the one file that hardcodes India. |
| `model.js` (Payment) | ✅ **Already dual-currency:** `region: enum ['IN','INTL']`, `currency: enum ['INR','USD']`, `amount`, `baseAmount`. **No migration needed.** |
| `cashfreeClient.js` | `createOrder({ ..., currency })` already takes currency as a parameter and passes it as `order_currency`. Provider-shaped already. |
| `controller.js` / `routes.js` | Thin pass-through. `GET /subscriptions/pricing`, `POST /subscriptions/promo/validate`, `POST /subscriptions`, `GET /subscriptions/me`. All `authMiddleware`. |
| `webhookRoute.js` | Mounted at line 86 of `app.js`, before `express.json()`, with `express.raw()` — signature verification needs the raw body. Do not move it. |

### Backend — `spurly.backend/src/platform/promoCodes/model.js`

✅ **Already dual-currency by design.** `firstCycleAmountINR` **and**
`firstCycleAmountUSD`, `discountType: 'fixed_price' | 'percent'`,
`appliesTo: 'first_payment' | 'any_payment'`, `autoApply`, `perUserLimit`,
`redeemedCount`, plus a `PromoRedemption` ledger with a unique index on
`paymentId`.

The model's own comment says it: *"Amounts are stored per currency rather than
as one number, because ₹ and $ pricing are set independently rather than
converted."* This machinery is exactly what the first-month price needs.

### Web — `spurly.web/src/`

| File | What matters |
|---|---|
| `core/pages/auth/SubscribePage.jsx` | Hardcodes `₹` at **lines 293, 294, 300, 301, 306**. Phone gate + promo box already here. |
| `core/billing/entities/Subscription.js` | `PricingInfo` already carries `region` and `currency` (defaults `'IN'`/`'INR'`). `savings()`, `hasDiscount()`. |
| `core/billing/controller/subscriptions.js` | Event-emitter controller (per your pattern). Events in `core/billing/constants/constants.js`. |
| `marketing/components/Pricing.jsx` | Already has a **USD/INR toggle** (`useState("usd")`) and per-plan `amt` / `amtInr`. Only the *default* needs to come from geo. |
| `core/pages/auth/OnboardingSurveyPage.jsx` | Step 2. Collects role, teamSizeRange, primaryGoal, monthlyActivity, linkedinPlan, companyName, companyWebsite. |
| `core/pages/auth/postAuthDestination.js` | `user.onboardingComplete === false ? '/onboarding' : '/dashboard'`. **This is the function that decides where a paying user lands — the highest-risk edit in Phase D.** |
| `app/routes.jsx` | `/onboarding` and `/onboarding/install` wrapped in `ProtectedRoute` + `SubscribeGate`. |
| `products/pages/leads/` | `AudienceFilterForm.jsx` + `FilterTagPicker.jsx` — the Phase 8 structured builder to reuse. |
| `products/settings/hooks/useLinkedInSettings.js` | Reads `?linked=1`, calls `refresh()` (vendor pull) with retries. **Copy this behaviour, do not reinvent it.** |

### Backend — hub endpoints the onboarding steps will call

- `POST /api/hub/account/link` → hosted auth URL. `successUrl` is **hardcoded**
  to `${web}/dashboard/settings/linkedin?linked=1` in
  `products/hub/unipileAccount/service.js:70`.
- `POST /api/hub/searches` with `{ filters, name }` → queues an audience.
  `GET /api/hub/audience/params?type=&keywords=` backs the autocomplete.
  Both behind `authMiddleware` + `requireActiveSubscription`.

---

## 5. Phase-by-phase work

### Phase A — Region & currency foundation (backend)

**A1 — geo resolver**
`npm i geoip-lite` (local DB, no API call, no rate limit, ~90% country accuracy).
New `src/shared/utils/geo.js`:

```js
// resolveRegionFromRequest(req) -> 'IN' | 'INTL'
// Order: explicit user override > stored user.billingRegion > IP lookup > 'IN'
```

Default to `'IN'` when the lookup fails. Rationale: India is the live rail — an
unknown visitor lands on a page that actually works.

**A2 — trust proxy**
`app.set('trust proxy', 1)` in `createApp()`. **Verify on prod** (§7.2) — without
this, behind nginx/ALB every request reports the proxy's IP and *everyone* is
classified `IN`. This is silent and expensive to discover later.

**A3 — User field**
```js
billingRegion: { type: String, enum: ['IN', 'INTL'], default: null }
```
`null` = never resolved. Nullable on purpose so existing users are untouched and
derive from IP until they transact.

**A4 — stamping**
Set `billingRegion` on first `getPricingForUser` call if `null`. Once stamped it
is sticky — **the price shown must equal the price charged**, and a VPN toggle
between the two must not move it. A user-facing override (B3) is the only way to
change it.

**A5 — region-aware pricing**
Replace the three constants in `service.js` with a table:

```js
const PRICING = {
  IN:   { region: 'IN',   currency: 'INR', baseAmount: 2499  },
  INTL: { region: 'INTL', currency: 'USD', baseAmount: 29.99 },
};
```

Every function that currently closes over `REGION`/`CURRENCY`/`BASE_AMOUNT`
takes the resolved region instead:
`getPricingForUser`, `validatePromoForUser`, `createSubscriptionForUser`,
`getMySubscription`, `recordPromoRedemption`.

⚠️ `getMySubscription` currently returns `baseAmount: BASE_AMOUNT` as a literal
— for a user with a paid Payment it must report **that payment's** region and
currency, not a freshly-resolved one.

**A6 — 🔴 the FIRSTMONTH promo must carry BOTH currencies**
First-month pricing rides on the existing auto-apply promo rather than new
discount machinery. Update the `FIRSTMONTH` row:
`discountType: 'fixed_price'`, `firstCycleAmountINR: 99`,
`firstCycleAmountUSD: 1`, `appliesTo: 'first_payment'`, `autoApply: true`.

**If `firstCycleAmountUSD` is left null, `promo.amountFor()` returns `null`,
`evaluatePromo` refuses the code, and every international first-timer is
silently charged the full $20 instead of $1 — with no error anywhere.** That is
the single most likely bug in this whole plan. Write the test (F1) that pins it.

Ship this as a script under `src/scripts/` (`seedRegionalPricing.js`), not a
manual DB edit, so staging and prod cannot drift.

**A7 — public pricing endpoint**
`GET /api/public/pricing` → `{ region, currency, baseAmount, firstCycleAmount }`.
No auth — the marketing page has no session.
🔴 **Mount it BEFORE `importedLeadsRoutes` (app.js line ~150).** That router
calls `router.use(authMiddleware)` at bare `/api`, which swallows every public
route mounted after it and returns 401 forever. This trap has already bitten
this codebase twice (the account webhook, the hub admin router).

**A8 — 🔴 decimals**
$29.99 is the first non-integer amount this system has ever handled; every
amount today is a whole rupee. `Payment.amount` is already a `Number` and
Cashfree's `order_amount` accepts 2 decimals, so **no migration is needed** —
but float arithmetic is not safe to leave unguarded.

New `src/shared/utils/money.js`:

```js
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
```

Apply it at **every** boundary where an amount is computed, compared or sent:
- `resolvePromo` / `evaluatePromo` — the `amount >= baseAmount` comparison
- `promo.amountFor()` percent path — `20 * 0.7` is `13.999999999999998`
- the `savings` calculation (`baseAmount - amount`)
- `cashfreeClient.createOrder({ amount })` — never send an unrounded float
- `Payment.create({ amount, baseAmount })`

A percent-discount promo against a $29.99 base is the case that breaks first.
Pin it with a test (F1).

### Phase B — Pricing surfaces (web)

**B1** `formatPrice(amount, currency)` in `src/shared/utils/`. `₹1,999` / `$20`.
Every price in the app goes through it — no glyph literals left anywhere.

**B2** `SubscribePage.jsx`: replace the five hardcoded `₹` with `formatPrice`
driven by `pricing.currency`. The page already refuses to render a pay button
without loaded pricing — keep that guard exactly as it is.

**B3** Country override on `/subscribe`: *"Prices shown in ₹ for India.
[Not in India?]"* → sets `billingRegion` via the profile endpoint, refetches
pricing. Put it near the price, not buried in settings.

**B4** `marketing/components/Pricing.jsx`: the toggle already exists. Change the
initial state from `"usd"` to a value seeded from `GET /api/public/pricing`,
falling back to `"usd"`. Keep the toggle — a visitor must always be able to see
the other currency.

> Note: the marketing page's plan tiers (Free / Pro $29 / Agency $99) are
> **marketing copy and do not match the real billing** (one flat price, no
> tiers). Out of scope here, but flag it to Sarthak — the gap between the
> pricing page and the checkout page is a support ticket waiting to happen.

**B5** *(optional)* Admin promo form: confirm it exposes `firstCycleAmountUSD`.
If it does not, A6's seed script is the only way to set it, which is fine but
should be written down.

### Phase C — USD rail abstraction

**C1** `src/platform/subscriptions/providers/index.js`:
```js
// getProvider(currency) -> { createOrder, fetchOrder, verifyWebhookSignature }
```
**C2** Cashfree becomes `providers/cashfree.js` (a move, not a rewrite — the
client already has the right shape). `INR → cashfree`.
**C3** `INTL_CHECKOUT_ENABLED=false` by default. When off and region is `INTL`:
pricing still renders in USD, the pay button is replaced by an honest
"international checkout opens soon — [notify me]" state. **Never render a live
pay button that the gateway will refuse.**
**C4** Deferred until the rail is chosen (§3).

### Phase D — LinkedIn connect step

**D1 — `onboardingStage`, null-safe**
```js
onboardingStage: {
  type: String,
  enum: ['survey', 'linkedin', 'audience', 'install', 'done'],
  default: null,
}
```
🔴 **No backfill migration.** `postAuthDestination` treats `null` as
*"use the legacy rule"* (`onboardingComplete ? '/dashboard' : '/onboarding'`).
Adding a non-null default, or backfilling wrongly, dumps every existing paying
customer back into onboarding. F4 is the test that guards this.

**D2 — `returnTo` on the link endpoint**
`createLinkForUser(userId, { returnTo })`. 🔴 **Allow-list the value** against
`['/dashboard/settings/linkedin', '/onboarding/linkedin']` and build the URL
server-side from `getFrontendUrl()`. Never interpolate a client-supplied URL —
that is an open redirect on an authenticated flow.

**D3 — the page**
`/onboarding/linkedin`, `ProtectedRoute` + `SubscribeGate`, reusing `AuthShell`
+ `Stepper`. Stepper goes from 3 steps to 5.

**D4 — 🔴 return handling: `refresh()`, not `load()`**
Coming back with `?linked=1`, the page must call the **vendor pull**
(`POST /hub/account/refresh`), retrying twice at 5s — not a read of our own DB.

Why: hosted auth's binding callback is built from `BACKEND_PUBLIC_URL` and is
the *only* message carrying our userId. It never lands locally, and in prod it
can still be missed. A read of our own database is a read of the one place that
has not heard about the connection yet. `useLinkedInSettings.js` already solves
this exactly — copy it.

Also surface the **"Already connected? Check again"** affordance here, for the
same reason it exists on the settings page: without it, a user whose callback
was lost re-runs hosted auth and ends up with two vendor-billed accounts.

**D5 — skip**
A visible, non-apologetic "I'll connect LinkedIn later" that advances the stage.
Hosted auth redirects off-site; a failure there must never trap a customer who
has already paid.

### Phase E — First audience step

**E1** `/onboarding/audience` reusing `AudienceFilterForm.jsx` and
`FilterTagPicker.jsx` verbatim. These are real debounced, id-backed
autocompletes; do not substitute free-text inputs — a free-text value silently
sends a wrong LinkedIn id and returns the wrong people.

**E2** Prefill what maps from the survey (e.g. `primaryGoal: recruit_candidates`
→ a sensible default title/keyword). Keep the mapping small and obvious.

**E3** Submit → `POST /api/hub/searches` with `{ filters, name }`.
🔴 **Dependency:** the import needs a linked account. If D was skipped, this
step must render a "connect LinkedIn first" state with a link back to D — not a
submit button that queues a search which can never run.

Also note the strict allow-list: `assertStructuredFilters` accepts only
`location, industry, company, past_company, school, service, groups, keywords,
profile_language, network_distance, open_to, connections_of, followers_of,
advanced_keywords`. **There is no `skills`, `seniority` or `tenure` on
LinkedIn Classic** — the form already respects this; don't add fields to it.

**E4 — expectation-setting copy**
The import runs from **crontab**, not synchronously, and production ships
`HUB_IMPORT_MAX_PROFILES=10` — one page per run. So the "fresh audience" waiting
on the leads page is **~10 leads, arriving minutes later**, not a full list
instantly. The completion screen must say something true
("We're building your list — it'll appear on Leads shortly"). The leads page
already polls and fills itself.

> **Decision needed from Sarthak:** is 10 leads a good enough first impression,
> or should the onboarding-created audience get a higher cap? Record in §9.

---

## 6. Order of execution (efficiency)

```
A1 A2 A3 ──► A4 ──► A5 ──► A6 ──► A7        (backend, ~1 sitting)
                      └──► B1 B2 B3 B4      (web pricing, depends on A5/A7)
C1 C2 C3                                     (independent, do any time after A5)
D1 D2 ──► D3 D4 D5 ──► E1 E2 E3 E4          (onboarding, D strictly before E)
F1..F6                                       (continuous, not a final phase)
```

Ship A+B as one deployable slice (India pricing corrected to ₹99/₹1999, USD
displayed but not chargeable). Ship D+E as a second slice. C4 lands whenever the
rail is approved.

---

## 7. 🔴 Traps — every one of these has already cost this codebase time

**7.1 Cross-currency promo silence.** `evaluatePromo` returns `{ok:false}` when
a promo has no amount for the currency, `resolvePromo` then falls back to full
price *with no error surfaced to the user*. An unset `firstCycleAmountUSD` means
international first-timers pay $20 instead of $1, silently. Test it (F1).

**7.2 `trust proxy`.** Without it, behind nginx/ALB `req.ip` is the proxy and
every user reads as India. Verify on prod by logging `req.ip` and
`req.headers['x-forwarded-for']` on one request, then remove the log.

**7.3 Public routes and mount order.** `importedLeadsRoutes` does
`router.use(authMiddleware)` at bare `/api`. Anything public mounted *after* it
returns 401 forever, and a 401 is indistinguishable from a real auth failure.
Mount `/api/public/pricing` before it, and assert on the **response body** in
the test, not the status code.

**7.4 Price shown ≠ price charged.** `createSubscriptionForUser` deliberately
re-derives pricing server-side and trusts nothing from the client. Keep that.
Region must come from the **stored** `billingRegion`, not a fresh IP lookup, or
a network change between page load and pay button moves the amount.

**7.5 Do not dump existing users into onboarding.** `onboardingStage` defaults
to `null` and `null` means "legacy rule". F4 pins it.

**7.6 The LinkedIn binding callback never arrives locally.** Use `refresh()`
(vendor pull), not `load()`. See D4.

**7.7 Open redirect.** `returnTo` is allow-listed server-side. See D2.

**7.8 Webhook body parsing.** The Cashfree webhook is mounted before
`express.json()` with `express.raw()` because signature verification needs the
exact bytes. Any provider added in Phase C needs the same treatment and the same
mount position.

**7.9 `responseFormatter.error` puts the code on `error`, not `code`.** The web
keys on that string.

**7.10 Existing paid users.** A live `Payment` row carries its own `region` and
`currency`. Reading those — never re-deriving — is what stops an existing
Indian subscriber's status page suddenly reporting dollars.

**7.11 git in device_bash.** `GIT_OPTIONAL_LOCKS=0`, never `git stash`, never
switch branches. Build to a scratch `--outDir`, not `dist/`.

---

## 8. Env vars added

| Var | Where | Default | Notes |
|---|---|---|---|
| `INTL_CHECKOUT_ENABLED` | backend `deploy.yml` heredoc | `false` | Flip when a USD rail is live |
| *(provider creds)* | backend | — | Added with C4 |

No new frontend env vars — region comes from the API.

---

## 9. Decision log & open actions

| Date | Decision | Rationale |
|---|---|---|
| 2026-09-20 | Currency-agnostic build; USD rail chosen later | Cashfree IPG is rejected on this merchant account; building against it blind risks dead code |
| 2026-09-20 | Server IP lookup → stored `billingRegion`, user-overridable | Price shown must equal price charged; VPN/mobile-IP changes must not move the amount mid-checkout |
| 2026-09-20 | Onboarding order: pay → survey → LinkedIn → audience → install | Audience needs a linked account; install is last because its 2-min poll is the most-abandoned step |
| 2026-09-20 | Reuse Phase 8 `AudienceFilterForm` | Already proven live; no second form to maintain, no new backend endpoint |
| 2026-09-20 | First-month price rides the existing `FIRSTMONTH` auto-apply promo | Per-currency amounts, first-payment-only eligibility and a redemption ledger already exist |
| 2026-09-20 | Prices set: **₹2499 / $29.99** recurring, **₹99 / $1** first payment | Supersedes the earlier ₹1999/$20. Intro offer retained |
| 2026-09-20 | Amounts stay `Number` with a `round2` helper, not minor units | Cashfree accepts 2 decimals and `Payment.amount` is already a Number — a paise/cents migration touches every existing row and the admin table, for no gain today |
| 2026-09-20 | Cashfree dashboard read: IPG **rejected**, Global Collections is wire-transfer only | Global Collections cannot back a subscribe button; IPG **sandbox is open**, so the USD adapter is buildable and testable now |

**Open actions for Sarthak:**
- [ ] Apply for Cashfree International Payment Gateway — ask `care@cashfree.com`
      what entity type is required (the dashboard card offers no re-apply button,
      so this goes through support). Record the answer here.
- [ ] Decide fallback rail if IPG is refused (Dodo / Paddle / Lemon Squeezy / Stripe).
- [ ] Decide whether the onboarding-created audience gets a higher
      `HUB_IMPORT_MAX_PROFILES` cap than the prod default of 10.
- [ ] Confirm the marketing pricing tiers (Free/Pro/Agency) vs. the real single
      flat price — they currently disagree.

---

## 10. Progress log

Append one line per completed item. Newest last.

```
2026-09-20  Plan written (Opus). Nothing implemented yet.
2026-09-20  Prices revised to Rs2499 / $29.99 (intro Rs99 / $1 retained).
2026-09-20  Cashfree dashboard audited: IPG rejected, Global Collections not viable,
            IPG sandbox available -> C4 unblocked for build+test. A8 (decimals) added.
2026-09-20  SHIPPED (partial A5): BASE_AMOUNT 2000 -> 2499 in
            spurly.backend/src/platform/subscriptions/service.js, plus two stale
            price comments (service.js:16, model.js:31). Lint clean, 613/613 tests
            pass. Uncommitted on master. USD deferred by Sarthak's call.
            OPEN: the FIRSTMONTH promo row is still Rs100 in the DB, not Rs99.
2026-09-20  D1 SHIPPED (spurly.backend, feat/onboarding-linkedin-audience):
            onboardingStage enum ['survey','linkedin','audience','install','done']
            added to User, default null, no backfill. completeOnboarding now also
            sets it to 'linkedin'. New setOnboardingStage(userId, stage) +
            POST /api/auth/onboarding/stage for the LinkedIn/audience pages to
            advance it explicitly. authenticateUser's login response now includes
            onboardingStage (LoginPage routes off the login response directly,
            no refetch in between). Lint clean, 613/613 tests pass.
2026-09-20  D2 SHIPPED (spurly.backend, feat/onboarding-linkedin-audience):
            createLinkForUser(userId, { returnTo }) allow-lists returnTo against
            ['/dashboard/settings/linkedin','/onboarding/linkedin'] in linkUrls(),
            defaulting to the settings path; the URL is always built server-side
            from FRONTEND_URL, never interpolated from the client. POST
            /hub/account/link now forwards req.body.returnTo. Lint clean,
            613/613 tests pass.
2026-09-20  D3 SHIPPED (spurly.web, feat/onboarding-linkedin-audience):
            new OnboardingLinkedInPage.jsx at /onboarding/linkedin (ProtectedRoute
            + SubscribeGate, same as every other onboarding page); reads status
            with a plain GET (accountController.get), Connect button opens hosted
            auth via POST /hub/account/link with returnTo='/onboarding/linkedin'
            (gateway/controller extended to take an optional returnTo). Stepper
            (AuthShell.jsx) now has 5 labels; OnboardingSurveyPage and
            InstallExtensionPage updated to steps 2/5 and 5/5. postAuthDestination
            is now onboardingStage-aware (falls through to the legacy rule when
            null, per §7.5); entities/User.js carries onboardingStage; new
            auth gateway/controller/context setOnboardingStage() wired end to end
            for the pages that advance it (D4/D5/E3). OnboardingSurveyPage's
            post-submit and already-onboarded-redirect paths now route through
            postAuthDestination instead of a hardcoded /onboarding/install.
            Lint clean (0 errors); vitest 81/93 passing -- the 12 failures
            (hub.leads/campaigns/inbox/linkedinSettings) are PRE-EXISTING and
            reproduce identically with this branch's routes.jsx/AuthContext.jsx
            changes reverted; not caused by this work and out of D/E scope.
            vite build succeeds, OnboardingLinkedInPage in its own chunk.
2026-09-20  D4 SHIPPED (spurly.web, feat/onboarding-linkedin-audience):
            OnboardingLinkedInPage now reads ?linked=1/0 on return from hosted
            auth (opened in a NEW tab by handleConnect, same as the settings
            page), strips the param, and on linked=1 calls refresh() (POST
            /hub/account/refresh -- the vendor pull), retrying up to 2 more
            times at 5s apart when the vendor hasn't caught up yet -- never a
            plain re-read of our own row, which is the one place that has not
            heard about the connection yet (D4 / PLAN §7.6). Once connected
            (from the redirect pull OR already-connected-on-load), the page
            advances onboardingStage to 'audience' exactly once and auto-
            continues to /onboarding/audience after a short confirmation,
            same shape as InstallExtensionPage's install confirmation. Added
            an "Already connected? Check again" manual refresh for when the
            callback is still missing after the retries. Lint clean (0 new
            errors); vitest 81/93 (same 12 pre-existing failures, unchanged);
            vite build succeeds.
2026-09-20  D5 SHIPPED (spurly.web, feat/onboarding-linkedin-audience) --
            PHASE D COMPLETE (5/5): OnboardingLinkedInPage now has a visible,
            non-apologetic "I'll connect LinkedIn later" control. It advances
            onboardingStage to 'audience' (same as a successful connect) and
            navigates to /onboarding/audience, so a hosted-auth failure or a
            user who just doesn't want to connect yet is never trapped on
            this page (PLAN §5 / D5). Lint clean (0 new errors); vitest 81/93
            (same 12 pre-existing failures); vite build succeeds.
```
