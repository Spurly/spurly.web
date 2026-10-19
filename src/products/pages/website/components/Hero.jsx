import { Link } from "react-router-dom";
import HeroVideo from "./home/HeroVideo.jsx";

/* Hero of the landing page: a chip that says who it is for, an outcome
   headline, the one-sentence definition, ONE main button (Book a call) with
   the free trial as a quiet link, then the demo video with a caption. The sale
   lives only in the top bar (UrgencyBar), not here.
   Keywords: "AI SDR", "LinkedIn" and "leads" in the headline, "LinkedIn
   automation" in the chip and the definition sentence. Plain HTML and CSS, so
   the prerendered page is the whole hero and the headline is the LCP element. */

export default function Hero() {
  return (
    <section className="hero hero-lander">
      <div className="hero-panel">
        <div className="wrap hero-center">
          <span className="hero-pill"><b>AI SDR</b>LinkedIn automation for founders and B2B sales teams</span>
          <h1 className="display">
            <span className="ln">Your <em>AI SDR</em> for</span>{" "}
            <span className="ln">LinkedIn leads.</span>{" "}
            <span className="ln">On autopilot.</span>
          </h1>
          <p className="lead">Spurly is a LinkedIn automation tool that finds your ideal prospects, writes personal messages with AI, follows up automatically and stops when they reply.</p>
          <div className="hero-actions">
            <a href="#book" className="btn btn-primary btn-lg" data-magnetic>
              Book a call <span className="arr" aria-hidden="true">→</span>
            </a>
          </div>
          <p className="hero-micro">
            or <Link to="/signup" className="hero-trial">Start 7-day free trial</Link> · no card needed · cancel anytime
          </p>
        </div>

        <HeroVideo />
        <p className="hero-caption">1-minute demo: find leads, approve the notes, send at a safe pace.</p>
      </div>
    </section>
  );
}
