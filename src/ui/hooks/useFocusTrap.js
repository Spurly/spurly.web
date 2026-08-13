import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

/**
 * Keep Tab inside an overlay, and put focus back where it came from on close.
 *
 * Without this, tabbing out of a modal walks into the page behind it — the
 * content is visually covered but still reachable, so a keyboard or screen
 * reader user ends up interacting with a UI they can't see.
 *
 * The initial focus target is the first focusable element, falling back to the
 * container itself (which callers give `tabIndex={-1}`) when there is nothing
 * focusable inside.
 */
export function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    const previouslyFocused = document.activeElement;

    /* Deferred a frame: content rendered in the same commit isn't laid out yet,
       so offsetParent is null and everything reads as unfocusable. */
    const raf = requestAnimationFrame(() => {
      const items = focusable(container);
      (items[0] || container).focus({ preventScroll: true });
    });

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const items = focusable(container);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('keydown', onKeyDown);
      /* Only restore if focus is still inside the overlay. If something else
         has deliberately moved it (a toast action, a redirect), stealing it
         back would be worse than leaving it. */
      if (previouslyFocused instanceof HTMLElement && container.contains(document.activeElement)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [containerRef, active]);
}
