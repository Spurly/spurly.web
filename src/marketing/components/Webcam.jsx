import { useEffect, useRef } from "react";
import { VideoIcon, ShieldIcon } from "../icons.jsx";

/* WEBCAM PIXEL GRID (opt-in, local-only) — ported verbatim from
   effects.js initWebcam(). Class toggles are applied imperatively via
   refs so the behaviour matches the original exactly. */
export default function Webcam() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    function cssVar(name, fb) {
      var v = getComputedStyle(document.body).getPropertyValue(name);
      return (v && v.trim()) || fb;
    }

    var stage = root.querySelector(".webcam-stage");
    var cv = root.querySelector("canvas");
    var overlay = root.querySelector(".webcam-overlay");
    var badge = root.querySelector(".webcam-badge");
    var startBtn = root.querySelector("[data-cam-start]");
    var stopBtn = root.querySelector("[data-cam-stop]");
    var msg = root.querySelector("[data-cam-msg]");
    var ctx = cv.getContext("2d");
    var video = document.createElement("video");
    video.muted = true; video.playsInline = true; video.setAttribute("playsinline", "");
    var sample = document.createElement("canvas");
    var sctx = sample.getContext("2d", { willReadFrequently: true });
    var COLS = 72, stream = null, raf = null, colA, colB;

    function hexRgb(x) { x = (x || "").trim(); if (x[0] === "#") x = x.slice(1); if (x.length === 3) x = x.split("").map(function (c) { return c + c; }).join(""); var n = parseInt(x, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }

    function fit() {
      var r = stage.getBoundingClientRect();
      var DPR = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = r.width * DPR; cv.height = r.height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function render() {
      var r = stage.getBoundingClientRect();
      var aspect = (video.videoHeight || 3) / (video.videoWidth || 4);
      var rows = Math.round(COLS * aspect);
      sample.width = COLS; sample.height = rows;
      sctx.save(); sctx.scale(-1, 1); sctx.drawImage(video, -COLS, 0, COLS, rows); sctx.restore();
      var data;
      try { data = sctx.getImageData(0, 0, COLS, rows).data; } catch (e) { return; }

      colA = hexRgb(cssVar("--purple", "#2d6ae0"));
      colB = hexRgb(cssVar("--blue", "#38bdf8"));
      ctx.clearRect(0, 0, r.width, r.height);
      ctx.fillStyle = "#0c1018"; ctx.fillRect(0, 0, r.width, r.height);
      var cw = r.width / COLS, chh = r.height / rows, cell = Math.min(cw, chh);
      var offx = (r.width - cell * COLS) / 2, offy = (r.height - cell * rows) / 2;

      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < COLS; x++) {
          var idx = (y * COLS + x) * 4;
          var lum = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
          if (lum < 0.06) continue;
          var c = [
            Math.round(colA[0] + (colB[0] - colA[0]) * lum),
            Math.round(colA[1] + (colB[1] - colA[1]) * lum),
            Math.round(colA[2] + (colB[2] - colA[2]) * lum)
          ];
          var rr = (cell * 0.5) * (0.35 + lum * 0.62);
          ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (0.25 + lum * 0.75).toFixed(3) + ")";
          ctx.beginPath();
          ctx.arc(offx + x * cell + cell / 2, offy + y * cell + cell / 2, rr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(render);
    }

    function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (msg) msg.textContent = "Your browser can't access the camera here — try the live site.";
        return;
      }
      startBtn.disabled = true;
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false })
        .then(function (s) {
          stream = s; video.srcObject = s;
          return video.play();
        })
        .then(function () {
          fit();
          overlay.classList.add("hidden");
          badge.classList.add("show");
          stopBtn.classList.add("show");
          render();
        })
        .catch(function () {
          startBtn.disabled = false;
          if (msg) msg.textContent = "Camera access was blocked. Allow it in your browser to try this — nothing is ever uploaded.";
        });
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(function (tk) { tk.stop(); });
      stream = null;
      overlay.classList.remove("hidden");
      badge.classList.remove("show");
      stopBtn.classList.remove("show");
      startBtn.disabled = false;
    }

    function onResize() { if (stream) fit(); }
    window.addEventListener("resize", onResize);
    var ro = ("ResizeObserver" in window) ? new ResizeObserver(onResize) : null;
    if (ro) ro.observe(stage);
    startBtn.addEventListener("click", start);
    stopBtn.addEventListener("click", stop);
    window.addEventListener("pagehide", stop);

    return () => {
      stop();
      if (ro) ro.disconnect();
      window.removeEventListener("resize", onResize);
      startBtn.removeEventListener("click", start);
      stopBtn.removeEventListener("click", stop);
      window.removeEventListener("pagehide", stop);
    };
  }, []);

  return (
    <section id="webcam-sec" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">See yourself in the network</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Every pixel is a connection waiting to happen.</h2>
          <p className="lead">A little fun — turn on your camera and watch yourself render in Spurly's signature dot grid. Runs entirely on your device; nothing is uploaded, ever. Just like your leads.</p>
        </div>
        <div id="webcam" className="reveal d1" ref={rootRef}>
          <div className="webcam-stage">
            <canvas />
            <div className="webcam-badge"><span className="rec" />Live · on-device only</div>
            <div className="webcam-overlay">
              <div className="a-ico" style={{ background: "var(--grad)", width: 58, height: 58, borderRadius: 17, display: "grid", placeItems: "center", color: "#fff" }}>
                <VideoIcon width="28" height="28" />
              </div>
              <h3 className="h3">Try the pixel grid</h3>
              <p data-cam-msg>Allow camera access to see the effect. The feed never leaves your browser — no recording, no upload.</p>
              <button className="btn btn-primary" data-cam-start>
                <VideoIcon width="18" height="18" />
                Turn on camera
              </button>
            </div>
            <button className="btn btn-ghost btn-sm webcam-stop" data-cam-stop>Stop camera</button>
          </div>
          <p className="webcam-note"><ShieldIcon />100% local — the same privacy promise we give your leads.</p>
        </div>
      </div>
    </section>
  );
}
