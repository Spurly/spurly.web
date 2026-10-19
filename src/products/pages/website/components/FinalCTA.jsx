import { Link } from "react-router-dom";
import { usePrice } from "../hooks/usePrice.js";
import PriceTag from "./PriceTag.jsx";
import SaleCountdown from "./SaleCountdown.jsx";
import { TRIAL_NOTE } from "../pricing.js";

export default function FinalCTA() {
  const price = usePrice();
  return (
    <section className="section-pad" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta-panel reveal">
          <h2 className="h2">Your LinkedIn outreach, <em>on autopilot by tonight.</em></h2>
          <p className="lead">
            {price.sale ? price.sale.label + " live: " : ""}7-day free trial, then <PriceTag price={price} />/month.
          </p>
          {price.sale && <p className="cta-count"><SaleCountdown endsAt={price.sale.endsAt} /></p>}
          <div className="hero-actions">
            <a href="#book" className="btn btn-primary btn-lg" data-magnetic>
              Book a call <span className="arr" aria-hidden="true">→</span>
            </a>
            <Link to="/signup" className="btn btn-ghost btn-lg">Start 7-day free trial</Link>
          </div>
          <ul className="cta-points">
            <li>You approve every message</li>
            <li>Stops when they reply</li>
            <li>Runs with your laptop closed</li>
          </ul>
          <p className="trial-note">{TRIAL_NOTE}</p>
        </div>
      </div>
    </section>
  );
}
