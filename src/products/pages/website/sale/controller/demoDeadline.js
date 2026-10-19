import { DEMO_SALE_STORAGE_KEY, DEMO_SALE_DURATION_MS } from "../constants/constants.js";

/** Demo mode only: a 2-day deadline that starts the first time this browser opens
 *  the page and counts down across visits. Once it has run out it starts a fresh
 *  2 days. Returns an ISO string. Never used in a production build, where the
 *  fixed shared deadline in pricing.js applies. */
export function getDemoDeadline(now = Date.now()) {
  let start = now;
  try {
    const saved = Number(window.localStorage.getItem(DEMO_SALE_STORAGE_KEY));
    if (saved && now - saved < DEMO_SALE_DURATION_MS && saved <= now) {
      start = saved;
    } else {
      window.localStorage.setItem(DEMO_SALE_STORAGE_KEY, String(now));
    }
  } catch {
    // storage blocked: fall back to a deadline 2 days from now
  }
  return new Date(start + DEMO_SALE_DURATION_MS).toISOString();
}
