import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { usePrice } from "../hooks/usePrice.js";
import PriceTag from "./PriceTag.jsx";
import SaleCountdown from "./SaleCountdown.jsx";
import { TRIAL_NOTE } from "../pricing.js";

const BG_VIDEO = "/assets/video/spurly-cta-bg.mp4";

/* Muted product footage looping behind the panel. It loads only when the panel nears
   the viewport and stays off for people who ask for reduced motion. */
function useBackgroundVideo() {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === "undefined") return undefined;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (!v.src) v.src = BG_VIDEO;
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { rootMargin: "300px 0px" });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function FinalCTA() {
  const price = usePrice();
  const videoRef = useBackgroundVideo();
  return (
    <section className="section-pad" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta-panel reveal">
          <video ref={videoRef} className="cta-bg" muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
          <div className="cta-bg-shade" aria-hidden="true" />
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
