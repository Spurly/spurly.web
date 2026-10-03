import { Link } from "react-router-dom";

/* Renders the block tree produced by scripts/contentParser.mjs. Content stays
   data; this is the only place that turns it into markup. No raw HTML ever
   reaches the page, and nothing here touches window/document (prerender-safe). */

const isInternal = (href) => href.startsWith("/") && !href.startsWith("//") && !href.includes("#");

export function Inline({ nodes }) {
  return nodes.map((n, i) => {
    if (typeof n === "string") return n;
    const kids = n.children ? <Inline nodes={n.children} /> : null;
    switch (n.t) {
      case "strong":
        return <strong key={i}>{kids}</strong>;
      case "em":
        return <em key={i}>{kids}</em>;
      case "code":
        return <code key={i}>{n.text}</code>;
      case "link":
        return isInternal(n.href) ? (
          <Link key={i} to={n.href}>{kids}</Link>
        ) : (
          <a key={i} href={n.href} {...(/^https?:/.test(n.href) ? { rel: "noopener" } : {})}>{kids}</a>
        );
      default:
        return null;
    }
  });
}

function Block({ block }) {
  switch (block.type) {
    case "h2":
      return <h2 id={block.id}><Inline nodes={block.inline} /></h2>;
    case "h3":
      return <h3 id={block.id}><Inline nodes={block.inline} /></h3>;
    case "p":
      return <p><Inline nodes={block.inline} /></p>;
    case "ul":
      return <ul>{block.items.map((it, i) => <li key={i}><Inline nodes={it} /></li>)}</ul>;
    case "ol":
      return <ol>{block.items.map((it, i) => <li key={i}><Inline nodes={it} /></li>)}</ol>;
    case "quote":
      return <blockquote><p><Inline nodes={block.inline} /></p></blockquote>;
    case "image":
      return (
        <figure className="content-figure">
          <img src={block.src} alt={block.alt} loading="lazy" decoding="async" />
        </figure>
      );
    case "table":
      return (
        <div className="content-table">
          <table>
            <thead>
              <tr>{block.head.map((c, i) => <th key={i} scope="col"><Inline nodes={c} /></th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => (ci === 0 ? <th key={ci} scope="row"><Inline nodes={c} /></th> : <td key={ci}><Inline nodes={c} /></td>))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export default function ContentBody({ blocks }) {
  return blocks.map((b, i) => <Block key={i} block={b} />);
}
