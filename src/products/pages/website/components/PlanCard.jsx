import { Link } from "react-router-dom";
import { CheckItem } from "../icons.jsx";
import { usePrice } from "../hooks/usePrice.js";
import { PLAN_FEATURES } from "./planFeatures.js";

/* The single plan card, shared by the home pricing section and /pricing.
   Every feature below is marked "Market now" in SEO_CONTENT_PLAN section 3. */


export default function PlanCard({ className = "" }) {
  const price = usePrice();
  return (
    <article className={`price glass feat ${className}`.trim()}>
      {price.sale && <span className="prc-sale prc-sale-light">{price.sale.label} · {price.sale.percentOff}% off</span>}
      <span className="badge">7-day free trial</span>
      <div className="pname">Spurly</div>
      <div className="pamt">
        {price.sale && <s className="prc-was prc-was-light" aria-label={"Was " + price.sale.listLabel}>{price.sale.listLabel}</s>}
        <b className="tnum">{price.now}</b><span>/ month</span>
      </div>
      {price.sale && (
        <p className="pdesc prc-lock"><b>Only for the {price.sale.audience}.</b> {price.sale.lock[0].toUpperCase() + price.sale.lock.slice(1)}, even after it goes back to {price.sale.listLabel}.</p>
      )}
      <p className="pdesc">{price.region === "IN" ? "Prices shown in INR for India." : "Billed in USD."}</p>
      <Link to="/signup" className="btn btn-primary" data-magnetic>Start 7-day free trial</Link>
      <ul>
        {PLAN_FEATURES.map((f) => <CheckItem key={f}>{f}</CheckItem>)}
      </ul>
    </article>
  );
}
