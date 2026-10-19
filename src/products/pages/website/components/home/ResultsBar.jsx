import { useEffect, useMemo, useRef, useState } from "react";
import FlipNumber from "./FlipNumber.jsx";
import { buildRun } from "../../simulation/controller/buildRun.js";
import { SIM_DAYS, SIM_STEP_MS } from "../../simulation/constants/constants.js";

/* Flip-clock simulation under the demo video: day, invites sent, replies and calls
   booked tick up as the days pass. The numbers are generated (seeded, so the server
   and the browser agree) and the section says so. The server renders the final
   state; in the browser the clock restarts from day 0 when it scrolls into view.
   Reduced-motion visitors just see the final state. */

const UNITS = [
  { key: "day", label: "Day", digits: 2 },
  { key: "invites", label: "Invites sent", digits: 3 },
  { key: "replies", label: "Replies", digits: 3 },
  { key: "calls", label: "Calls booked", digits: 2 },
];

export default function ResultsBar() {
  const run = useMemo(() => buildRun(), []);
  const [day, setDay] = useState(SIM_DAYS);
  const root = useRef(null);
  const timer = useRef(0);

  function play() {
    clearInterval(timer.current);
    setDay(0);
    timer.current = setInterval(() => {
      setDay((d) => {
        if (d + 1 >= SIM_DAYS) clearInterval(timer.current);
        return Math.min(d + 1, SIM_DAYS);
      });
    }, SIM_STEP_MS);
  }

  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      play();
    }, { threshold: 0.5 });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(timer.current);
    };
  }, []);

  const values = { day, invites: run.invites[day], replies: run.replies[day], calls: run.calls[day] };

  return (
    <section className="rb" aria-label="Results simulation">
      <div className="wrap">
        <div className="flip-card reveal" ref={root}>
          <div className="flip-top">
            <span className="rb-tag rb-sim">Simulation · not live data</span>
            <button type="button" className="flip-replay" onClick={play}>↻ Replay</button>
          </div>
          <div className="flip-grid">
            {UNITS.map((u) => (
              <div key={u.key} className="flip-unit">
                <FlipNumber value={values[u.key]} digits={u.digits} />
                <span className="flip-label">{u.label}</span>
              </div>
            ))}
          </div>
          <p className="rb-note">
            A typical {SIM_DAYS}-day run at a safe pace: about 80 invites a week (the pace of Spurly's own account, 476 in {SIM_DAYS} days), a few replies a day and a couple of calls booked each week. Your results will vary.
          </p>
        </div>
      </div>
    </section>
  );
}
