import { CONTENT_META } from "../website/content/content.meta.generated.js";

/* The developer sidebar, built from the docs pages' own frontmatter
   (`section`, `order`, `navTitle`). Adding a page adds it to the menu. */

export const SECTION_ORDER = ["Get started", "Guides", "API reference", "Webhooks", "Resources"];

export function docsPages() {
  return CONTENT_META.filter((p) => p.template === "docs");
}

export function docsNav() {
  const pages = docsPages();
  const sections = [...new Set([...SECTION_ORDER, ...pages.map((p) => p.section)])];
  return sections
    .map((name) => ({
      name,
      pages: pages
        .filter((p) => p.section === name)
        .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99) || a.title.localeCompare(b.title)),
    }))
    .filter((s) => s.pages.length);
}

/** Pages in sidebar order, for previous / next links. */
export function docsSequence() {
  return docsNav().flatMap((s) => s.pages);
}
