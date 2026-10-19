/* The public price, in one place. Plain ESM, no JSX / window, so structured
   data and components can both import it. These are the real Razorpay plan
   amounts (SEO_CONTENT_PLAN §5); update here if the plans change. */

export const TRIAL_DAYS = 7;

export const PRICES = {
  INTL: { currency: "USD", amount: "24.99", label: "$24.99" },
  IN: { currency: "INR", amount: "2499", label: "₹2,499" },
};

export function priceFor(region) {
  return region === "IN" ? PRICES.IN : PRICES.INTL;
}

/* Launch sale, shown on the public pages only (frontend display; checkout is separate).
   Flip `enabled` to false to hide it everywhere. `endsAt` is an ISO date with offset,
   e.g. "2026-10-31T23:59:59+05:30"; leave it null to show "Sale live" with no countdown.
   Never put a rolling or per-visitor deadline here. */
export const SALE = {
  enabled: true,
  label: "Launch sale",
  endsAt: null,
  // Repeating sale: one shared schedule for every visitor (not per browser). A new
  // 2-day round starts the moment the last one ends, at the same price. Rounds are
  // counted from `anchor`, so everyone sees the same end time. Set to null to use
  // a single fixed `endsAt` instead.
  cycle: { anchor: "2026-10-19T23:00:00+05:30", periodMs: 2 * 24 * 60 * 60 * 1000 },
  prices: {
    INTL: { amount: "11", label: "$11" },
    IN: { amount: "499", label: "₹499" },
  },
};

/* Demo mode: local dev (or VITE_DEMO_COUNTDOWN=true) shows a rolling 2-day
   countdown per browser, for showing the page to teammates. A production build
   has DEV false, so real visitors only ever see the fixed `endsAt` above. */
export const DEMO_ROLLING_SALE = Boolean(import.meta.env?.DEV) || import.meta.env?.VITE_DEMO_COUNTDOWN === "true";

/** End of the sale round that is running at `now` (ISO string), or null when the
 *  sale does not repeat. Same answer for every visitor. */
export function currentSaleEnd(now = Date.now()) {
  const c = SALE.cycle;
  if (!c) return null;
  const start = Date.parse(c.anchor);
  const rounds = Math.max(0, Math.floor((now - start) / c.periodMs)) + 1;
  return new Date(start + rounds * c.periodMs).toISOString();
}

/** The live sale for a region, or null when disabled or past `endsAt`.
 *  In demo mode the sale never ends (the countdown rolls instead). */
export function saleFor(region, now = Date.now(), { demo = DEMO_ROLLING_SALE } = {}) {
  if (!SALE.enabled) return null;
  const endsAt = SALE.cycle ? currentSaleEnd(now) : SALE.endsAt;
  if (!SALE.cycle && !demo && endsAt && now >= Date.parse(endsAt)) return null;
  const list = priceFor(region);
  const sale = region === "IN" ? SALE.prices.IN : SALE.prices.INTL;
  const percentOff = Math.round((1 - Number(sale.amount) / Number(list.amount)) * 100);
  return { label: SALE.label, listLabel: list.label, saleLabel: sale.label, percentOff, endsAt };
}

/** The exact trial copy (SEO_CONTENT_PLAN section 5). Use it verbatim wherever the trial is mentioned. */
export const TRIAL_NOTE =
  "No card needed to start your 7-day free trial. Subscribe when it ends to keep going, and cancel anytime.";
