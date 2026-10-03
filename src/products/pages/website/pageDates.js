/* When each non-blog public page's visible content last changed (YYYY-MM-DD).
   This is what sitemap.xml reports as <lastmod>. It is a content date, kept by
   hand on purpose: stamping the build date on every page would tell Google
   that everything changes on every deploy, and it learns to ignore lastmod.
   Bump a page's date when its visible text changes, not for code-only edits.
   Blog posts carry their own `date` / `updated` in blogPosts.js. */
export const PAGE_UPDATED = {
  "/": "2026-10-03", // pricing, claims and CTAs rewritten (T0.1)
  "/support": "2026-10-03", // FAQ rewritten (T0.1)
  "/privacy": "2026-06-21",
  "/terms": "2026-06-21",
};
