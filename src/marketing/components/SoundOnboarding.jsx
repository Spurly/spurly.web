import { useEffect } from "react";

/* First-visit nudge: a fake cursor glides from the Spurly logo to the
   speaker toggle and "taps" it, drawing attention to the sound control.
   Shown once per browser. The real tap (which unlocks audio) is the
   user's — this only points the way. */
export default function SoundOnboarding() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const KEY = "spurly_sound_intro_v1";
    // Always replay on localhost so it's testable; once per browser in prod.
    const isLocal =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";
    try {
      if (!isLocal && localStorage.getItem(KEY)) return;
    } catch (e) {}

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer:fine)").matches;

    const startTimer = setTimeout(run, 1000);
    const cleanups = [];

    function run() {
      const brand = document.getElementById("brand-logo");
      const speaker = document.getElementById("sound-toggle");
      if (!brand || !speaker) return;
      try {
        if (!isLocal) localStorage.setItem(KEY, "1");
      } catch (e) {}

      // Pulse the speaker on every device.
      speaker.classList.add("attn");
      cleanups.push(
        setTimeout(() => speaker.classList.remove("attn"), 3200)
      );

      // Cursor glide only makes sense on desktop / with motion.
      if (reduce || !fine) return;
      animateCursor(brand, speaker);
    }

    function animateCursor(brand, speaker) {
      const b = brand.getBoundingClientRect();
      const s = speaker.getBoundingClientRect();
      const bx = b.left + b.width / 2;
      const by = b.top + b.height / 2;
      const sx = s.left + s.width / 2;
      const sy = s.top + s.height / 2;

      const cur = document.createElement("div");
      cur.className = "intro-cursor";
      cur.innerHTML =
        '<span class="ic-in"><svg viewBox="0 0 24 24" width="26" height="26">' +
        '<path d="M5 3l15 9-6 1.6L11 20 5 3z" fill="#1c1c1f" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>' +
        "</svg></span>";
      cur.style.transform = "translate(" + bx + "px," + by + "px)";
      cur.style.opacity = "0";
      document.body.appendChild(cur);

      // Fade in at the logo, then glide to the speaker.
      requestAnimationFrame(() => {
        cur.style.transition = "opacity .3s ease";
        cur.style.opacity = "1";
        requestAnimationFrame(() => {
          cur.style.transition =
            "transform 1.15s cubic-bezier(.5,.05,.2,1), opacity .3s ease";
          cur.style.transform = "translate(" + sx + "px," + sy + "px)";
        });
      });

      // Tap when it arrives.
      cleanups.push(
        setTimeout(() => {
          cur.classList.add("tap");
          speaker.classList.add("ripple");
          cleanups.push(
            setTimeout(() => speaker.classList.remove("ripple"), 650)
          );
        }, 1550)
      );

      // Fade out and remove.
      cleanups.push(
        setTimeout(() => {
          cur.style.transition = "opacity .4s ease";
          cur.style.opacity = "0";
          cleanups.push(setTimeout(() => cur.remove(), 450));
        }, 2500)
      );
    }

    return () => {
      clearTimeout(startTimer);
      cleanups.forEach((t) => clearTimeout(t));
      const stray = document.querySelector(".intro-cursor");
      if (stray) stray.remove();
    };
  }, []);

  return null;
}
