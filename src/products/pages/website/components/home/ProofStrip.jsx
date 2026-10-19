import { getProof } from "../../proof/proof.js";

/* Rating badges plus a two-row scrolling wall of review cards, Waalaxy-style.
   Renders nothing when there are no ratings and no reviews, so a production
   build without real reviews simply omits it. */

function Stars({ score }) {
  const full = Math.round(score * 2) / 2;
  return (
    <span className="rv-stars" role="img" aria-label={score + " out of 5"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= full ? "on" : n - 0.5 === full ? "half" : ""} aria-hidden="true">★</i>
      ))}
    </span>
  );
}

function Card({ r, tone }) {
  return (
    <article className={"rv-card rv-" + tone}>
      <header>
        <span className="rv-av" aria-hidden="true">{r.name.slice(0, 1)}</span>
        <div><strong>{r.name}</strong><small>{r.role}</small></div>
        <span className="rv-src">{r.platform}</span>
      </header>
      <p>“{r.quote}”</p>
      {r.sample && <em className="rv-sample">Sample</em>}
    </article>
  );
}

function Row({ items, reverse }) {
  const tones = ["plain", "blue", "plain", "violet"];
  const make = (prefix) => items.map((r, i) => <Card key={prefix + r.name + i} r={r} tone={tones[i % tones.length]} />);
  return (
    <div className={"rv-row" + (reverse ? " rv-rev" : "")}>
      <div className="rv-track">
        {make("a")}
        <div className="rv-dup" aria-hidden="true">{make("b")}</div>
      </div>
    </div>
  );
}

export default function ProofStrip() {
  const { ratings, reviews } = getProof();
  if (!ratings.length && !reviews.length) return null;
  const half = Math.ceil(reviews.length / 2);

  return (
    <section className="rv section-pad" aria-label="What customers say">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Loved by people who do outreach</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Now they’re getting replies, <em>and new clients.</em></h2>
        </div>
        {ratings.length > 0 && (
          <ul className="rv-ratings reveal d1">
            {ratings.map((r) => (
              <li key={r.platform}>
                <Stars score={r.score} />
                <small><b>{r.score}</b> on {r.platform}{r.sample ? " (sample)" : ""}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
      {reviews.length > 0 && (
        <div className="rv-wall reveal d2">
          <Row items={reviews.slice(0, half)} />
          {reviews.length > 1 && <Row items={reviews.slice(half)} reverse />}
        </div>
      )}
    </section>
  );
}
