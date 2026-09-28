/**
 * Tiny pub/sub tracking how many route chunks are currently in flight.
 *
 * Exists because v7_startTransition (App.jsx) deliberately keeps the
 * previous page on screen during a route transition instead of showing
 * Suspense's fallback. That's great when the next chunk is cached/fast,
 * but with nothing else on screen, a slow chunk (cold cache, poor
 * connection) looks like the app froze: the URL changes and nothing else
 * does. lazyWithProgress() reports into this store; RouteProgressBar
 * reads it to show a delayed indicator only when a load is actually slow.
 */
let count = 0;
const listeners = new Set();

function notify() {
  const loading = count > 0;
  listeners.forEach((listener) => listener(loading));
}

export function startRouteLoad() {
  count += 1;
  notify();
}

export function endRouteLoad() {
  count = Math.max(0, count - 1);
  notify();
}

export function subscribeRouteLoading(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
