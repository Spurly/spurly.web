import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ContentShell from "./ContentShell.jsx";
import { ChromeLink } from "./Button.jsx";
import { getPost, otherPosts, formatDate } from "../blogPosts.js";

const BASE = "https://www.getspurly.com";

/* Wraps a blog post body with the shell, per-post SEO meta + Article JSON-LD,
   post header, a CTA, and links to the other posts (internal linking). */
export default function BlogLayout({ slug, children }) {
  const post = getPost(slug);
  const related = otherPosts(slug);
  const url = BASE + "/blog/" + slug;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "Spurly" },
    publisher: {
      "@type": "Organization",
      name: "Spurly",
      logo: {
        "@type": "ImageObject",
        url: BASE + "/assets/spurly-icon.png",
      },
    },
    mainEntityOfPage: url,
  };

  return (
    <ContentShell>
      <Helmet>
        <title>{post.title + " | Spurly"}</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
      </Helmet>

      <article className="prose wrap">
        <p className="prose-meta">
          <Link to="/blog">Blog</Link> · {formatDate(post.date)} ·{" "}
          {post.readTime}
        </p>
        <h1 className="h1">{post.title}</h1>

        {children}

        <div className="blog-cta">
          <h2>Try it yourself</h2>
          <p>
            Spurly captures leads from LinkedIn &amp; Sales Navigator, enriches
            them, and sends personalized outreach — in one click. Start free with
            100 credits.
          </p>
          <ChromeLink variant="primary" size="lg">
            Add to Chrome — Start free
          </ChromeLink>
        </div>

        <div className="blog-related">
          <h2>Keep reading</h2>
          <ul>
            {related.map((p) => (
              <li key={p.slug}>
                <Link to={"/blog/" + p.slug}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </ContentShell>
  );
}
