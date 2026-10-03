import { Link } from "react-router-dom";
import { CheckItem } from "../icons.jsx";
import { usePrice } from "../hooks/usePrice.js";

/* One plan, monthly (SEO_CONTENT_PLAN §5). Prerendered in USD; after
   hydration the price switches to INR for visitors in India (usePrice). Every feature below is marked "Market now" in
   SEO_CONTENT_PLAN §3. */

const FEATURES = [
  "Campaigns and multi-step sequences, sent at a safe daily pace",
  "Pause automatically when someone replies",
  "One inbox for all your LinkedIn conversations",
  "Audience builder: LinkedIn people search with filters",
  "Find leads from companies, posts and pasted LinkedIn URLs",
  "Your network synced, plus profile viewers and followers as leads",
  "Email and phone enrichment",
  "Schedule posts and see likes and comments",
  "Chrome extension capture and CSV import",
  "Message templates with variables and a live preview",
];

export default function Pricing() {
  const price = usePrice();
  return (
    <section id="pricing" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Pricing</span>
          <h2 className="h2" style={{ marginTop: 14 }}>One plan. <em>Everything included.</em></h2>
          <p className="lead">7-day free trial, then {price.label}/month. No tiers to compare.</p>
        </div>
        <div className="price-grid single">
          <article className="price glass feat reveal d1">
            <span className="badge">7-day free trial</span>
            <div className="pname">Spurly</div>
            <div className="pamt"><b className="tnum">{price.label}</b><span>/ month</span></div>
            <p className="pdesc">{price.region === "IN" ? "Prices shown in INR for India." : "Billed in USD."}</p>
            <Link to="/signup" className="btn btn-primary" data-magnetic>Start 7-day free trial</Link>
            <ul>
              {FEATURES.map((f) => <CheckItem key={f}>{f}</CheckItem>)}
            </ul>
          </article>
        </div>
        <p className="center" style={{ marginTop: 24, color: "var(--text-3)", fontSize: 13.5 }}>
          Add a card (or UPI in India) to start your 7-day free trial. You won't be charged until day 8. Cancel anytime before then and you pay nothing. Cancel in Settings → Billing; access runs to the end of the period you've paid for.
        </p>
      </div>
    </section>
  );
}
