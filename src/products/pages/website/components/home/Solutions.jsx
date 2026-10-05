import { Link } from "react-router-dom";
import SectionCta from "../SectionCta.jsx";

const AUDIENCES = [
  { cls: "d1", tag: "Founders", title: "Fill your pipeline without an SDR", body: "Define one sharp audience, launch a sequence and answer replies from one inbox while you build the product.", to: "/solutions/founders" },
  { cls: "d2", tag: "Sales teams", title: "Keep every rep's outreach steady", body: "Each rep builds a prospect list, runs a sequence from their own LinkedIn account and handles replies in one place.", to: "/solutions/sales-teams" },
  { cls: "d3", tag: "Recruiters", title: "From a role to a shortlist", body: "Search for candidates, keep a list per role and reach each one with a personal note instead of a copy-paste blast.", to: "/solutions/recruiters" },
];

export default function Solutions() {
  return (
    <section id="who" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Who it's for</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Built for people who <em>live in outbound.</em></h2>
          <p className="lead">Spurly is built first for founders and small sales teams who want pipeline without hiring an SDR. Recruiters use it too.</p>
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
