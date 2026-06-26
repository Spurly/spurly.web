import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ContentShell from "../components/ContentShell.jsx";
import { POSTS, formatDate } from "../blogPosts.js";

export default function BlogIndex() {
  return (
    <ContentShell>
      <Helmet>
        <title>Blog — LinkedIn outreach &amp; prospecting guides | Spurly</title>
        <meta
          name="description"
          content="Practical guides on LinkedIn outreach, Sales Navigator prospecting, and building a pipeline — from the team behind Spurly."
        />
        <link rel="canonical" href="https://www.getspurly.com/blog" />
      </Helmet>

      <div className="prose wrap">
        <p className="eyebrow">Blog</p>
        <h1 className="h1">Outreach &amp; prospecting, done right</h1>
        <p>
          Practical playbooks on LinkedIn outreach, Sales Navigator prospecting,
          and building a pipeline that actually replies — from the team behind{" "}
          <Link to="/">Spurly</Link>.
        </p>

        <div className="blog-list">
          {POSTS.map((p) => (
            <article key={p.slug} className="blog-card">
              <p className="prose-meta">
                {formatDate(p.date)} · {p.readTime}
              </p>
              <h2>
                <Link to={"/blog/" + p.slug}>{p.title}</Link>
              </h2>
              <p>{p.excerpt}</p>
              <Link className="blog-readmore" to={"/blog/" + p.slug}>
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </ContentShell>
  );
}
