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
      <span className="badge">7-day free trial</span>
      <div className="pname">Spurly</div>
      <div className="pamt"><b className="tnum">{price.label}</b><span>/ month</span></div>
      <p className="pdesc">{price.region === "IN" ? "Prices shown in INR for India." : "Billed in USD."}</p>
      <Link to="/signup" className="btn btn-primary" data-magnetic>Start 7-day free trial</Link>
      <ul>
        {PLAN_FEATURES.map((f) => <CheckItem key={f}>{f}</CheckItem>)}
      </ul>
    </article>
  );
}
