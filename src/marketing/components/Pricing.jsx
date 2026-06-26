import { ChromeLink } from "./Button.jsx";
import { CheckItem } from "../icons.jsx";

const PLANS = [
  {
    cls: "glass-thin reveal d1",
    name: "Free",
    amt: "$0",
    per: "forever",
    desc: "Everything you need to run your first outreach campaign.",
    cta: { label: "Add to Chrome", variant: "ghost" },
    feats: [
      { t: "100 credits / month" },
      { t: "Prospect from LinkedIn & Sales Navigator" },
      { t: "50 profiles sourced per day" },
      { t: "25 connection requests per day" },
      { t: "25 messages per day" },
      { t: "Message templates & variables" },
      { t: "CSV export" },
      { t: "Email & phone enrichment", off: true },
    ],
  },
  {
    cls: "glass reveal d2 feat",
    badge: "Most popular",
    name: "Pro",
    amt: "$29",
    per: "/ month",
    desc: "For job-seekers and founders running steady, daily outreach.",
    cta: { label: "Start free trial", variant: "primary", magnetic: true },
    feats: [
      { t: "2,000 credits / month" },
      { t: "Prospect from LinkedIn & Sales Navigator" },
      { t: "200 profiles sourced per day" },
      { t: "100 connection requests per day" },
      { t: "100 messages per day" },
      { t: "Email & phone enrichment" },
      { t: "Message templates & variables" },
      { t: "CSV export" },
    ],
  },
  {
    cls: "glass-thin reveal d3",
    name: "Agency",
    amt: "$99",
    per: "/ month",
    desc: "For recruiting teams and agencies running high-volume pipelines.",
    cta: { label: "Talk to us", variant: "ghost" },
    feats: [
      { t: "10,000 credits / month" },
      { t: "Prospect from LinkedIn & Sales Navigator" },
      { t: "500 profiles sourced per day" },
      { t: "300 connection requests per day" },
      { t: "300 messages per day" },
      { t: "Everything in Pro" },
      { t: "Priority enrichment & support" },
      { t: "Seats for your whole team" },
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Pricing</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Start free. Scale when it's working.</h2>
          <p className="lead">Every plan includes prospecting, connections, and messaging. Credits are spent only when Spurly does work for you.</p>
        </div>
        <div className="price-grid">
          {PLANS.map((p) => (
            <article key={p.name} className={"price " + p.cls}>
              {p.badge && <span className="badge">{p.badge}</span>}
              <div className="pname">{p.name}</div>
              <div className="pamt"><b className="tnum">{p.amt}</b><span>{p.per}</span></div>
              <p className="pdesc">{p.desc}</p>
              <ChromeLink variant={p.cta.variant} magnetic={p.cta.magnetic}>{p.cta.label}</ChromeLink>
              <ul>
                {p.feats.map((f) => <CheckItem key={f.t} off={f.off}>{f.t}</CheckItem>)}
              </ul>
            </article>
          ))}
        </div>
        <p className="center" style={{ marginTop: 24, color: "var(--text-3)", fontSize: 13.5 }}>Credits are spent only when Spurly does work for you. No hidden fees.</p>
      </div>
    </section>
  );
}
