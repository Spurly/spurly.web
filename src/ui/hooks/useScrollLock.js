import { useLayoutEffect } from 'react';

/**
 * Lock body scroll while an overlay is open.
 *
 * Reference counted at module scope. Two overlays can be open at once (a
 * confirm dialog over a drawer); if each unlocked on its own unmount, closing
 * the top one would restore scrolling underneath the one still open.
 *
 * Removing the scrollbar shifts layout by its width, so we compensate with
 * padding — otherwise the whole page jumps sideways every time a modal opens.
 */
let lockCount = 0;
let restore = null;

export function useScrollLock(active) {
  useLayoutEffect(() => {
    if (!active) return undefined;

    if (lockCount === 0) {
      const { body, documentElement } = document;
      const scrollbar = window.innerWidth - documentElement.clientWidth;

      restore = {
        overflow: body.style.overflow,
        paddingRight: body.style.paddingRight,
      };

      body.style.overflow = 'hidden';
      if (scrollbar > 0) {
        const current = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
        body.style.paddingRight = `${current + scrollbar}px`;
      }
    }

    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0 && restore) {
        document.body.style.overflow = restore.overflow;
        document.body.style.paddingRight = restore.paddingRight;
        restore = null;
      }
    };
  }, [active]);
}
