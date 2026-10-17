import { Link } from "react-router-dom";
import SectionCta from "../SectionCta.jsx";

const AUDIENCES = [
  { cls: "d1", tag: "Founders", title: "Pipeline without hiring an SDR", body: "Your AI SDR finds warm leads, writes and follows up while you build the product. You step in when someone replies.", to: "/solutions/founders" },
  { cls: "d2", tag: "Sales teams", title: "An AI SDR next to every rep", body: "Each rep runs AI-written sequences from their own LinkedIn account and works replies in one inbox.", to: "/solutions/sales-teams" },
  { cls: "d3", tag: "Recruiters", title: "From a role to a shortlist", body: "Search for candidates, keep a list per role and reach each one with a personal note instead of a copy-paste blast.", to: "/solutions/recruiters" },
];

export default function Solutions() {
  return (
    <section id="who" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Who it's for</span>
          <h2 className="h2" style={{ marginTop: 14 }}>An AI SDR for everyone <em>who sells on LinkedIn.</em></h2>
          <p className="lead">Built first for founders and small B2B sales teams who want an SDR's pipeline without an SDR's salary. Recruiters use it too.</p>
        </div>
        <div className="aud-grid">
          {AUDIENCES.map((a) => (
            <article key={a.tag} className={"aud glass reveal " + a.cls}>
              <span className="tag">{a.tag}</span>
              <h3 className="h3">{a.title}</h3>
              <p>{a.body}</p>
              <Link className="more-link" to={a.to}>See the workflow →</Link>
            </article>
          ))}
        </div>
        <SectionCta />
      </div>
    </section>
  );
}
