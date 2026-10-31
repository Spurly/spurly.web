import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ContentShell from "../components/ContentShell.jsx";
import { POSTS } from "../blogPosts.js";

/* Shown for any URL that isn't a page. Vercel serves the prerendered copy
   (dist/404.html) with a real 404 status for unknown paths, and the in-app
   router renders it for client-side navigation. Not in the sitemap, and
   noindex so a stray link can never put it in search results. */
export default function NotFound() {
  return (
    <ContentShell>
      <Helmet>
        <title>Page not found | Spurly</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <article className="prose wrap">
        <p className="eyebrow">404</p>
        <h1 className="h1">That page doesn't exist.</h1>
        <p>
          The link may be old or mistyped. These are the places most people are
          looking for:
        </p>
        <ul>
          <li><Link to="/">Spurly home</Link>: LinkedIn outreach that runs itself</li>
          <li><a href="/#pricing">Pricing</a>: one plan, 7-day free trial</li>
          <li><a href="/#how">How it works</a></li>
          <li><Link to="/blog">The blog</Link>: LinkedIn outreach guides</li>
          <li><Link to="/support">Support &amp; FAQ</Link></li>
        </ul>
        <h2>Popular guides</h2>
        <ul>
          {POSTS.map((p) => (
            <li key={p.slug}><Link to={"/blog/" + p.slug}>{p.shortTitle}</Link></li>
          ))}
        </ul>
        <p>
          Or <Link to="/signup">start your 7-day free trial</Link>.
        </p>
      </article>
    </ContentShell>
  );
}
