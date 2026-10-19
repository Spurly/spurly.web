import { Link } from "react-router-dom";
import { getProof } from "../../proof/proof.js";

/* Case studies: who, the headline result, three numbers, where the numbers
   come from. Real entries ship; samples are tagged and dev-only (proof.js). */

function Study({ c, i }) {
  return (
    <article className={"cs-card reveal d" + ((i % 3) + 1)}>
      {c.sample && <em className="rv-sample">Sample</em>}
      <div className="cs-who"><span className="cs-av" aria-hidden="true">{c.who.replace(/^Sample: /, "").slice(0, 1)}</span><div><strong>{c.who}</strong><small>{c.role}</small></div></div>
      <h3>{c.headline}</h3>
      <p>{c.story}</p>
      <dl className="cs-stats">
        {c.stats.map((s) => (
          <div key={s.label}><dt>{s.label}</dt><dd className="tnum">{s.value}</dd></div>
        ))}
      </dl>
      <small className="cs-src">{c.asOf}</small>
    </article>
  );
}

export default function CaseStudies() {
  const { caseStudies } = getProof();
  if (!caseStudies.length) return null;
  return (
    <section id="results" className="cs section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Real results</span>
          <h2 className="h2" style={{ marginTop: 14 }}>What it looks like <em>in practice.</em></h2>
        </div>
        <div className="cs-grid">
          {caseStudies.map((c, i) => <Study key={c.id} c={c} i={i} />)}
        </div>
        <p className="center prc-note">
          Want results like these? <Link to="/book-demo">Book a call</Link> and we’ll set it up with you.
        </p>
      </div>
    </section>
  );
}
