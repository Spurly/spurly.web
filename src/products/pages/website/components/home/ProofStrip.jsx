import { getProof } from "../../proof/proof.js";

/* A two-row scrolling wall of review cards, Waalaxy-style. Sample cards are
   tagged "Sample" and the heading says so; the "Real replies" heading is used
   only when every card is a real review. Renders nothing with no reviews. */

function Card({ r, tone }) {
  return (
    <article className={"rv-card rv-" + tone}>
      <header>
        <span className="rv-av" aria-hidden="true">
          {r.avatar ? (
            <img
              src={r.avatar}
              alt=""
              width="40"
              height="40"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            r.name.slice(0, 1)
          )}
        </span>
        <div>
          <strong>{r.name}</strong>
          <small>{r.role}</small>
        </div>
      </header>
      <p>“{r.quote}”</p>
      {r.result && <span className="rv-result">{r.result}</span>}
    </article>
  );
}

function Row({ items, reverse }) {
  const tones = ["plain", "blue", "plain", "violet"];
  const make = (prefix) =>
    items.map((r, i) => (
      <Card key={prefix + r.name + i} r={r} tone={tones[i % tones.length]} />
    ));
  return (
    <div className={"rv-row" + (reverse ? " rv-rev" : "")}>
      <div className="rv-track">
        {make("a")}
        <div className="rv-dup" aria-hidden="true">
          {make("b")}
        </div>
      </div>
    </div>
  );
}

export default function ProofStrip() {
  const { reviews } = getProof();
  if (!reviews.length) return null;
  const half = Math.ceil(reviews.length / 2);
  const allReal = reviews.every((r) => !r.sample);

  return (
    <section className="rv section-pad" aria-label="What customers say">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">
            {allReal ? "What founders and sales teams get" : "Reviews"}
          </span>
          {allReal ? (
            <h2 className="h2" style={{ marginTop: 14 }}>
              Real replies. <em>Real calls booked.</em>
            </h2>
          ) : (
            <h2 className="h2" style={{ marginTop: 14 }}>
              Customer reviews, <em>shown as a preview.</em>
            </h2>
          )}
        </div>
      </div>
      {reviews.length > 0 && (
        <div className="rv-wall reveal d2">
          <Row items={reviews.slice(0, half)} />
          {reviews.length > 1 && <Row items={reviews.slice(half)} reverse />}
        </div>
      )}
      <div className="wrap rv-cta reveal d2">
        <a href="#book" className="btn btn-primary btn-lg" data-magnetic>
          Book a call <span className="arr">→</span>
        </a>
      </div>
    </section>
  );
}
