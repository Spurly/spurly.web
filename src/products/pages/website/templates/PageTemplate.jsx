import PageLayout from "./PageLayout.jsx";
import { personLd } from "./seoParts.js";

/* Generic page (about, security, ...): no eyebrow, no section CTAs. A page that
   names an `author` and is that author's own page also carries a Person entity. */
export default function PageTemplate({ meta, body }) {
  const own = meta.author && (meta.path === "/about" || meta.path === "/blog/author/" + meta.author);
  const extraLd = own ? [personLd(meta.author)] : [];
  return <PageLayout meta={meta} body={body} inlineCtas={false} extraLd={extraLd} />;
}
