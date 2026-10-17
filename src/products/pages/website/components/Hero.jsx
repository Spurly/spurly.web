import { Link } from "react-router-dom";
import Button from "./Button.jsx";
import { TargetIcon } from "../icons.jsx";
import { usePrice } from "../hooks/usePrice.js";

/* Hero: say what Spurly is and who it is for in the first screen, one primary
   action, one secondary action, then a real screenshot of the product.
   Plain HTML and CSS, so the prerendered page is the whole hero and the
   headline is the LCP element. */

export default function Hero() {
  const price = usePrice();

  return (
    <section className="hero">
      <div className="hero-panel">
        <div className="wrap hero-center">
          <span className="chip"><span className="dot" />AI SDR for LinkedIn, built for founders and B2B sales teams</span>
          <h1 className="display">
            <span className="ln">Find high-intent leads on LinkedIn.</span>{" "}
            <span className="ln"><em>Let your AI SDR do the outreach.</em></span>
          </h1>
          <p className="lead">Spurly is an AI SDR for LinkedIn. Tell it your ICP and it finds the right people, spots the warm ones (profile viewers, new followers, people posting about your topic, companies hiring), writes personalized messages with AI and follows up until they reply. It runs 24/7 in the cloud, and you approve every message.</p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg" data-magnetic>
              <TargetIcon />
              Start 7-day free trial
            </Link>
            <Button variant="ghost" size="lg" href="#how">See how it works</Button>
          </div>
          <p className="hero-micro">7-day free trial, then {price.label}/month. No card needed to start. Cancel anytime.</p>
        </div>

        <div className="hero-shot">
          <img
            src="/assets/app-campaigns-1200.webp"
            srcSet="/assets/app-campaigns-800.webp 800w, /assets/app-campaigns-1200.webp 1200w, /assets/app-campaigns.webp 1700w"
            sizes="(max-width: 1040px) 100vw, 1000px"
            fetchPriority="high"
            alt="Spurly campaigns page showing sending, accepted and replies-waiting counts and a card for each campaign."
            width="1700"
            height="943"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
