import { useSyncExternalStore } from 'react';
import profilePhotosApi from 'src/core/gateway/profilePhotosApi.js';

/**
 * Captured LinkedIn avatars, resolved per profile URL, batched across the page.
 *
 * This is the company-logo store with a different key, and deliberately so —
 * see common/utils/companyLogo.js for the full argument. The short version:
 * a person column exists in five tables plus the detail drawer, all rendered
 * by static column definitions with no access to page state, so threading a
 * photo map down from each page would mean editing every page, every column
 * file, and every future table someone adds. The cell asks for what it needs
 * instead, and one request covers the whole table.
 *
 * The url this returns points at Spurly's own CDN, not at LinkedIn. LinkedIn
 * signs its image urls with a ~30 day expiry, so rendering those directly
 * would make every avatar in the product quietly decay into a grey initial
 * about a month after capture. The extension copies the bytes at capture time
 * and the backend stores them under a content hash, which is what makes a
 * photo a user has seen once keep working indefinitely.
 */

/** profileUrl -> image url, or '' for "asked, nothing to show". */
const cache = new Map();

/** URLs registered this tick, waiting to go out as one request. */
let pending = new Set();

/** URLs currently in flight, so a re-render doesn't ask for them again. */
const inFlight = new Set();

const listeners = new Set();

let flushTimer = null;

/** One frame: long enough to catch a table's worth of cells mounting together. */
const BATCH_WINDOW_MS = 16;

/** Matches the server's MAX_SLUGS. Anything above this is split. */
const MAX_PER_REQUEST = 200;

function notify() {
  listeners.forEach((fn) => fn());
}

async function flush() {
  flushTimer = null;

  const urls = [...pending].filter((u) => !cache.has(u) && !inFlight.has(u));
  pending = new Set();
  if (urls.length === 0) return;

  urls.forEach((u) => inFlight.add(u));

  const batches = [];
  for (let i = 0; i < urls.length; i += MAX_PER_REQUEST) {
    batches.push(urls.slice(i, i + MAX_PER_REQUEST));
  }

  for (const batch of batches) {
    try {
      const photos = await profilePhotosApi.getPhotos(batch);
      /* Cache the misses as '' too. Without that, every cell for a person we
         have no photo for re-registers on each render and we ask the server
         about the same people forever. */
      batch.forEach((url) => cache.set(url, photos[url] ?? ''));
    } catch {
      /* Photos are decoration and the cell already has a good fallback, so a
         failure is cached as "nothing" rather than retried. Retrying on every
         render is how a dead endpoint becomes a request storm. */
      batch.forEach((url) => cache.set(url, ''));
    } finally {
      batch.forEach((url) => inFlight.delete(url));
    }
  }

  notify();
}

function request(url) {
  if (!url || cache.has(url) || inFlight.has(url) || pending.has(url)) return;
  pending.add(url);
  if (flushTimer === null) flushTimer = setTimeout(flush, BATCH_WINDOW_MS);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The hosted avatar url for a LinkedIn profile, or '' while unknown.
 *
 * Registering inside the snapshot getter (rather than an effect) is deliberate:
 * useSyncExternalStore calls it during render, so the url is queued before the
 * browser paints and the batch goes out one frame earlier. `request` is
 * idempotent and only mutates a queue, never the snapshot it returns, so
 * repeated calls during render are safe.
 */
export function useProfilePhoto(profileUrl) {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!profileUrl) return '';
      request(profileUrl);
      return cache.get(profileUrl) ?? '';
    },
    () => '',
  );
}

/** Test seam — drop everything the session has learned. */
export function __resetProfilePhotoCache() {
  cache.clear();
  pending = new Set();
  inFlight.clear();
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
