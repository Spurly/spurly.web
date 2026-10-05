import { Link } from "react-router-dom";
import { TargetIcon } from "../icons.jsx";
import { usePrice } from "../hooks/usePrice.js";
import { TRIAL_NOTE } from "../pricing.js";

export default function FinalCTA() {
  const price = usePrice();
  return (
    <section className="section-pad" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta-panel reveal">
          <span className="eyebrow">Get started</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Get leads from LinkedIn, <em>on autopilot.</em></h2>
          <p className="lead">Connect your LinkedIn account, build an audience and launch your first campaign in minutes. 7-day free trial, then {price.label}/month.</p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg" data-magnetic>
              <TargetIcon />
              Start 7-day free trial
            </Link>
          </div>
          <p className="trial-note">{TRIAL_NOTE}</p>
        </div>
      </div>
    </section>
  );
}
