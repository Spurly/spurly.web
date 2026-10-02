/* One controller for everything animated in the hero: the paper/ribbon
   background and the globe share a single frame loop, one pointer listener and
   one visibility check. Loaded on demand after hydration, never during
   prerender. */

import { createGlobe } from "./globe.js";
import { createRibbonBackdrop } from "./ribbonShader.js";

/**
 * @returns {{ destroy(): void, hasGlobe: boolean, hasBackdrop: boolean }}
 */
export function mountHeroFx({ hero, stage, bgCanvas, globeCanvas, labelsEl, utcEl, reduced }) {
  const effects = [];
  const backdrop = bgCanvas ? createRibbonBackdrop(bgCanvas, 0.5) : null;
  if (backdrop) effects.push(backdrop);
  const globe = globeCanvas ? createGlobe({ canvas: globeCanvas, labelsEl, utcEl }) : null;
  if (globe) effects.push(globe);

  const mouse = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5 };
  const start = performance.now();
  let visible = true;
  let dead = false;
  let raf = 0;

  const sizeAll = () => effects.forEach((e) => e.resize());
  const drawAll = () => {
    const t = (performance.now() - start) / 1000;
    effects.forEach((e) => e.render(t, mouse.sx, mouse.sy));
  };

  sizeAll();
  drawAll();

  const onMove = (ev) => {
    const r = hero.getBoundingClientRect();
    mouse.x = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
    mouse.y = Math.min(1, Math.max(0, 1 - (ev.clientY - r.top) / r.height));
  };

  const ro = new ResizeObserver(() => {
    sizeAll();
    drawAll();
  });
  ro.observe(hero);

  let io = null;

  if (!reduced) {
    window.addEventListener("pointermove", onMove, { passive: true });
    io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    io.observe(hero);

    const loop = () => {
      if (dead) return;
      if (visible && !document.hidden) {
        mouse.sx += (mouse.x - mouse.sx) * 0.05;
        mouse.sy += (mouse.y - mouse.sy) * 0.05;
        stage.style.setProperty("--ry", ((mouse.sx - 0.5) * 18).toFixed(2) + "deg");
        stage.style.setProperty("--rx", ((mouse.sy - 0.5) * 14).toFixed(2) + "deg");
        drawAll();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  return {
    hasGlobe: Boolean(globe),
    hasBackdrop: Boolean(backdrop),
    destroy() {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      if (io) io.disconnect();
      ro.disconnect();
      effects.forEach((e) => e.destroy());
    },
  };
}
