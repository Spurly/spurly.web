import { useEffect } from 'react';

/** Peak tilt in degrees on a tile-sized card. Wide panels are damped below. */
export const MAX_TILT_DEG = 7;
/** At or below this width a card gets the full angle; wider cards get less. */
const FULL_ANGLE_WIDTH = 360;

/**
 * Pointer-tracked tilt. Writes CSS variables straight onto the element (no
 * React state, so moving the mouse never re-renders anything) and batches the
 * writes into one per animation frame.
 *
 *   --rx / --ry   unitless degrees, read by `.ui-surface--tilt` in index.css
 *   --gx / --gy   pointer position in %, drives the glare
 *   data-tilting  present only while the pointer is over the card
 *
 * Wide panels would swing like a barn door at the same angle as a small tile,
 * so the angle scales down with width.
 */
export function useTilt(ref, enabled, max = MAX_TILT_DEG) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;

    let frame = 0;
    let pending = null;

    const flush = () => {
      frame = 0;
      if (!pending) return;
      el.style.setProperty('--rx', pending.rx.toFixed(2));
      el.style.setProperty('--ry', pending.ry.toFixed(2));
      el.style.setProperty('--gx', `${pending.gx.toFixed(1)}%`);
      el.style.setProperty('--gy', `${pending.gy.toFixed(1)}%`);
    };

    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pending = null;
      delete el.dataset.tilting;
      el.style.setProperty('--rx', '0');
      el.style.setProperty('--ry', '0');
    };

    const onMove = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      const angle = max * Math.min(1, FULL_ANGLE_WIDTH / rect.width);
      pending = { rx: (0.5 - py) * 2 * angle, ry: (px - 0.5) * 2 * angle, gx: px * 100, gy: py * 100 };
      el.dataset.tilting = 'true';
      if (!frame) frame = requestAnimationFrame(flush);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', reset);
    el.addEventListener('pointercancel', reset);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', reset);
      el.removeEventListener('pointercancel', reset);
      reset();
    };
  }, [ref, enabled, max]);
}
