import { Link } from "react-router-dom";
import { usePrice } from "../hooks/usePrice.js";
import { TRIAL_NOTE } from "../pricing.js";

export default function FinalCTA() {
  const price = usePrice();
  return (
    <section className="section-pad" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta-panel reveal">
          <h2 className="h2">Put your AI SDR <em>to work today.</em></h2>
          <p className="lead">7-day free trial, then {price.label}/month.</p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg" data-magnetic>
              Start 7-day free trial <span className="arr" aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="trial-note">{TRIAL_NOTE}</p>
        </div>
      </div>
    </section>
  );
}
