/* ============================================================
   Single source of truth for the public site's SEO.

   Plain ESM with RELATIVE imports only (no `src/` alias, no JSX):
   scripts/prerender.mjs imports this file straight from Node to
   decide which URLs to prerender and to write sitemap.xml, so the
   route list, the prerendered pages and the sitemap cannot drift.

   Adding a public page = add a route in src/app/routes.jsx AND an
   entry in PUBLIC_ROUTES below. tests/seo.routes.test.jsx fails if
   the two disagree.
   ============================================================ */
import { POSTS } from "./blogPosts.js";

export const SITE_URL = "https://www.getspurly.com";
export const SITE_NAME = "Spurly";
export const DEFAULT_OG_IMAGE = SITE_URL + "/assets/shot-reachout.png";

/** Absolute URL for a site path ("/blog" -> "https://www.getspurly.com/blog"). */
export function absoluteUrl(path = "/") {
  return path === "/" ? SITE_URL + "/" : SITE_URL + path;
}

/** Every public, indexable URL. `lastmod` is YYYY-MM-DD. */
export const PUBLIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: 1.0, lastmod: "2026-09-23" },
  { path: "/blog", changefreq: "weekly", priority: 0.8, lastmod: latestPostDate() },
  ...POSTS.map((p) => ({
    path: "/blog/" + p.slug,
    changefreq: "monthly",
    priority: 0.7,
    lastmod: p.updated || p.date,
  })),
  { path: "/support", changefreq: "monthly", priority: 0.5, lastmod: "2026-06-21" },
  { path: "/privacy", changefreq: "yearly", priority: 0.3, lastmod: "2026-06-21" },
  { path: "/terms", changefreq: "yearly", priority: 0.3, lastmod: "2026-06-21" },
];

function latestPostDate() {
  return POSTS.map((p) => p.updated || p.date).sort().at(-1);
}

/** Organization + WebSite — who publishes the site. Rendered on the home page. */
export const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL + "/",
  logo: SITE_URL + "/assets/spurly-icon-lg.png",
};

export const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL + "/",
};

/** BreadcrumbList for a trail of [name, path] pairs. */
export function breadcrumbLd(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}
