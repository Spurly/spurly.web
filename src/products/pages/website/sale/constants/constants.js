/* Demo-only rolling sale countdown (local dev / VITE_DEMO_COUNTDOWN=true). */
export const DEMO_SALE_STORAGE_KEY = "spurly_demo_sale_start";
export const DEMO_SALE_DURATION_MS = 2 * 24 * 60 * 60 * 1000;

/* Launch-offer popup: how long after the page opens it slides in, and the
   sessionStorage key that remembers it was closed (so it never nags in one visit). */
export const OFFER_POPUP_DELAY_MS = 4000;
export const OFFER_POPUP_DISMISSED_KEY = "spurly_offer_popup_closed";
