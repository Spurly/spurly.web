import { Link } from "react-router-dom";
import PlanCard from "./PlanCard.jsx";
import { TRIAL_NOTE } from "../pricing.js";
import { usePrice } from "../hooks/usePrice.js";

/* One plan, monthly (SEO_CONTENT_PLAN §5). Prerendered in USD; after
   hydration the price switches to INR for visitors in India (usePrice). Every feature below is marked "Market now" in
   SEO_CONTENT_PLAN §3. */

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
          <PlanCard className="reveal d1" />
        </div>
        <p className="center" style={{ marginTop: 24, color: "var(--text-3)", fontSize: 13.5 }}>
          {TRIAL_NOTE} Cancel in Settings → Billing; access runs to the end of the period you've paid for.{" "}
          <Link to="/pricing">See full pricing and FAQ</Link>.
        </p>
      </div>
    </section>
  );
}
