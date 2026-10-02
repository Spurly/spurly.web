/* Fixed, full-page ribbon layer behind every public page. Drawn at reduced
   resolution and throttled to ~30fps; pauses when the tab is hidden. Reduced
   motion gets a still frame that only re-draws on resize. */

import { createRibbonBackdrop } from "./ribbonShader.js";

export function mountSiteBackdrop(canvas, reduced) {
  const fx = createRibbonBackdrop(canvas, 0.4, "site");
  if (!fx) return null;

  const start = performance.now();
  let raf = 0;
  let dead = false;
  let last = 0;
  const draw = () => fx.render((performance.now() - start) / 1000, 0.5, 0.5);
  const resize = () => {
    fx.resize();
    draw();
  };
  resize();
  window.addEventListener("resize", resize);

  if (!reduced) {
    const loop = (now) => {
      if (dead) return;
      if (!document.hidden && now - last > 33) {
        last = now;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  } else {
    window.addEventListener("scroll", draw, { passive: true });
  }

  return {
    destroy() {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", draw);
      fx.destroy();
    },
  };
}
