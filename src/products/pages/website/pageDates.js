/* When each non-blog public page's visible content last changed (YYYY-MM-DD).
   This is what sitemap.xml reports as <lastmod>. It is a content date, kept by
   hand on purpose: stamping the build date on every page would tell Google
   that everything changes on every deploy, and it learns to ignore lastmod.
   Bump a page's date when its visible text changes, not for code-only edits.
   Blog posts carry their own `date` / `updated` in blogPosts.js. */
export const PAGE_UPDATED = {
  "/": "2026-10-05", // home v3: new positioning, 7 sections, new CTAs and FAQ
  "/book-demo": "2026-10-04", // new demo booking page (Calendly)
  "/support": "2026-10-03", // FAQ rewritten (T0.1)
  "/privacy": "2026-10-03", // data-storage wording corrected
  "/terms": "2026-10-03", // plan wording corrected (single plan, 7-day trial)
};
