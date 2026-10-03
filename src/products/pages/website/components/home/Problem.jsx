const ITEMS = [
  {
    pain: "Hours of copy-pasting",
    fix: "Build an audience from a search, a company, a post or a pasted LinkedIn URL, with no spreadsheet in between.",
  },
  {
    pain: "Follow-ups you forget",
    fix: "Sequences send each next step on schedule and stop the moment someone replies.",
  },
  {
    pain: "Replies lost across tabs",
    fix: "One inbox holds every LinkedIn conversation, including replies to your campaigns.",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">The problem</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Manual LinkedIn outreach <em>eats your week.</em></h2>
          <p className="lead">It means copying names, remembering follow-ups and hunting for replies. Spurly takes the busywork and leaves you the conversations.</p>
        </div>
        <div className="steps">
          {ITEMS.map((it, i) => (
            <article key={it.pain} className={"step glass-thin reveal d" + (i + 1)}>
              <div className="num"><span className="line" /></div>
              <h3 className="h3">{it.pain}</h3>
              <p>{it.fix}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
