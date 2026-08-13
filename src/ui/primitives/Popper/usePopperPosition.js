import { useCallback, useLayoutEffect, useState } from 'react';

/**
 * Positioning geometry for every floating surface in the app — tooltips,
 * dropdowns, popovers, the command palette.
 *
 * Written in-house on purpose. The three things that actually matter, and that
 * naive `position: absolute` gets wrong:
 *
 *   1. FLIP — if the floating element would overflow the viewport on its
 *      preferred side, put it on the opposite side instead.
 *   2. SHIFT — slide it along the cross axis so it stays inside the viewport,
 *      without detaching from the trigger.
 *   3. SCROLL — the table has a sticky header and an internal scroll container.
 *      Anything anchored with `absolute` inside it gets clipped or drifts. We
 *      position with `fixed` against viewport coordinates and recompute on
 *      scroll, which is immune to every ancestor's overflow.
 *
 * Returns viewport coordinates for a `position: fixed` element.
 */

const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

function computeCoords(anchor, floating, placement, offset) {
  const centreX = anchor.left + anchor.width / 2 - floating.width / 2;
  const centreY = anchor.top + anchor.height / 2 - floating.height / 2;

  switch (placement) {
    case 'top':
      return { x: centreX, y: anchor.top - floating.height - offset };
    case 'bottom':
      return { x: centreX, y: anchor.bottom + offset };
    case 'left':
      return { x: anchor.left - floating.width - offset, y: centreY };
    case 'right':
      return { x: anchor.right + offset, y: centreY };
    default:
      return { x: centreX, y: anchor.bottom + offset };
  }
}

function overflows(coords, floating, padding) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return (
    coords.x < padding ||
    coords.y < padding ||
    coords.x + floating.width > vw - padding ||
    coords.y + floating.height > vh - padding
  );
}

function clamp(coords, floating, padding, axis) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const next = { ...coords };

  if (axis === 'x') {
    next.x = Math.min(Math.max(padding, next.x), vw - floating.width - padding);
  } else {
    next.y = Math.min(Math.max(padding, next.y), vh - floating.height - padding);
  }
  return next;
}

export function usePopperPosition({
  anchorRef,
  floatingRef,
  placement = 'top',
  offset = 6,
  padding = 8,
  open = false,
}) {
  const [position, setPosition] = useState({ x: 0, y: 0, placement, ready: false });

  const update = useCallback(() => {
    const anchorEl = anchorRef?.current;
    const floatingEl = floatingRef?.current;
    if (!anchorEl || !floatingEl) return;

    const anchor = anchorEl.getBoundingClientRect();
    const floating = {
      width: floatingEl.offsetWidth,
      height: floatingEl.offsetHeight,
    };

    let active = placement;
    let coords = computeCoords(anchor, floating, active, offset);

    /* 1. Flip to the opposite side if the preferred one overflows, but only if
          the flipped side is actually better — otherwise we'd trade one
          overflow for another. */
    if (overflows(coords, floating, padding)) {
      const flipped = OPPOSITE[active] || active;
      const flippedCoords = computeCoords(anchor, floating, flipped, offset);
      if (!overflows(flippedCoords, floating, padding)) {
        active = flipped;
        coords = flippedCoords;
      }
    }

    /* 2. Shift along the cross axis. Vertical placements slide horizontally
          and vice versa, so the element never detaches from its anchor. */
    const crossAxis = active === 'top' || active === 'bottom' ? 'x' : 'y';
    coords = clamp(coords, floating, padding, crossAxis);

    setPosition({ x: Math.round(coords.x), y: Math.round(coords.y), placement: active, ready: true });
  }, [anchorRef, floatingRef, placement, offset, padding]);

  useLayoutEffect(() => {
    /* No reset on close: the floating element unmounts, so clearing `ready`
       here would only queue a render for a subtree that is going away — and it
       cascades, because the state change re-runs this effect. Callers mount the
       element fresh on the next open, and `ready` is false until the first
       measurement lands. */
    if (!open) return undefined;

    update();

    /* 3. Capture-phase scroll listening catches scroll events from every
          ancestor container, not just the window — which is what makes this
          work inside the table's own scroll area. */
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    let observer;
    if (typeof ResizeObserver !== 'undefined' && floatingRef?.current) {
      observer = new ResizeObserver(update);
      observer.observe(floatingRef.current);
    }

    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [open, update, floatingRef]);

  return position;
}
