import { useEffect, useRef, useState } from "react";
import { SendIcon } from "../icons.jsx";

/* PRODUCT SHOWCASE — auto-rotating tabs (Explore → Connect → Reach Out).
   Ported from effects.js initShot(): same 3s cadence, pause-on-hover,
   start/stop tied to viewport visibility. */

const ORDER = ["explore", "connect", "reachout"];
const LABELS = { explore: "Explore", connect: "Connect", reachout: "Reach Out" };
const SHOTS = [
  { key: "explore", src: "/assets/shot-explore.png", alt: "Spurly Explore — captured leads from a LinkedIn search collected into a Session table" },
  { key: "connect", src: "/assets/shot-connect.png", alt: "Spurly Connect — sending personalized connection requests to captured leads" },
  { key: "reachout", src: "/assets/shot-reachout.png", alt: "Spurly Reach Out — composing a personalized message with a live preview for a real recipient" },
];

export default function ProductShowcase() {
  const [active, setActive] = useState("reachout"); // original starts at index 2
  const rootRef = useRef(null);
  const iRef = useRef(2);
  const hoveredRef = useRef(false);
  const timerRef = useRef(null);

  const stop = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const next = () => { iRef.current = (iRef.current + 1) % ORDER.length; setActive(ORDER[iRef.current]); };
  const start = () => { stop(); timerRef.current = setInterval(() => { if (!hoveredRef.current) next(); }, 3000); };

  useEffect(() => {
    const root = rootRef.current;
    const onEnter = () => { hoveredRef.current = true; };
    const onLeave = () => { hoveredRef.current = false; };
    root.addEventListener("mouseenter", onEnter);
    root.addEventListener("mouseleave", onLeave);

    let io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((e) => { if (e[0].isIntersecting) start(); else stop(); }, { threshold: 0.2 });
      io.observe(root);
    } else { start(); }

    return () => {
      stop();
      if (io) io.disconnect();
      root.removeEventListener("mouseenter", onEnter);
      root.removeEventListener("mouseleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTab = (key) => { iRef.current = ORDER.indexOf(key); setActive(key); start(); };

  return (
    <section id="product" className="section-pad" style={{ paddingBottom: "clamp(40px,6vw,80px)" }}>
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">The product</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Personalized outreach, sent without leaving the tab.</h2>
          <p className="lead">Spurly lives in a side panel on LinkedIn. Capture a search, then compose once — it writes a unique message for every lead and shows you a live preview before anything sends.</p>
        </div>
        <div className="shot-stage reveal d1" ref={rootRef}>
          <div className="browser-wrap">
            <div className="browser glass">
              <div className="browser-bar">
                <div className="tl"><i /><i /><i /></div>
                <div className="url">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  linkedin.com/sales · Spurly <span>{LABELS[active]}</span>
                </div>
              </div>
              <div className="shot-view">
                {SHOTS.map((s) => (
                  <img
                    key={s.key}
                    className={"shot-img" + (active === s.key ? " is-on" : "")}
                    src={s.src}
                    alt={s.alt}
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
            <div className="shot-float fl-1 reveal d2">
              <div className="ico"><SendIcon /></div>
              <div><small>Personalized &amp; sent</small><strong className="tnum">9 / 9 leads</strong></div>
            </div>
            <div className="shot-float fl-2 reveal d3">
              <div className="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /></svg></div>
              <div><small>Credits remaining</small><strong className="tnum">982.0</strong></div>
            </div>
          </div>
          <div className="shot-tabs" role="tablist" aria-label="Spurly workflow steps">
            {ORDER.map((key, idx) => (
              <button
                key={key}
                className={"shot-tab" + (active === key ? " is-on" : "")}
                role="tab"
                aria-selected={active === key ? "true" : undefined}
                onClick={() => onTab(key)}
              >
                <span className="st-i">{idx + 1}</span>{LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
