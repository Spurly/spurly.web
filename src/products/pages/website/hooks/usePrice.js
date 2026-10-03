import { usePublicRegion } from "src/core/billing/hooks/usePublicRegion.js";
import { priceFor } from "../pricing.js";

/** Region-aware price for public pages: USD until the visitor is known to be in India. */
export function usePrice() {
  const region = usePublicRegion();
  return { region, ...priceFor(region) };
}
