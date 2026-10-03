import { Link } from "react-router-dom";
import Button from "./Button.jsx";
import { TargetIcon } from "../icons.jsx";
import { usePrice } from "../hooks/usePrice.js";

/* Hero: a centered headline on a soft blue panel, then three sample cards.
   Everything is plain HTML and CSS, so the prerendered page is the whole hero
   and the headline is the LCP element. No canvas, no WebGL, no client script. */

export default function Hero() {
  const price = usePrice();

  return (
    <section className="hero">
      <div className="hero-panel">
        <div className="wrap hero-center">
          <span className="chip"><span className="dot" />AI-powered LinkedIn outreach</span>
          <h1 className="display">
            <span className="ln">AI writes your</span>{" "}
            <span className="ln"><em>LinkedIn outreach.</em></span>{" "}
            <span className="ln">Spurly sends it.</span>
          </h1>
          <p className="sr-only">Spurly is built for recruiters, founders, sellers, students and agencies.</p>
          <p className="lead">Spurly's AI drafts personal connection notes and follow-ups, then runs your campaigns from the cloud at a safe daily pace. Find the right people, reach them and reply from one inbox. You approve every message.</p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg" data-magnetic>
              <TargetIcon />
              Start 7-day free trial
            </Link>
            <Button variant="ghost" size="lg" href="#how">See how it works</Button>
          </div>
          <p className="hero-micro">7-day free trial, then {price.label}/month. Add a card (or UPI in India) to start. You won't be charged until day 8. Cancel anytime before then and you pay nothing.</p>
        </div>

        <div className="hero-cards" aria-hidden="true">
          <article className="hc hc-profile">
            <div className="hc-tag"><span>Captured from LinkedIn</span><span className="hc-pill">1st degree</span></div>
            <div className="hc-who">
              <div className="hc-av">MO</div>
              <div><b>Maya Okafor</b><span>Head of Talent, Northwind Labs</span></div>
            </div>
            <div className="hc-rows">
              <div>Location<b>Lagos, Nigeria · UTC+1</b></div>
              <div>Company<b>Northwind Labs</b></div>
              <div>Saved to<b>List: Q4 Talent</b></div>
            </div>
          </article>
          <article className="hc hc-msg">
            <div className="hc-tag"><span>Outreach draft</span><span className="hc-pill warm">Q4 Talent</span></div>
            <p>Hi Maya, I read your post on hiring across time zones. We help small teams reach candidates <em>while it is still morning for them</em>. Worth a quick look?</p>
            <div className="hc-foot"><span>Sends 9:05 her time</span><span className="hc-pill">Ready</span></div>
          </article>
          <article className="hc hc-status">
            <div className="hc-tag"><span>This week</span><span className="hc-pill">Live</span></div>
            <div className="hc-stat"><b>38%</b><span>invites accepted</span></div>
            <div className="hc-bars">
              <i style={{ height: "35%" }} /><i style={{ height: "52%" }} /><i style={{ height: "44%" }} /><i style={{ height: "68%" }} /><i style={{ height: "60%" }} /><i style={{ height: "86%" }} /><i style={{ height: "100%" }} />
            </div>
          </article>
        </div>
        <p className="hero-note" aria-hidden="true">Sample data</p>
      </div>
    </section>
  );
}
