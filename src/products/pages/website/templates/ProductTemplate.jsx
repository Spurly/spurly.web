import PageLayout from "./PageLayout.jsx";
import { ChromeCta } from "./parts.jsx";

/* /product/* pages (see SEO_CONTENT_PLAN section 6 for the outline).
   `chromeCta: true` in the frontmatter adds the tracked Add to Chrome button. */
export default function ProductTemplate({ meta, body }) {
  return <PageLayout meta={meta} body={body} eyebrow="Product" after={meta.chromeCta ? <ChromeCta /> : null} />;
}
