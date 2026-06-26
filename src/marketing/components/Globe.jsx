import { useEffect, useRef } from "react";

/* GLOBE — dotted sphere + animated outreach arcs, on canvas.
   Ported verbatim from app.js initGlobe(), scoped to the canvas ref. */
export default function Globe() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = cv.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let size = 0, R = 0, cx = 0, cy = 0;
    let rot = -0.5, running = false, raf = null, last = 0;

    let A = "#2d6ae0", B = "#38bdf8", I2 = "#3f7fe6";
    function hexRgb(h) { h = (h || "").trim(); if (h[0] === "#") h = h.slice(1); if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join(""); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    function rgba(h, a) { var c = hexRgb(h); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
    function readCol() { var s = getComputedStyle(document.body); A = (s.getPropertyValue("--purple") || A).trim() || A; B = (s.getPropertyValue("--blue") || B).trim() || B; I2 = (s.getPropertyValue("--indigo") || I2).trim() || I2; }
    function energy() { var e = document.body.getAttribute("data-energy"); return e === "calm" ? 0.5 : e === "hyped" ? 1.85 : 1; }
    readCol();
    window.addEventListener("spurly:repaint", readCol);

    function resize() {
      var rect = cv.getBoundingClientRect();
      size = rect.width;
      cv.width = size * DPR; cv.height = size * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      R = size * 0.40; cx = size / 2; cy = size / 2;
    }
    resize();
    window.addEventListener("resize", resize);
    var ro = ("ResizeObserver" in window) ? new ResizeObserver(function () { resize(); }) : null;
    if (ro) ro.observe(cv);

    var dots = [];
    for (var lat = -80; lat <= 80; lat += 10) {
      var rad = Math.cos(lat * Math.PI / 180);
      var count = Math.max(6, Math.round(rad * 40));
      for (var i = 0; i < count; i++) {
        dots.push({ lat: lat * Math.PI / 180, lon: (i / count) * Math.PI * 2 });
      }
    }

    var hub = { lat: 13 * Math.PI / 180, lon: 77 * Math.PI / 180 };
    var cities = [
      { lat: 40.7, lon: -74.0 },
      { lat: 51.5, lon: -0.12 },
      { lat: 37.77, lon: -122.4 },
      { lat: -33.8, lon: 151.2 },
      { lat: 1.35, lon: 103.8 },
      { lat: 52.5, lon: 13.4 },
      { lat: 25.2, lon: 55.27 },
      { lat: -23.5, lon: -46.6 }
    ].map(function (c) { return { lat: c.lat * Math.PI / 180, lon: c.lon * Math.PI / 180 }; });

    var arcs = cities.map(function (c, i) {
      return { to: c, t: -(i / cities.length), speed: 0.0022 + Math.random() * 0.0012 };
    });

    function project(lat, lon) {
      var x = Math.cos(lat) * Math.sin(lon + rot);
      var y = Math.sin(lat);
      var z = Math.cos(lat) * Math.cos(lon + rot);
      return { x: cx + x * R, y: cy - y * R, z: z };
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);

      var halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
      halo.addColorStop(0, rgba(A, 0.10));
      halo.addColorStop(0.5, rgba(B, 0.06));
      halo.addColorStop(1, rgba(B, 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2); ctx.fill();

      var sph = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      sph.addColorStop(0, "rgba(255,255,255,0.55)");
      sph.addColorStop(1, "rgba(232,234,242,0.30)");
      ctx.fillStyle = sph;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(A, 0.16); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

      for (var d = 0; d < dots.length; d++) {
        var p = project(dots[d].lat, dots[d].lon);
        if (p.z < -0.02) continue;
        var a = 0.18 + p.z * 0.42;
        ctx.fillStyle = rgba(I2, a.toFixed(3));
        var r = 0.8 + p.z * 1.0;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      }

      var hp = project(hub.lat, hub.lon);
      for (var k = 0; k < arcs.length; k++) {
        var arc = arcs[k];
        arc.t += arc.speed * energy();
        if (arc.t > 1.25) arc.t = -0.15;
        var tp = project(arc.to.lat, arc.to.lon);
        var mx = (hp.x + tp.x) / 2, my = (hp.y + tp.y) / 2;
        var lift = 1 + Math.hypot(tp.x - hp.x, tp.y - hp.y) / (R * 2.4);
        var ddx = mx - cx, ddy = my - cy;
        var cxp = cx + ddx * lift, cyp = cy + ddy * lift;
        var frontish = (hp.z + tp.z) > -0.4;
        if (!frontish) continue;

        ctx.strokeStyle = rgba(A, 0.10); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hp.x, hp.y); ctx.quadraticCurveTo(cxp, cyp, tp.x, tp.y); ctx.stroke();

        var t = Math.max(0, Math.min(1, arc.t));
        var headPts = bezierSeg(hp, { x: cxp, y: cyp }, tp, Math.max(0, t - 0.16), t, 8);
        for (var s = 0; s < headPts.length - 1; s++) {
          var alpha = (s / headPts.length) * 0.9;
          ctx.strokeStyle = rgba(A, alpha.toFixed(3));
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(headPts[s].x, headPts[s].y); ctx.lineTo(headPts[s + 1].x, headPts[s + 1].y); ctx.stroke();
        }
        var head = bezierAt(hp, { x: cxp, y: cyp }, tp, t);
        if (t > 0.02 && t < 0.99) {
          ctx.fillStyle = A;
          ctx.beginPath(); ctx.arc(head.x, head.y, 2.4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = rgba(A, 0.25);
          ctx.beginPath(); ctx.arc(head.x, head.y, 5.5, 0, Math.PI * 2); ctx.fill();
        }
        if (t > 0.9 && tp.z > -0.1) {
          var pr = 3 + (t - 0.9) * 40;
          ctx.strokeStyle = rgba(B, (0.5 * (1 - (t - 0.9) / 0.1)).toFixed(3));
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(tp.x, tp.y, pr, 0, Math.PI * 2); ctx.stroke();
        }
        if (tp.z > -0.1) {
          ctx.fillStyle = B;
          ctx.beginPath(); ctx.arc(tp.x, tp.y, 2.2, 0, Math.PI * 2); ctx.fill();
        }
      }

      if (hp.z > -0.2) {
        var g = ctx.createLinearGradient(hp.x - 5, hp.y - 5, hp.x + 5, hp.y + 5);
        g.addColorStop(0, A); g.addColorStop(1, B);
        ctx.fillStyle = rgba(A, 0.18);
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    function bezierAt(p0, p1, p2, t) {
      var u = 1 - t;
      return {
        x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
      };
    }
    function bezierSeg(p0, p1, p2, t0, t1, n) {
      var pts = [];
      for (var i = 0; i <= n; i++) {
        var t = t0 + (t1 - t0) * (i / n);
        pts.push(bezierAt(p0, p1, p2, Math.max(0, Math.min(1, t))));
      }
      return pts;
    }

    function loop(ts) {
      if (!running) return;
      if (!last) last = ts;
      var dt = Math.min(40, ts - last); last = ts;
      if (!reduce) rot += dt * 0.00012 * energy();
      draw();
      raf = requestAnimationFrame(loop);
    }
    function start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    draw();
    let io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) start(); else stop();
      }, { threshold: 0.05 });
      io.observe(cv);
    } else { start(); }

    return () => {
      stop();
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("spurly:repaint", readCol);
    };
  }, []);

  return (
    <canvas
      id="globe"
      ref={ref}
      role="img"
      aria-label="Animated globe showing outreach connections firing from one hub to cities worldwide"
    />
  );
}
