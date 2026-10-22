/* The public price, in one place. Plain ESM, no JSX / window, so structured
   data and components can both import it. These are the real Razorpay plan
   amounts (SEO_CONTENT_PLAN §5); update here if the plans change. */

export const TRIAL_DAYS = 7;

export const PRICES = {
  INTL: { currency: "USD", amount: "24.99", label: "$24.99" }, // regular price
  IN: { currency: "INR", amount: "2499", label: "₹2,499" },
};

export function priceFor(region) {
  return region === "IN" ? PRICES.IN : PRICES.INTL;
}

/* Launch offer, shown on the public pages (display only; the real charge is the Razorpay
   plan the backend uses). It is seat-based, not timed: the first `seats` members lock in
   the launch price for life, so there is deliberately no countdown. Flip `enabled` to
   false when the seats are gone (and swap the backend plan ids to the regular-price plans).
   Never add a rolling or per-visitor deadline here. */
export const SALE = {
  enabled: true,
  label: "Launch offer",
  seats: 100,
  endsAt: null,
  cycle: null,
  prices: {
    INTL: { amount: "14.99", label: "$14.99" },
    IN: { amount: "1499", label: "₹1,499" },
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
  return {
    label: SALE.label,
    listLabel: list.label,
    saleLabel: sale.label,
    percentOff,
    endsAt,
    seats: SALE.seats,
    // One wording for every surface: who gets it, and what "locked" means.
    audience: `first ${SALE.seats} members`,
    lock: "price locked for life",
  };
}

/** The exact trial copy (SEO_CONTENT_PLAN section 5). Use it verbatim wherever the trial is mentioned. */
export const TRIAL_NOTE =
  "No card needed to start your 7-day free trial. Subscribe when it ends to keep going, and cancel anytime.";
