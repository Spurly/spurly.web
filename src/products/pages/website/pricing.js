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
  prices: {
    INTL: { amount: "11", label: "$11" },
    IN: { amount: "499", label: "₹499" },
  },
};

/** The live sale for a region, or null when disabled or past `endsAt`. */
export function saleFor(region, now = Date.now()) {
  if (!SALE.enabled) return null;
  if (SALE.endsAt && now >= Date.parse(SALE.endsAt)) return null;
  const list = priceFor(region);
  const sale = region === "IN" ? SALE.prices.IN : SALE.prices.INTL;
  const percentOff = Math.round((1 - Number(sale.amount) / Number(list.amount)) * 100);
  return { label: SALE.label, listLabel: list.label, saleLabel: sale.label, percentOff, endsAt: SALE.endsAt };
}

/** The exact trial copy (SEO_CONTENT_PLAN section 5). Use it verbatim wherever the trial is mentioned. */
export const TRIAL_NOTE =
  "No card needed to start your 7-day free trial. Subscribe when it ends to keep going, and cancel anytime.";
