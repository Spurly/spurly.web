import { useState } from "react";
import { Link } from "react-router-dom";

/* Features: a short numbered list on the left, one panel on the right.
   Items 1-4 are the headline features; each plays a short silent loop in the
   right panel. Until a clip exists the panel shows a screenshot or a
   placeholder. Item 5 swaps the panel for the full feature list.
   Every line of text is in the prerendered HTML (inactive panels are `hidden`,
   still in the DOM), so crawlers read all of it. To add a clip: set `clip`
   (an .mp4 under /public/assets/clips) and keep `shot` as its poster. */

const FEATURES = [
  {
    key: "find",
    tag: "Find",
    title: "Find people worth messaging",
    body: "Search LinkedIn, pull post authors, paste links or import a CSV. Hiring companies and profile viewers show who is already interested.",
    to: "/product/lead-finder",
    shot: { src: "/assets/app-leads.webp", w: 1700, h: 942, alt: "Spurly leads table with a bulk-action bar and degree, status and enrichment columns." },
    clip: "/assets/clips/find.mp4",
  },
  {
    key: "claude",
    tag: "Claude",
    title: "Run it from Claude",
    body: "Connect Claude and ask in plain words: find leads, draft a campaign, check who replied. It works inside your limits.",
    to: "/product/ai-assistants",
    shot: { src: "/assets/clips/claude-poster.webp", w: 1280, h: 800, alt: "Spurly dashboard card for running Spurly from Claude, with Connect with Claude and an example chat." },
    clip: "/assets/clips/claude.mp4",
  },
  {
    key: "followup",
    tag: "Follow up",
    title: "Campaigns that follow up",
    body: "AI writes the note and you approve it. Each step goes out at a safe pace and stops the moment someone replies.",
    to: "/product/campaigns",
    shot: { src: "/assets/app-campaigns.webp", w: 1700, h: 943, alt: "Spurly campaigns page showing sending, accepted and replies-waiting counts and a card for each campaign." },
    clip: "/assets/clips/follow.mp4",
  },
  {
    key: "invitations",
    tag: "Invitations",
    title: "Invitations on autopilot",
    body: "Accept people whose headline matches your keywords, and withdraw invitations nobody accepted.",
    to: "/product/network",
    shot: { src: "/assets/clips/invitations-poster.webp", w: 1280, h: 800, alt: "Spurly invitation rules: withdraw stale invitations and accept incoming ones whose headline matches your keywords." },
    clip: "/assets/clips/invitations.mp4",
  },
  {
    key: "all",
    tag: "And more",
    title: "Everything else, included",
    body: "Inbox, analytics, enrichment, quiet hours and more. See the full list.",
    all: true,
  },
];

const ALL_FEATURES = [
  { group: "Find", items: ["LinkedIn search and filters", "Company search", "Post authors", "Paste profile links", "CSV import", "Chrome extension", "Profile viewers", "Followers", "Hiring companies"] },
  { group: "Write and send", items: ["AI-written notes and follow-ups", "Message templates", "Approve before sending", "Campaigns", "Multi-step sequences"] },
  { group: "Reply", items: ["Unified inbox", "Files and PDFs", "Stops when they reply"] },
  { group: "Automate", items: ["Auto-accept invitations", "Auto-withdraw invitations", "Auto-engage with posts", "Quiet hours", "Safe daily limits", "Skips anyone contacted in 30 days"] },
  { group: "Know and connect", items: ["Analytics dashboard", "Work emails and phones", "Claude (MCP)"] },
];

const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>
);

function Media({ f, on }) {
  if (f.clip && on) {
    return (
      <video className="feat-media" src={f.clip} poster={f.shot ? f.shot.src : undefined} autoPlay muted loop playsInline preload="metadata" aria-label={f.title} />
    );
  }
  if (f.shot) {
    return <img className="feat-media" src={f.shot.src} alt={f.shot.alt} width={f.shot.w} height={f.shot.h} loading="lazy" decoding="async" />;
  }
  return (
    <div className="hv-center" role="img" aria-label={f.title + ", demo coming soon"}>
      <span className="hv-play"><PlayGlyph /></span>
      <strong>{f.title}</strong>
      <small>Demo coming soon</small>
    </div>
  );
}

export default function FeatureTour() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const last = FEATURES.length - 2; // autoplay cycles the 4 headline features only

  function pick(i) {
    setActive(i);
    setAuto(false);
  }

  return (
    <section id="tour" className="feat section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">What Spurly does</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Every SDR job on LinkedIn, <em>done for you.</em></h2>
        </div>
        <div className="feat-grid reveal d1">
          <div className="feat-list" role="tablist" aria-label="Spurly features" aria-orientation="vertical">
            {FEATURES.map((f, i) => {
              const on = active === i;
              return (
                <button
                  key={f.key}
                  id={"feat-tab-" + f.key}
                  type="button"
                  role="tab"
                  className={"feat-item" + (on ? " is-on" : "")}
                  aria-selected={on}
                  aria-controls={"feat-panel-" + f.key}
                  onClick={() => pick(i)}
                >
                  <span className="feat-tag">{String(i + 1).padStart(2, "0")} / {f.tag}</span>
                  <span className="feat-title">{f.title}</span>
                  <span className="feat-d"><span>{f.body}</span></span>
                  <span className="feat-bar" aria-hidden="true">
                    <i
                      className={on && auto && !f.all ? "run" : ""}
                      onAnimationEnd={() => setActive(active >= last ? 0 : active + 1)}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="feat-view">
            {FEATURES.map((f, i) => (
              <div
                key={f.key}
                id={"feat-panel-" + f.key}
                role="tabpanel"
                aria-labelledby={"feat-tab-" + f.key}
                hidden={active !== i}
                className="feat-panel"
              >
                {f.all ? (
                  <div className="feat-all">
                    {ALL_FEATURES.map((g) => (
                      <div key={g.group} className="feat-grp">
                        <h3>{g.group}</h3>
                        <ul>{g.items.map((it) => <li key={it}>{it}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="hv-bar" aria-hidden="true"><i /><i /><i /></div>
                    <div className="hv-stage"><Media f={f} on={active === i} /></div>
                    {f.to && <Link className="feat-more" to={f.to}>Learn more →</Link>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
