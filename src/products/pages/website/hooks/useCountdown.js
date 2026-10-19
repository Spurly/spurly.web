import { useEffect, useState } from "react";
import { getDemoDeadline } from "../sale/controller/demoDeadline.js";

/** Whole days/hours/minutes/seconds left until `endsAt` (ISO string), or null
 *  when there is no deadline or it has passed. Pure, so it is testable. */
export function timeLeft(endsAt, now) {
  if (!endsAt) return null;
  const ms = Date.parse(endsAt) - now;
  if (!(ms > 0)) return null;
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/** Live countdown. Null on the server and on the first client render (so the
 *  prerendered HTML and hydration agree), then ticks every second. With `demo`
 *  the deadline is the per-browser rolling 2 days instead of `endsAt`. */
export function useCountdown(endsAt, { demo = false } = {}) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    if (!endsAt && !demo) return undefined;
    const end = demo ? getDemoDeadline() : endsAt;
    const tick = () => setLeft(timeLeft(end, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, demo]);

  return endsAt || demo ? left : null;
}
