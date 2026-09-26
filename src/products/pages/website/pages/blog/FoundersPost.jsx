import { Link } from "react-router-dom";
import BlogLayout from "../../components/BlogLayout.jsx";

export default function FoundersPost() {
  return (
    <BlogLayout slug="free-linkedin-outreach-pipeline-founders">
      <p>
        Early on, most founders <em>are</em> the sales team. You don't have budget
        for an SDR, and a full CRM is overkill when you're still figuring out who
        your buyer even is. The good news: LinkedIn plus a lightweight workflow is
        enough to keep a steady pipeline — and you can start without spending a
        cent.
      </p>

      <h2>Step 1 — Define one sharp ICP</h2>
      <p>
        Don't try to reach "everyone who might buy." Pick one ideal customer
        profile you can describe in a sentence: a title, a company type, and a
        size. The narrower your list, the more relevant your outreach, and the
        higher your reply rate.
      </p>

      <h2>Step 2 — Build the list from a search</h2>
      <p>
        Run a LinkedIn or Sales Navigator search that matches your ICP. This is
        your raw pipeline. Instead of copying names into a spreadsheet by hand,
        capture the whole search at once — <Link to="/">Spurly</Link> pulls every
        profile (name, title, company, location) into a Session in one click, so
        you skip the tedious part entirely.
      </p>

      <h2>Step 3 — Personalize, then reach out</h2>
      <p>
        Write one template with variables and let it adapt per person. Relevance
        is what gets replies — we break the mechanics down in{" "}
        <Link to="/blog/personalize-linkedin-connection-requests">
          how to personalize LinkedIn connection requests at scale
        </Link>
        . Aim for a steady daily cadence rather than one big burst, and let the
        tool pace sends so your account stays safe.
      </p>

      <h2>Step 4 — Follow up and track</h2>
      <p>
        Most replies come from the follow-up, not the first touch. Keep your
        Sessions organized by campaign so you always know who's been contacted,
        who replied, and who needs a nudge. That organization <em>is</em> your CRM
        at this stage.
      </p>

      <h2>What it costs</h2>
      <p>
        You can run this entire loop on Spurly's free plan (100 credits/month) to
        validate your messaging. Once it's working and you want more volume,
        enrichment and higher daily limits are a fraction of the cost of an SDR —
        see the <a href="/#pricing">pricing</a>.
      </p>

      <p>
        Hiring or sourcing instead of selling? The same engine works for talent —
        see{" "}
        <Link to="/blog/sales-navigator-candidate-pipelines-recruiters">
          how recruiters use Sales Navigator to build candidate pipelines
        </Link>
        .
      </p>
    </BlogLayout>
  );
}
