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
import { PAGE_UPDATED } from "./pageDates.js";

export const SITE_URL = "https://www.getspurly.com";
export const SITE_NAME = "Spurly";
export const DEFAULT_OG_IMAGE = SITE_URL + "/assets/shot-reachout.png";

/** File name (no extension) of a page's OG card: "/" -> "home", "/blog/x" -> "blog-x".
 *  scripts/ogImages.mjs writes dist/og/<slug>.png with this same name. */
export function ogSlug(path = "/") {
  return path === "/" ? "home" : path.replace(/^\/|\/$/g, "").replace(/\//g, "-");
}

/** Absolute URL of a page's own 1200x630 card (generated at build time). */
export function ogImageFor(path = "/") {
  return `${SITE_URL}/og/${ogSlug(path)}.png`;
}

/** Absolute URL for a site path ("/blog" -> "https://www.getspurly.com/blog"). */
export function absoluteUrl(path = "/") {
  return path === "/" ? SITE_URL + "/" : SITE_URL + path;
}

/** Every public, indexable URL. `lastmod` is YYYY-MM-DD. */
export const PUBLIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: 1.0, lastmod: PAGE_UPDATED["/"] },
  { path: "/blog", changefreq: "weekly", priority: 0.8, lastmod: latestPostDate() },
  ...POSTS.map((p) => ({
    path: "/blog/" + p.slug,
    changefreq: "monthly",
    priority: 0.7,
    lastmod: p.updated || p.date,
  })),
  { path: "/support", changefreq: "monthly", priority: 0.5, lastmod: PAGE_UPDATED["/support"] },
  { path: "/privacy", changefreq: "yearly", priority: 0.3, lastmod: PAGE_UPDATED["/privacy"] },
  { path: "/terms", changefreq: "yearly", priority: 0.3, lastmod: PAGE_UPDATED["/terms"] },
];

function latestPostDate() {
  return POSTS.map((p) => p.updated || p.date).sort().at(-1);
}

/** Organization + WebSite — who publishes the site. Rendered on the home page. */
/** Profiles that tell Google which "Spurly" this is. Only real, live URLs
 *  (no X account exists). TODO: add Product Hunt once the listing is live. */
export const SAME_AS = [
  "https://www.linkedin.com/company/spurly/",
  "https://chromewebstore.google.com/detail/dcohpfeaohfiiinjjiinojlbnnfmihoh",
];

export const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  legalName: "ArkTech Catalyst",
  url: SITE_URL + "/",
  logo: SITE_URL + "/assets/spurly-icon-lg.png",
  description:
    "Spurly runs LinkedIn outreach for you: find the right people, connect, follow up and reply from one inbox, from the cloud and at a safe daily pace.",
  sameAs: SAME_AS,
  foundingDate: "2026",
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
