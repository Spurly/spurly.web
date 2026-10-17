import { Link } from "react-router-dom";

const SIGNALS = [
  ["Viewed your profile", "They already checked you out. Reach them while you are still on their mind."],
  ["Follow you or your company page", "Followers know who you are. They are your warmest audience."],
  ["Posting about your topic", "Find people talking about the problem you solve and add them to a campaign."],
  ["Hiring for the job you help with", "An open role means a real need and a budget."],
];

export default function Signals() {
  return (
    <section id="signals" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Intent signals</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Start with warm leads, <em>not cold lists.</em></h2>
          <p className="lead">A cold list gets ignored. Spurly starts from people who already showed interest in you or in the problem you solve.</p>
        </div>
        <div className="aud-grid four">
          {SIGNALS.map(([title, body], i) => (
            <article key={title} className={"aud glass reveal d" + (i + 1)}>
              <h3 className="h3">{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <p className="center" style={{ marginTop: 26 }}><Link className="more-link" to="/product/lead-finder">See every intent signal →</Link></p>
      </div>
    </section>
  );
}
