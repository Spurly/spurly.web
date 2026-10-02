import { useEffect, useRef } from "react";
import Button, { ChromeLink } from "./Button.jsx";
import { TargetIcon } from "../icons.jsx";

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
          <span className="chip"><span className="dot" />Now live on the Chrome Web Store</span>
          <h1 className="display">
            <span className="ln">Reach anyone.</span>
            <span className="ln"><em>Anywhere</em> they</span>
            <span className="ln">work.</span>
          </h1>
          <p className="sr-only">Spurly is built for recruiters, founders, sellers, students and agencies.</p>
          <p className="lead">Spurly turns LinkedIn &amp; Sales Navigator into your pipeline — capture leads, enrich every profile, and send outreach that sounds like you, to the right people in any timezone. One click, right inside your browser.</p>
          <div className="hero-actions">
            <ChromeLink variant="primary" size="lg" magnetic>
              <TargetIcon />
              Add to Chrome — Start free
            </ChromeLink>
            <Button variant="ghost" size="lg" href="#product">See it in action</Button>
          </div>
          <div className="hero-stats">
            <div><b className="tnum">190+</b>countries reachable</div>
            <div><b className="tnum">1-click</b>capture, anywhere</div>
            <div><b className="tnum">100%</b>local-only &amp; private</div>
          </div>
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
