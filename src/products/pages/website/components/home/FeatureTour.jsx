import { useState } from "react";
import { Link } from "react-router-dom";

/* Tabbed tour. Every panel is in the prerendered HTML (inactive ones are
   `hidden`, still in the DOM), so crawlers read all of it. Screenshots are from
   the real app with other people's names and photos blurred. */
const TABS = [
  {
    key: "campaigns",
    label: "Campaigns and sequences",
    body: "Send connection requests and follow-ups at a safe daily pace. Combine steps such as visit profile, connect, message, follow, like, comment and wait, and Spurly stops the sequence when someone replies.",
    to: "/product/campaigns",
    shot: { src: "/assets/app-campaigns.webp", w: 1700, h: 946, alt: "Spurly campaigns page showing sending, accepted and replies-waiting counts and a card for each campaign." },
  },
  {
    key: "inbox",
    label: "Inbox",
    body: "Every LinkedIn conversation in one list. Reply, react and send files and PDFs, and see new messages as they arrive.",
    to: "/product/inbox",
    shot: { src: "/assets/app-inbox.webp", w: 1700, h: 946, alt: "Spurly inbox with a conversation list, a message thread and a reply box with a Write button. Names and messages are blurred." },
  },
  {
    key: "finder",
    label: "Lead finder",
    body: "Filtered LinkedIn search, company search, post authors, pasted URLs and CSV import all feed one audience. Hiring companies and posts on your topic point to people with a reason to talk.",
    to: "/product/lead-finder",
    shot: { src: "/assets/app-leads.webp", w: 1700, h: 986, alt: "Spurly leads table with degree, status and enrichment columns. Names and profile details are blurred." },
  },
  {
    key: "network",
    label: "Network and viewers",
    body: "Your network is synced, so every first-degree connection is in Spurly. Profile viewers and followers of you or your company page can become an audience.",
    to: "/product/lead-finder",
  },
  {
    key: "posts",
    label: "Posts",
    body: "Schedule text and image posts and see the likes and comments they get, from the same place you run outreach.",
  },
];

export default function FeatureTour() {
  const [active, setActive] = useState(TABS[0].key);
  return (
    <section id="tour" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Feature tour</span>
          <h2 className="h2" style={{ marginTop: 14 }}>One tool, <em>the whole workflow.</em></h2>
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
      </div>
    </section>
  );
}
