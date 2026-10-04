import { useSyncExternalStore } from 'react';

/**
 * True when count-up and draw-in animation is fine: the user has not asked
 * their OS for reduced motion. Unlike 3D tilt this does not need a mouse, so
 * a phone still gets its numbers counting up. Server and test snapshots are
 * false, so SSR and tests render the final value immediately.
 */
const QUERY = '(prefers-reduced-motion: no-preference)';

const getMql = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;

function subscribe(onChange) {
  const mql = getMql();
  if (!mql) return () => {};
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }
  mql.addListener?.(onChange);
  return () => mql.removeListener?.(onChange);
}

export function useAnimatedOk() {
  return useSyncExternalStore(subscribe, () => Boolean(getMql()?.matches), () => false);
}
