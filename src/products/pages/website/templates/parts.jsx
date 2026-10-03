import { Link } from "react-router-dom";
import { usePrice } from "../hooks/usePrice.js";
import { TRIAL_NOTE } from "../pricing.js";
import { PUBLIC_ROUTES } from "../seo.js";
import { getAuthor } from "../authors.js";
import { formatDate } from "../blogPosts.js";
import { trailFor, relatedPages, splitSections } from "./seoParts.js";
import ContentBody from "../components/ContentBody.jsx";
import { ChromeLink } from "../components/Button.jsx";

/* Building blocks shared by every page template. Pure render, no window/document. */

export function Breadcrumbs({ meta }) {
  const trail = trailFor(meta);
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.map(([name, path], i) => (
        <span key={path}>
          {i > 0 && <span aria-hidden="true"> / </span>}
          {i < trail.length - 1 ? <Link to={path}>{name}</Link> : <span aria-current="page">{name}</span>}
        </span>
      ))}
    </nav>
  );
}

export function LastUpdated({ meta }) {
  return (
    <p className="last-updated">
      Last updated <time dateTime={meta.updated}>{formatDate(meta.updated)}</time>
    </p>
  );
}

/** "Written by ..." box. Renders only for a page with a known `author`. */
export function AuthorBox({ meta }) {
  const author = getAuthor(meta.author);
  if (!author) return null;
  const hasPage = PUBLIC_ROUTES.some((r) => r.path === author.path);
  return (
    <aside className="author-box" aria-label="About the author">
      <img src={author.image} alt={author.name} width="56" height="56" loading="lazy" decoding="async" />
      <p>
        <strong>{hasPage ? <Link to={author.path}>{author.name}</Link> : author.name}</strong>
        <span> · {author.role}</span>
        <br />
        <span>{author.blurb}</span>
      </p>
    </aside>
  );
}

export function RelatedPages({ meta }) {
  const pages = relatedPages(meta);
  if (!pages.length) return null;
  return (
    <div className="blog-related">
      <h2>{meta.path.startsWith("/blog/") ? "Keep reading" : "Related"}</h2>
      <ul>
        {pages.map((p) => (
          <li key={p.path}><Link to={p.path}>{p.title}</Link></li>
        ))}
      </ul>
    </div>
  );
}

/** Visible FAQ (answer-first Q/A, readable by crawlers and AI) from frontmatter `faq`. */
export function FaqBlock({ meta }) {
  if (!meta.faq?.length) return null;
  return (
    <section className="faq-block" aria-labelledby="faq">
      <h2 id="faq">Frequently asked questions</h2>
      {meta.faq.map((f) => (
        <div key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
    </section>
  );
}

/** Full-width CTA after the main content. */
export function CtaBand({ title = "Try it yourself" }) {
  const price = usePrice();
  return (
    <div className="blog-cta">
      <h2>{title}</h2>
      <p>
        Spurly runs your LinkedIn outreach for you — find the right people, connect, follow up and reply
        from one inbox. 7-day free trial, then {price.label}/month.
      </p>
      <Link to="/signup" className="btn btn-primary btn-lg">Start 7-day free trial</Link>
      <p className="trial-note-inline">{TRIAL_NOTE}</p>
    </div>
  );
}

/** One-line CTA used between sections. */
export function InlineCta() {
  const price = usePrice();
  return (
    <p className="inline-cta">
      <Link to="/signup">Start 7-day free trial, then {price.label}/month →</Link>
    </p>
  );
}

/** Body with a one-line CTA after each main section (all but the last, which the CtaBand follows). */
export function SectionedBody({ blocks, inlineCtas = true }) {
  const groups = splitSections(blocks);
  return groups.map((g, i) => (
    <div key={i} className="content-section">
      <ContentBody blocks={g} />
      {inlineCtas && g[0].type === "h2" && i < groups.length - 1 && <InlineCta />}
    </div>
  ));
}

/** "Add to Chrome" button (tracked: UTM + add_to_chrome_click). Shown when frontmatter has `chromeCta: true`. */
export function ChromeCta() {
  return (
    <p className="chrome-cta">
      <ChromeLink variant="ghost" size="lg">Add to Chrome</ChromeLink>
    </p>
  );
}
