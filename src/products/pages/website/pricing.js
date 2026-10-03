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
