import { CheckItem } from "../icons.jsx";

const CLOUD_CHIPS = [
  "Recruiters", "SDRs", "Founders", "Agencies", "Job-seekers",
  "Account executives", "Growth marketers", "Consultants",
];

const CARDS = [
  {
    cls: "d1",
    tag: "Recruiting agencies",
    iconStyle: { background: "var(--grad)" },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
    title: "Fill roles faster",
    body: "Source a whole shortlist of candidates in minutes, then reach every one with a personal note instead of a copy-paste blast.",
    items: ["Build candidate pipelines per role as Sessions", "Enrich contact details for follow-up", "Personalized outreach that gets replies"],
  },
  {
    cls: "d2",
    tag: "Students & job-seekers",
    iconStyle: { background: "var(--grad)", filter: "hue-rotate(8deg)" },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
    ),
    title: "Land the interview",
    body: "Reach recruiters and hiring managers directly. Warm up dozens of connections a week and turn cold profiles into real conversations.",
    items: ["Find the right people at target companies", "Send thoughtful, personal connect notes", "Stay organized across every application"],
  },
  {
    cls: "d3",
    tag: "Founders & sellers",
    iconStyle: { background: "var(--grad)", filter: "hue-rotate(-8deg)" },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
    ),
    title: "Book more demos",
    body: "Build a list of your exact ICP, automate first touches, and keep your pipeline full — without hiring an SDR or paying for bloated CRMs.",
    items: ["Target by title, company & seniority", "Run outreach at scale, on autopilot", "Cut pipeline-to-meeting time in half"],
  },
];

export default function Audiences() {
  return (
    <section id="who" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Who it's for</span>
          <h2 className="h2" style={{ marginTop: 14 }}>One tool. Three ways to win.</h2>
          <p className="lead">Whatever you're reaching out for, Spurly turns the LinkedIn grind into a repeatable system.</p>
        </div>

        <div className="aud-cloud reveal" aria-hidden="true">
          <div className="aud-cloud-track">
            {CLOUD_CHIPS.concat(CLOUD_CHIPS).map((c, i) => (
              <span className="cloud-chip" key={i}><i />{c}</span>
            ))}
          </div>
        </div>
        <p className="cloud-label" style={{ margin: "14px 0 38px" }}>Built for everyone who lives in outbound</p>

        <div className="aud-grid">
          {CARDS.map((c) => (
            <article key={c.tag} className={"aud glass reveal " + c.cls}>
              <span className="tag">{c.tag}</span>
              <div className="a-ico" style={c.iconStyle}>{c.icon}</div>
              <h3 className="h3">{c.title}</h3>
              <p>{c.body}</p>
              <ul>
                {c.items.map((it) => <CheckItem key={it}>{it}</CheckItem>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
