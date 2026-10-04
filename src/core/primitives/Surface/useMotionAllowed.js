import { useSyncExternalStore } from 'react';

/**
 * 3D pointer motion is only for a real mouse on a device that has no
 * reduced-motion request. Touch screens have no hover to track, and a person
 * who asked their OS for less motion gets none.
 */
const QUERY = '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)';

function getMql() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(QUERY);
}

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

function getSnapshot() {
  return Boolean(getMql()?.matches);
}

/** Server and prerender snapshot is false, so SSR markup is always the flat one. */
function getServerSnapshot() {
  return false;
}

export function useMotionAllowed() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
