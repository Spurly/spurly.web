import { useEffect, useRef } from "react";

/* DOTTED GLOW BACKGROUND (hero) — ported verbatim from effects.js
   initDotGlow(). The host div carries the .dotglow class; the canvas
   is created inside it, exactly as the original did. */
export default function DotGlow() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function cssVar(name, fb) {
      var v = getComputedStyle(document.body).getPropertyValue(name);
      return (v && v.trim()) || fb;
    }
    function energy() {
      var e = document.body.getAttribute("data-energy");
      return e === "calm" ? 0.55 : e === "hyped" ? 1.8 : 1;
    }

    var cv = document.createElement("canvas");
    host.appendChild(cv);
    var ctx = cv.getContext("2d");
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, gap = 28, t = 0, running = false, raf = null;
    var colA = "#2d6ae0", colB = "#38bdf8";
    function readCol() { colA = cssVar("--purple", colA); colB = cssVar("--blue", colB); }
    readCol();
    window.addEventListener("spurly:repaint", readCol);

    function hexRgb(x) { x = (x || "").trim(); if (x[0] === "#") x = x.slice(1); if (x.length === 3) x = x.split("").map(function (c) { return c + c; }).join(""); var n = parseInt(x, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }

    function resize() {
      var r = host.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * DPR; cv.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    // Re-sync the backing store when the host gets its real size after the web
    // font / layout settles, otherwise the short initial canvas is stretched.
    var ro = ("ResizeObserver" in window) ? new ResizeObserver(function () { resize(); draw(); }) : null;
    if (ro) ro.observe(host);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var ca = hexRgb(colA), cb = hexRgb(colB);
      var g1x = w * (0.3 + 0.16 * Math.sin(t * 0.6));
      var g1y = h * (0.32 + 0.12 * Math.cos(t * 0.5));
      var g2x = w * (0.72 + 0.14 * Math.cos(t * 0.45));
      var g2y = h * (0.6 + 0.13 * Math.sin(t * 0.7));
      var rad = Math.max(w, h) * 0.42;

      for (var y = gap; y < h; y += gap) {
        for (var x = gap; x < w; x += gap) {
          var d1 = Math.hypot(x - g1x, y - g1y);
          var d2 = Math.hypot(x - g2x, y - g2y);
          var i1 = Math.max(0, 1 - d1 / rad);
          var i2 = Math.max(0, 1 - d2 / rad);
          var base = 0.10 + 0.05 * Math.sin(t * 1.3 + x * 0.03 + y * 0.03);
          var inten = Math.min(1, base + i1 * 0.85 + i2 * 0.7);
          var mix = i2 > i1 ? i2 / (i1 + i2 + 0.001) : 0;
          var c = [
            Math.round(ca[0] + (cb[0] - ca[0]) * mix),
            Math.round(ca[1] + (cb[1] - ca[1]) * mix),
            Math.round(ca[2] + (cb[2] - ca[2]) * mix)
          ];
          var rr = 1 + inten * 1.8;
          ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (inten * 0.55).toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    var lastTs = 0;
    function loop(ts) {
      if (!running) return;
      if (!lastTs) lastTs = ts;
      var dt = Math.min(50, ts - lastTs); lastTs = ts;
      if (!reduce) t += dt * 0.00018 * energy();
      draw();
      raf = requestAnimationFrame(loop);
    }
    function start() { if (running) return; running = true; lastTs = 0; raf = requestAnimationFrame(loop); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    draw();
    let io = null;
    if (!reduce) {
      if ("IntersectionObserver" in window) {
        io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) start(); else stop(); }, { threshold: 0 });
        io.observe(host);
      } else { start(); }
    }

    return () => {
      stop();
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("spurly:repaint", readCol);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    };
  }, []);

  return <div className="dotglow" ref={hostRef} aria-hidden="true" />;
}
