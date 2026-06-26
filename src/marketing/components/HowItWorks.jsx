import { SendIcon } from "../icons.jsx";

const codeStyle = { fontFamily: "ui-monospace,monospace", fontSize: ".9em", color: "var(--purple-700)" };

const STEPS = [
  {
    cls: "d1",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
    ),
    title: "Capture",
    body: <>Open any LinkedIn or Sales Navigator search and capture every profile into a Session — names, titles, companies, locations — in one click.</>,
  },
  {
    cls: "d2",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
    ),
    title: "Enrich & connect",
    body: <>Spurly visits profiles to enrich emails and details, then fires personalized connection requests — with human-like pacing that keeps you safe.</>,
  },
  {
    cls: "d3",
    icon: <SendIcon />,
    title: "Reach out",
    body: (
      <>Drop in <code style={codeStyle}>{"{{name}}"}</code> &amp; <code style={codeStyle}>{"{{company}}"}</code> variables once. Spurly writes a unique message for everyone and sends — with a live preview before it goes.</>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">How it works</span>
          <h2 className="h2" style={{ marginTop: 14 }}>From a search page to a sent message — without leaving the tab.</h2>
          <p className="lead">Three moves. Spurly handles the busywork in between so you stay in flow.</p>
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
