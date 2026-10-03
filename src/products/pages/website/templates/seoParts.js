import { CONTENT_META } from "../content/content.meta.generated.js";
import { breadcrumbLd, absoluteUrl } from "../seo.js";
import { getAuthor } from "../authors.js";
import { otherPosts } from "../blogPosts.js";

/* Pure helpers for the page templates (kept out of parts.jsx so that file only
   exports components). No window/document: safe to run during prerender. */

const SECTION_LABELS = { product: "Product", solutions: "Solutions", compare: "Compare", tools: "Tools" };

/** Breadcrumb trail [name, path][] for a content page: Home > (parent) > page. */
export function trailFor(meta) {
  const crumb = meta.shortTitle || meta.title;
  const parent = meta.parent || (meta.path.startsWith("/blog/") ? "/blog" : null);
  const trail = [["Home", "/"]];
  if (parent) {
    const hub = CONTENT_META.find((p) => p.path === parent);
    trail.push([hub ? hub.shortTitle || hub.title : parent === "/blog" ? "Blog" : SECTION_LABELS[parent.slice(1)] || parent, parent]);
  }
  trail.push([crumb, meta.path]);
  return trail;
}

export function trailLd(meta) {
  return breadcrumbLd(trailFor(meta));
}

/** Author for Article JSON-LD: a Person when the page names one, else the organisation. */
export function authorLd(meta) {
  const author = getAuthor(meta.author);
  return author
    ? { "@type": "Person", name: author.name, url: absoluteUrl(author.path), sameAs: [author.linkedin] }
    : { "@type": "Organization", name: "Spurly" };
}

/** Full Person entity for the about and author pages. */
export function personLd(key) {
  const author = getAuthor(key);
  if (!author) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    jobTitle: "Founder",
    image: absoluteUrl(author.image),
    url: absoluteUrl(author.path),
    sameAs: [author.linkedin],
    worksFor: { "@type": "Organization", name: "Spurly", url: absoluteUrl("/") },
  };
}

/** Related pages: the `related` frontmatter paths, else (articles) the other posts. */
export function relatedPages(meta) {
  if (meta.related?.length) {
    return meta.related.map((path) => CONTENT_META.find((p) => p.path === path)).filter(Boolean);
  }
  return meta.path.startsWith("/blog/") ? otherPosts(meta.path.slice("/blog/".length)) : [];
}

export function faqLd(meta) {
  if (!meta.faq?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** WebPage entity for non-article templates. */
export function webPageLd(meta) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta.title,
    description: meta.description,
    url: absoluteUrl(meta.path),
    dateModified: meta.updated,
    isPartOf: { "@type": "WebSite", name: "Spurly", url: absoluteUrl("/") },
  };
}

/** Splits blocks at each h2: the intro, then one group per section. */
export function splitSections(blocks) {
  const groups = [[]];
  for (const b of blocks) {
    if (b.type === "h2") groups.push([b]);
    else groups[groups.length - 1].push(b);
  }
  return groups.filter((g) => g.length);
}
