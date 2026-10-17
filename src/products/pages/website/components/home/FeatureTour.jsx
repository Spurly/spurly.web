import { useState } from "react";
import { Link } from "react-router-dom";
import SectionCta from "../SectionCta.jsx";

/* Tabbed tour. Every panel is in the prerendered HTML (inactive ones are
   `hidden`, still in the DOM), so crawlers read all of it. Screenshots are from
   the real app with other people's names and photos blurred. */
const TABS = [
  {
    key: "campaigns",
    label: "AI campaigns and sequences",
    body: "AI writes a personalized connection note and follow-ups for your ICP, and you approve them. Spurly combines visit, connect, message, follow, like, comment and wait, sends each step at a safe daily pace and stops when someone replies.",
    to: "/product/campaigns",
    shot: { src: "/assets/app-campaigns.webp", w: 1700, h: 943, alt: "Spurly campaigns page showing sending, accepted and replies-waiting counts and a card for each campaign." },
  },
  {
    key: "inbox",
    label: "Unified inbox",
    body: "Every LinkedIn conversation in one list, with replies from your campaigns on top. Reply, react and send files and PDFs as messages arrive.",
    to: "/product/inbox",
    shot: { src: "/assets/app-inbox.webp", w: 1700, h: 937, alt: "Spurly inbox with a conversation list, a message thread and a reply box with a Write button. The message text is blurred." },
  },
  {
    key: "finder",
    label: "ICP lead finder",
    body: "Filtered LinkedIn search, company search, post authors, pasted URLs and CSV all feed one audience. Hiring companies and posts on your topic point to people with a reason to talk.",
    to: "/product/lead-finder",
    shot: { src: "/assets/app-leads.webp", w: 1700, h: 942, alt: "Spurly leads table with a bulk-action bar and degree, status and enrichment columns." },
  },
  {
    key: "network",
    label: "Warm leads",
    body: "Your network is synced, and profile viewers and followers of you or your company page become an audience in one click.",
    to: "/product/network",
    shot: { src: "/assets/app-network.webp", w: 1700, h: 943, alt: "Spurly network page with the number of connections, when they were last checked and a table of your LinkedIn connections with title, company and enrichment status." },
  },
  {
    key: "hours",
    label: "24/7, on your terms",
    body: "Spurly works around the clock with uneven, human-like gaps. Choose quiet hours and it slows right down overnight instead of stopping. It stops a person the moment they reply and skips anyone contacted in the last 30 days.",
  },
  {
    key: "invitations",
    label: "Invitations and enrichment",
    body: "Auto-accept incoming invitations from people whose headline matches your keywords, auto-withdraw invitations nobody accepted, and find work emails and phone numbers for your leads.",
  },
];

export default function FeatureTour() {
  const [active, setActive] = useState(TABS[0].key);
  return (
    <section id="tour" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">What your AI SDR does</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Every SDR job on LinkedIn, <em>in one tool.</em></h2>
        </div>
        <div className="tour glass reveal d1">
          <div className="shot-tabs" role="tablist" aria-label="Spurly features">
            {TABS.map((t, i) => (
              <button
                key={t.key}
                id={"tour-tab-" + t.key}
                className={"shot-tab" + (active === t.key ? " is-on" : "")}
                role="tab"
                aria-selected={active === t.key}
                aria-controls={"tour-panel-" + t.key}
                onClick={() => setActive(t.key)}
              >
                <span className="st-i">{i + 1}</span>
                {t.label}
              </button>
            ))}
          </div>
          {TABS.map((t) => (
            <div
              key={t.key}
              id={"tour-panel-" + t.key}
              className="tour-panel"
              role="tabpanel"
              aria-labelledby={"tour-tab-" + t.key}
              hidden={active !== t.key}
            >
              <h3 className="h3">{t.label}</h3>
              <p>{t.body}</p>
              {t.to && <Link className="more-link" to={t.to}>Learn more →</Link>}
              {t.shot && (
                <img className="tour-shot" src={t.shot.src} alt={t.shot.alt} width={t.shot.w} height={t.shot.h} loading="lazy" decoding="async" />
              )}
            </div>
          ))}
        </div>
        <SectionCta />
      </div>
    </section>
  );
}
