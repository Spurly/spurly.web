import SectionCta from "../SectionCta.jsx";

const STEPS = [
  { title: "Define your ICP", body: "Connect LinkedIn once, with nothing to install. Describe who you sell to with filters such as title, company and location, or start from target companies, post authors, profile viewers or a CSV." },
  { title: "AI writes and runs the outreach", body: "AI drafts a personalized connection note and follow-ups in your voice. You approve them once, then Spurly visits profiles, connects, messages, likes and follows up on schedule at a safe pace." },
  { title: "You take the warm conversations", body: "When someone replies, their sequence stops and the chat lands in one inbox. Answer there, or ask Claude to sort replies and draft answers for you to approve." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">How it works</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Your AI SDR, <em>live in three steps.</em></h2>
          <p className="lead">Define your ICP, let AI write and run the outreach, and step in when someone replies.</p>
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
