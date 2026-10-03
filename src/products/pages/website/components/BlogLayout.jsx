import { Link } from "react-router-dom";
import { usePrice } from "../hooks/usePrice.js";
import Seo from "./Seo.jsx";
import { absoluteUrl, breadcrumbLd } from "../seo.js";
import ContentShell from "./ContentShell.jsx";
import { getPost, otherPosts, formatDate } from "../blogPosts.js";


/* Wraps a blog post body with the shell, per-post SEO meta + Article JSON-LD,
   post header, a CTA, and links to the other posts (internal linking). */
export default function BlogLayout({ slug, children }) {
  const price = usePrice();
  const post = getPost(slug);
  const related = otherPosts(slug);
  const path = "/blog/" + slug;
  const url = absoluteUrl(path);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { "@type": "Organization", name: "Spurly" },
    publisher: {
      "@type": "Organization",
      name: "Spurly",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/spurly-icon-lg.png"),
      },
    },
    mainEntityOfPage: url,
  };

  return (
    <ContentShell>
      <Seo
        title={post.title + " | Spurly"}
        description={post.description}
        path={path}
        type="article"
        publishedTime={post.date}
        modifiedTime={post.updated || post.date}
        jsonLd={[
          articleLd,
          breadcrumbLd([["Home", "/"], ["Blog", "/blog"], [post.shortTitle, path]]),
        ]}
      />

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
            Spurly runs your LinkedIn outreach for you — find the right people,
            connect, follow up and reply from one inbox. 7-day free trial, then
            {price.label}/month.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Start 7-day free trial
          </Link>
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
