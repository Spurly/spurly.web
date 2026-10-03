import { Link } from "react-router-dom";
import { CheckItem } from "../../icons.jsx";

const PILLARS = [
  {
    cls: "d1",
    tag: "Find",
    title: "Find the right people",
    body: "Build audiences from filtered LinkedIn search, companies, posts and jobs, or paste any LinkedIn URL.",
    items: ["Filtered people search", "Companies, posts and jobs", "Profile viewers and followers"],
    to: "/product/lead-finder",
  },
  {
    cls: "d2",
    tag: "Automate",
    title: "Connect and follow up on autopilot",
    body: "Campaigns and multi-step sequences send at a safe daily pace and stop when someone replies.",
    items: ["Connection requests and follow-ups", "Acceptance detected automatically", "Pause on reply"],
    to: "/product/campaigns",
  },
  {
    cls: "d3",
    tag: "Reply",
    title: "One inbox for every conversation",
    body: "Read, reply, react and send files without leaving Spurly, with new messages as they arrive.",
    items: ["All LinkedIn conversations", "Reactions, files and PDFs", "Replies stop your sequences"],
    to: "/product/inbox",
  },
  {
    cls: "d4",
    tag: "Safe",
    title: "Safety built in",
    body: "Every action has its own limits, working hours and gaps. No tool can promise zero risk, and we say so.",
    items: ["Hourly and daily limits per action", "Your working hours, your time zone", "An honest risk statement"],
    to: "/product/safety",
  },
];

export default function Pillars() {
  return (
    <section id="product" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">The product</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Everything LinkedIn outreach needs, <em>in one place.</em></h2>
          <p className="lead">Connect your LinkedIn account once. Spurly handles finding people, reaching them, following up and keeping you safe.</p>
        </div>
        <div className="aud-grid four">
          {PILLARS.map((p) => (
            <article key={p.tag} className={"aud glass reveal " + p.cls}>
              <span className="tag">{p.tag}</span>
              <h3 className="h3">{p.title}</h3>
              <p>{p.body}</p>
              <ul>{p.items.map((it) => <CheckItem key={it}>{it}</CheckItem>)}</ul>
              <Link className="more-link" to={p.to}>Learn more →</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
