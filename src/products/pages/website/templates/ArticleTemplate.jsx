import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import ContentShell from "../components/ContentShell.jsx";
import ContentBody from "../components/ContentBody.jsx";
import { absoluteUrl } from "../seo.js";
import { formatDate } from "../blogPosts.js";
import { AuthorBox, FaqBlock, CtaBand, RelatedPages, LastUpdated } from "./parts.jsx";
import { trailLd, faqLd, authorLd } from "./seoParts.js";

/* Article template (blog posts). */
export default function ArticleTemplate({ meta, body }) {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    dateModified: meta.updated,
    author: authorLd(meta),
    publisher: {
      "@type": "Organization",
      name: "Spurly",
      logo: { "@type": "ImageObject", url: absoluteUrl("/assets/spurly-icon-lg.png") },
    },
    mainEntityOfPage: absoluteUrl(meta.path),
  };

  return (
    <ContentShell>
      <Seo
        title={meta.seoTitle || meta.title + " | Spurly"}
        description={meta.description}
        path={meta.path}
        type="article"
        publishedTime={meta.date}
        modifiedTime={meta.updated}
        jsonLd={[articleLd, trailLd(meta), faqLd(meta)].filter(Boolean)}
      />

      <article className="prose wrap">
        <p className="prose-meta">
          <Link to="/blog">Blog</Link> · {formatDate(meta.date)} · {meta.readTime}
        </p>
        <h1 className="h1">{meta.title}</h1>
        {meta.updated !== meta.date && <LastUpdated meta={meta} />}

        <ContentBody blocks={body} />

        <FaqBlock meta={meta} />
        <CtaBand />
        <AuthorBox meta={meta} />
        <RelatedPages meta={meta} />
      </article>
    </ContentShell>
  );
}
