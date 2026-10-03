import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Button from "./Button.jsx";
import { TargetIcon } from "../icons.jsx";
import { usePrice } from "../hooks/usePrice.js";

/* Hero: paper background with contour ribbons, a live globe and three sample
   cards. Everything animated mounts after hydration from the lazy
   ./hero/heroFx.js chunk (it carries `three`), so prerendered HTML is just the
   copy, the cards and a static poster, and the headline is the LCP element. */

function scheduleIdle(fn) {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(fn, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 300);
  return () => window.clearTimeout(id);
}

export default function Hero() {
  const price = usePrice();
  const heroRef = useRef(null);
  const stageRef = useRef(null);
  const bgRef = useRef(null);
  const globeRef = useRef(null);
  const labelsRef = useRef(null);
  const utcRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const stage = stageRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let fx = null;
    let cancelled = false;

    const cancelIdle = scheduleIdle(() => {
      import("./hero/heroFx.js")
        .then(({ mountHeroFx }) => {
          if (cancelled) return;
          fx = mountHeroFx({
            hero,
            stage,
            bgCanvas: bgRef.current,
            globeCanvas: globeRef.current,
            labelsEl: labelsRef.current,
            utcEl: utcRef.current,
            reduced,
          });
          hero.classList.toggle("fx-bg", fx.hasBackdrop);
          stage.classList.toggle("is-live", fx.hasGlobe);
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
      cancelIdle();
      if (fx) fx.destroy();
      hero.classList.remove("fx-bg");
      stage.classList.remove("is-live");
    };
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-bg" aria-hidden="true" />
      <canvas className="hero-fx" ref={bgRef} aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="wrap hero-grid">
        <div className="hero-copy">
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

        <div
          className="hero-stage"
          ref={stageRef}
          role="img"
          aria-label="Illustration: a globe of sample leads in different time zones, with example cards for a captured profile, an outreach draft and a weekly acceptance rate."
        >
          <img className="hero-poster" src="/assets/globe-poster.webp" alt="" width="560" height="600" decoding="async" fetchPriority="low" />
          <canvas className="hero-globe" ref={globeRef} aria-hidden="true" />
          <div className="hero-labels" ref={labelsRef} aria-hidden="true" />
          <div className="hero-legend" aria-hidden="true">
            <div className="hl">Their morning, not yours.</div>
            <span><i className="on" />Awake · sends now</span>
            <span><i className="off" />Asleep · queued for 9:00</span>
            <span ref={utcRef}>UTC --:--</span>
          </div>
          <div className="hero-rig" aria-hidden="true">
            <article className="hc hc-profile">
              <div className="hc-tag"><span>Captured from LinkedIn</span><span className="hc-pill">1st degree</span></div>
              <div className="hc-who">
                <div className="hc-av">MO</div>
                <div><b>Maya Okafor</b><span>Head of Talent, Northwind Labs</span></div>
              </div>
              <div className="hc-rows">
                <div>Location<b>Lagos, Nigeria · UTC+1</b></div>
                <div>Company<b>Northwind Labs</b></div>
                <div>Enriched<b>Email · Phone · Site</b></div>
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
          <span className="hero-note" aria-hidden="true">Sample data</span>
        </div>
      </div>
    </section>
  );
}
