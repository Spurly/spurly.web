import { Link } from "react-router-dom";

const SIGNALS = [
  ["People who viewed your profile", "They already looked at you. Turn viewers into leads."],
  ["People who follow you or your page", "Followers of you or your company page are a warm audience."],
  ["People posting about your topic", "Search posts on a topic and import their authors."],
  ["Companies that are hiring", "A job search is a hiring signal: a company with an open role has a need."],
];

export default function Signals() {
  return (
    <section id="signals" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Signals</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Reach people <em>when they're interested.</em></h2>
          <p className="lead">Most tools start from a search. Spurly can also start from the people who already noticed you and the companies that are hiring.</p>
        </div>
        <div className="aud-grid four">
          {SIGNALS.map(([title, body], i) => (
            <article key={title} className={"aud glass reveal d" + (i + 1)}>
              <h3 className="h3">{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <p className="center" style={{ marginTop: 26 }}><Link className="more-link" to="/product/lead-finder">See the lead finder →</Link></p>
      </div>
    </section>
  );
}
