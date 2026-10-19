import { Link } from "react-router-dom";
import { CheckItem } from "../icons.jsx";
import { TRIAL_NOTE } from "../pricing.js";
import { usePrice } from "../hooks/usePrice.js";
import PriceTag from "./PriceTag.jsx";

/* One plan, monthly. Short on purpose: price, one button, eight highlights.
   The full list lives on /pricing (PlanCard). Prerendered in USD; after
   hydration the price switches to INR for visitors in India (usePrice).
   Every line below is also in planFeatures.js, so nothing here is new. */

const HIGHLIGHTS = [
  "AI-written messages and sequences",
  "Intent signals: viewers, followers, posts, hiring",
  "Auto-accept and auto-withdraw invitations",
  "Works with Claude (MCP)",
  "One inbox for every LinkedIn conversation",
  "Lead finder, Chrome extension and CSV import",
  "Email and phone enrichment",
  "Safe daily pace, pauses when someone replies",
];

export default function Pricing() {
  const price = usePrice();
  return (
    <section id="pricing" className="prc section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Pricing</span>
          <h2 className="h2" style={{ marginTop: 14 }}>One plan. <em>Everything included.</em></h2>
        </div>
        <div className="prc-card reveal d1">
          <div className="prc-main">
            {price.sale && <span className="prc-sale">{price.sale.label} live · {price.sale.percentOff}% off</span>}
            <span className="prc-badge">7-day free trial</span>
            <div className="prc-name">Spurly</div>
            <div className="prc-amt">
              {price.sale && <s className="prc-was" aria-label={"Was " + price.sale.listLabel}>{price.sale.listLabel}</s>}
              <b className="tnum">{price.now}</b><span>/ month</span>
            </div>
            <p>{price.region === "IN" ? "Prices shown in INR for India." : "Billed in USD."} Cancel anytime.</p>
            <Link to="/signup" className="btn btn-primary btn-lg" data-magnetic>Start 7-day free trial</Link>
          </div>
          <ul className="prc-list">
            {HIGHLIGHTS.map((f) => <CheckItem key={f}>{f}</CheckItem>)}
          </ul>
        </div>
        <p className="center prc-note">
          {TRIAL_NOTE} <Link to="/pricing">Full pricing and FAQ</Link>
        </p>
        <p className="center prc-note">
          Built to stay within LinkedIn's limits. No tool can promise zero risk. <Link to="/product/safety">How safety works</Link>
        </p>
      </div>
    </section>
  );
}
