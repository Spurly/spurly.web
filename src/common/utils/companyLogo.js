import { useSyncExternalStore } from 'react';
import companyLogosApi from 'src/core/gateway/companyLogosApi.js';

/**
 * Company logos, resolved per company NAME, batched across the whole page.
 *
 * WHY A MODULE-LEVEL STORE AND NOT A HOOK PER PAGE. A company column exists in
 * five different tables plus the detail drawer, and the rows are rendered by
 * static column definitions that have no access to page state. Threading a
 * logos map down from each page would mean editing every page, every column
 * file, and every future table someone adds — and getting it wrong just means a
 * table silently has no logos.
 *
 * So the cell asks for what it needs instead. `useCompanyLogo(name)` registers
 * the name here, the store batches every name registered in the same tick into
 * one request, and every cell showing that company re-renders when the answer
 * lands. A new table gets logos by using CompanyCell, which it already does.
 *
 * The cache is module memory, so it lives for the session and dies on reload.
 * That is the right lifetime: it makes repeat navigation between People,
 * Connections and Campaigns free, and a page refresh is exactly when you'd
 * want newly-resolved logos to appear.
 */

/** name -> domain string, or '' for "asked, nothing to show". */
const cache = new Map();

/** Names registered this tick, waiting to go out as one request. */
let pending = new Set();

/** Names currently in flight, so a re-render doesn't ask for them again. */
const inFlight = new Set();

const listeners = new Set();

let flushTimer = null;

/**
 * How long to collect names before sending. One frame is enough to catch a
 * whole table's worth of cells mounting together, and short enough that nobody
 * perceives it as a delay.
 */
const BATCH_WINDOW_MS = 16;

/** Matches the server's MAX_NAMES. Anything above this is split. */
const MAX_PER_REQUEST = 200;

function notify() {
  listeners.forEach((fn) => fn());
}

async function flush() {
  flushTimer = null;

  const names = [...pending].filter((n) => !cache.has(n) && !inFlight.has(n));
  pending = new Set();
  if (names.length === 0) return;

  names.forEach((n) => inFlight.add(n));

  const batches = [];
  for (let i = 0; i < names.length; i += MAX_PER_REQUEST) {
    batches.push(names.slice(i, i + MAX_PER_REQUEST));
  }

  for (const batch of batches) {
    try {
      const logos = await companyLogosApi.getLogos(batch);
      /* Cache the misses as '' too. Without that, every cell for an
         unresolvable company re-registers its name on each render and we ask
         the server about "Freelance" forever. */
      batch.forEach((name) => cache.set(name, logos[name] ?? ''));
    } catch {
      /* Logos are decoration and the cell already has a good fallback, so a
         failure is cached as "nothing" rather than retried. Retrying on every
         render is how a dead endpoint becomes a request storm. */
      batch.forEach((name) => cache.set(name, ''));
    } finally {
      batch.forEach((name) => inFlight.delete(name));
    }
  }

  notify();
}

function request(name) {
  if (!name || cache.has(name) || inFlight.has(name) || pending.has(name)) return;
  pending.add(name);
  if (flushTimer === null) flushTimer = setTimeout(flush, BATCH_WINDOW_MS);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The domain for a company name, or '' while unknown.
 *
 * Registering inside the snapshot getter (rather than an effect) is deliberate:
 * useSyncExternalStore calls it during render, so the name is queued before the
 * browser paints and the batch goes out one frame earlier. `request` is
 * idempotent and only mutates a queue, never the snapshot it returns, so
 * repeated calls during render are safe.
 */
export function useCompanyLogo(name) {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!name) return '';
      request(name);
      return cache.get(name) ?? '';
    },
    () => '',
  );
}

/**
 * Build a logo image URL from a resolved domain.
 *
 * The token here is logo.dev's PUBLISHABLE key — it is designed to sit in
 * public HTML, and is not the secret key the backend searches with.
 *
 * `fallback=404` matters: logo.dev's default is to invent a plain monogram and
 * return it with 200, which would override our own tinted initial with a
 * greyer, less useful version of the same idea. Asking for a 404 instead lets
 * Avatar's onError put our fallback back.
 */
export function companyLogoUrl(domain, size = 64) {
  const token = import.meta.env.VITE_LOGO_DEV_TOKEN;
  if (!domain || !token) return '';
  return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${token}&size=${size}&format=png&fallback=404&retina=true`;
}

/** Test seam — drop everything the session has learned. */
export function __resetCompanyLogoCache() {
  cache.clear();
  pending = new Set();
  inFlight.clear();
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
