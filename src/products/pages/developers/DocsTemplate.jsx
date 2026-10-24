import { Link, useLocation } from "react-router-dom";
import Seo from "../website/components/Seo.jsx";
import ContentShell from "../website/components/ContentShell.jsx";
import { Inline } from "../website/components/ContentBody.jsx";
import ContentBody from "../website/components/ContentBody.jsx";
import { webPageLd, trailLd } from "../website/templates/seoParts.js";
import { docsNav, docsSequence } from "./nav.js";
import { Embed, tocFor } from "./Embeds.jsx";

/* Developer docs layout: sidebar (all docs pages by section), the page, and an
   "On this page" list. The body is the usual content blocks plus `::directive`
   embeds rendered from the OpenAPI spec. */

function DocsBody({ blocks }) {
  // Consecutive ordinary blocks render through the site's ContentBody; embeds
  // render through the spec-driven components.
  const out = [];
  let run = [];
  const flush = () => {
    if (run.length) out.push(<ContentBody key={`b${out.length}`} blocks={run} />);
    run = [];
  };
  for (const block of blocks) {
    if (block.type === "embed") {
      flush();
      out.push(<Embed key={`e${out.length}`} block={block} />);
    } else {
      run.push(block);
    }
  }
  flush();
  return out;
}

function SideNav({ current }) {
  return (
    <nav className="docs-nav" aria-label="Developer docs">
      {docsNav().map((section) => (
        <div key={section.name} className="docs-nav-section">
          <p className="docs-nav-title">{section.name}</p>
          <ul>
            {section.pages.map((p) => (
              <li key={p.path}>
                <Link to={p.path} aria-current={p.path === current ? "page" : undefined}>{p.navTitle || p.shortTitle || p.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Toc({ blocks }) {
  const items = blocks.flatMap(tocFor);
  if (items.length < 2) return null;
  return (
    <nav className="docs-toc" aria-label="On this page">
      <p className="docs-nav-title">On this page</p>
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`}>{it.label ? <Inline nodes={it.label} /> : it.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function PrevNext({ path }) {
  const seq = docsSequence();
  const i = seq.findIndex((p) => p.path === path);
  const prev = i > 0 ? seq[i - 1] : null;
  const next = i >= 0 && i < seq.length - 1 ? seq[i + 1] : null;
  if (!prev && !next) return null;
  return (
    <nav className="docs-prevnext" aria-label="Previous and next">
      {prev ? <Link to={prev.path}><span>Previous</span>{prev.navTitle || prev.title}</Link> : <span />}
      {next ? <Link to={next.path} className="next"><span>Next</span>{next.navTitle || next.title}</Link> : <span />}
    </nav>
  );
}

export default function DocsTemplate({ meta, body }) {
  const { pathname } = useLocation();
  const current = meta.path || pathname;
  const title = meta.navTitle || meta.shortTitle || meta.title;
  return (
    <ContentShell>
      <Seo
        title={meta.seoTitle || `${meta.title} | Spurly API`}
        description={meta.description}
        path={meta.path}
        modifiedTime={meta.updated}
        jsonLd={[webPageLd(meta), trailLd(meta)].filter(Boolean)}
      />
      <div className="docs-wrap">
        <aside className="docs-side">
          <details className="docs-side-mobile">
            <summary>Developer docs: {title}</summary>
            <SideNav current={current} />
          </details>
          <div className="docs-side-desktop">
            <SideNav current={current} />
          </div>
        </aside>

        <article className="docs-main prose">
          <p className="crumbs">
            <Link to="/developers">Developers</Link>
            <span aria-hidden="true"> / </span>
            <span>{meta.section}</span>
          </p>
          <h1 className="h1">{meta.title}</h1>
          {meta.lead && <p className="docs-lead">{meta.lead}</p>}
          <DocsBody blocks={body} />
          <PrevNext path={current} />
          <p className="docs-help">
            Questions or need a key? Email <a href="mailto:founders@getspurly.com">founders@getspurly.com</a> or <Link to="/book-demo">book a call</Link>.
          </p>
        </article>

        <div className="docs-toc-col">
          <Toc blocks={body} />
        </div>
      </div>
    </ContentShell>
  );
}
