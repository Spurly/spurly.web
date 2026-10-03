import PageLayout from "./PageLayout.jsx";
import { formatDate } from "../blogPosts.js";

/* /compare/* pages. The body leads with the verdict and the table (written in
   the content file). The template adds the sourcing block: every competitor fact
   needs a source link and the date it was checked (frontmatter `checked`, `sources`). */
export default function ComparisonTemplate({ meta, body }) {
  const sources = (
    <section className="sources" aria-labelledby="sources">
      <h2 id="sources">Sources and date checked</h2>
      <p>
        Competitor details on this page were checked on{" "}
        <time dateTime={meta.checked}>{formatDate(meta.checked)}</time>. Prices and limits change; check
        each vendor's own page before you decide.
      </p>
      <ul>
        {meta.sources.map((s) => (
          <li key={s.url}><a href={s.url} rel="noopener">{s.name}</a></li>
        ))}
      </ul>
    </section>
  );
  return <PageLayout meta={meta} body={body} eyebrow="Compare" after={sources} />;
}
