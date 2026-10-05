import SectionCta from "../SectionCta.jsx";

const STEPS = [
  { title: "Connect LinkedIn securely", body: "Sign in to your LinkedIn account once through a secure connection. There is nothing to install." },
  { title: "Pick an audience, launch a sequence", body: "Search with filters, find people at target companies, import post authors or a CSV. AI drafts the connection note and follow-ups, and you approve them." },
  { title: "Reply from one inbox", body: "Spurly connects, waits for the accept and follows up at a safe pace, even with your laptop closed. When someone answers, the sequence stops and the conversation waits in your inbox." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">How it works</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Three steps from a search to <em>a conversation.</em></h2>
          <p className="lead">Spurly runs LinkedIn outreach in three steps: connect your account, launch an AI-written sequence and reply from one inbox.</p>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className={"step glass-thin reveal d" + (i + 1)}>
              <div className="num"><span className="line" /></div>
              <h3 className="h3">{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
        <SectionCta />
      </div>
    </section>
  );
}
