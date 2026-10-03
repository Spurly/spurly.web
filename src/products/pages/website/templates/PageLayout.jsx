import Seo from "../components/Seo.jsx";
import ContentShell from "../components/ContentShell.jsx";
import {
  Breadcrumbs, LastUpdated, AuthorBox, RelatedPages, FaqBlock, CtaBand, SectionedBody,
} from "./parts.jsx";
import { trailLd, faqLd, webPageLd } from "./seoParts.js";

/* Shared layout for every non-article template (product, solutions, comparison,
   pricing, tool, generic page). Exactly one H1, breadcrumbs, last-updated, a CTA
   after each main section, FAQ, author box, related pages, final CTA.
   `before` / `after` slots let a template add its own block around the body. */
export default function PageLayout({ meta, body, eyebrow, before = null, after = null, extraLd = [], inlineCtas = true }) {
  return (
    <ContentShell>
      <Seo
        title={meta.seoTitle || meta.title + " | Spurly"}
        description={meta.description}
        path={meta.path}
        modifiedTime={meta.updated}
        jsonLd={[webPageLd(meta), trailLd(meta), faqLd(meta), ...extraLd].filter(Boolean)}
      />
      <article className="prose wrap content-page-body">
        <Breadcrumbs meta={meta} />
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="h1">{meta.title}</h1>
        <LastUpdated meta={meta} />
        {before}
        <SectionedBody blocks={body} inlineCtas={inlineCtas} />
        {after}
        <FaqBlock meta={meta} />
        <CtaBand title={meta.ctaTitle} />
        <AuthorBox meta={meta} />
        <RelatedPages meta={meta} />
      </article>
    </ContentShell>
  );
}
