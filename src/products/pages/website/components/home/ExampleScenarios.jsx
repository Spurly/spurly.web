import { EXAMPLES, projectExample } from "../../proof/proof.js";

/* "What it could look like for you": illustrative scenarios, clearly tagged as
   examples and not customers. Each card shows its assumptions and the sum, so
   a visitor can check the arithmetic. */
export default function ExampleScenarios() {
  return (
    <div className="ex">
      <div className="ex-head reveal">
        <span className="eyebrow">Example scenarios</span>
        <h3 className="ex-title">What it could look like <em>for you.</em></h3>
        <p>Illustrations built from the pace and accept rate of Spurly's own account. They are not customer results, and yours will vary with your audience and your message.</p>
      </div>
      <div className="ex-grid">
        {EXAMPLES.map((e, i) => {
          const r = projectExample(e);
          return (
            <article key={e.id} className={"ex-card reveal d" + ((i % 3) + 1)}>
              <span className="ex-tag">Example · not a customer result</span>
              <h4>{e.who}</h4>
              <small>{e.role}</small>
              <ol className="ex-steps">
                {e.timeline.map((t) => (
                  <li key={t.when}><b>{t.when}</b><span>{t.what}</span></li>
                ))}
              </ol>
              <div className="ex-out">
                <strong className="tnum">about {r.connections} new connections</strong>
                <small className="tnum">
                  {e.invitesPerWeek} invites a week × {e.weeks} weeks{e.accounts > 1 ? " × " + e.accounts + " accounts" : ""} = {r.invites} invites, at {Math.round(e.acceptRate * 100)}% accepted
                </small>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
