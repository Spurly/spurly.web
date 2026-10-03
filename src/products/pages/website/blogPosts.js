/* Blog post metadata for the blog index and cross-links. The posts themselves
   are content files (content/blog/*.md); this just reads their frontmatter, so
   a new .md in content/blog shows up here and in the index automatically. */
import { CONTENT_META } from "./content/content.meta.generated.js";

export const POSTS = CONTENT_META
  .filter((p) => p.path.startsWith("/blog/"))
  .map((p) => ({ ...p, slug: p.path.slice("/blog/".length) }))
  .sort((a, b) => a.date.localeCompare(b.date));

export function getPost(slug) {
  return POSTS.find((p) => p.slug === slug);
}

export function otherPosts(slug) {
  return POSTS.filter((p) => p.slug !== slug);
}

export function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
