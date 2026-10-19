import { usePublicRegion } from "src/core/billing/hooks/usePublicRegion.js";
import { priceFor, saleFor } from "../pricing.js";

/** Region-aware price for public pages: USD until the visitor is known to be in India.
 *  `sale` is the live launch sale (or null); `now` is the price to show in running text. */
export function usePrice() {
  const region = usePublicRegion();
  const base = priceFor(region);
  const sale = saleFor(region);
  return { region, ...base, sale, now: sale ? sale.saleLabel : base.label };
}
