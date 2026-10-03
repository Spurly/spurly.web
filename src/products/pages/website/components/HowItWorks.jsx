import { SendIcon } from "../icons.jsx";

const STEPS = [
  {
    cls: "d1",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
    ),
    title: "Capture",
    body: <>Open any LinkedIn or Sales Navigator search and capture every profile with the Chrome extension — names, titles, companies, locations — in one click. Or find people from inside Spurly.</>,
  },
  {
    cls: "d2",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
    ),
    title: "Enrich & connect",
    body: <>Spurly enriches emails and details, then sends personalized connection requests at a daily pace designed to stay within LinkedIn&apos;s limits.</>,
  },
  {
    cls: "d3",
    icon: <SendIcon />,
    title: "Reach out",
    body: (
      <>Drop in <code>{"{{name}}"}</code> &amp; <code>{"{{company}}"}</code> variables once. Spurly fills in a unique message for everyone and sends — with a live preview before it goes.</>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">How it works</span>
          <h2 className="h2" style={{ marginTop: 14 }}>From a search page to a sent message — <em>with the follow-ups handled.</em></h2>
          <p className="lead">Three moves. Spurly handles the busywork in between.</p>
        </div>
        <div className="steps">
          {STEPS.map((s) => (
            <article key={s.title} className={"step glass-thin reveal " + s.cls}>
              <div className="num"><span className="line" /></div>
              <div className="s-ico">{s.icon}</div>
              <h3 className="h3">{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
