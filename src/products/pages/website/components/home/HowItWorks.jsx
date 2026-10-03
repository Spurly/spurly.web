const STEPS = [
  { title: "Connect LinkedIn securely", body: "Sign in to your LinkedIn account once through a secure connection. There is nothing to install." },
  { title: "Build an audience", body: "Search with filters, find people at target companies, import post authors, paste a URL or upload a CSV." },
  { title: "Launch a sequence", body: "Connect, wait until they accept, message, follow up. Spurly sends each step at a safe pace, even with your laptop closed." },
  { title: "Reply from one inbox", body: "When someone answers, the sequence stops for them and the conversation waits in your inbox." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">How it works</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Four steps from a search to <em>a conversation.</em></h2>
          <p className="lead">Spurly runs LinkedIn outreach in four steps: connect your account, build an audience, launch a sequence and reply from one inbox.</p>
        </div>
        <ol className="steps four">
          {STEPS.map((s, i) => (
            <li key={s.title} className={"step glass-thin reveal d" + (i + 1)}>
              <div className="num"><span className="line" /></div>
              <h3 className="h3">{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
