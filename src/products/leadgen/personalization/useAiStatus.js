import { useCallback, useEffect, useState } from 'react';
import personalizationController from 'src/products/leadgen/personalization/controller.js';

/**
 * Provider availability + the user's remaining daily AI quota.
 *
 * Fetched once per mount and cached at module scope for a short window: every
 * surface that offers an AI button (the template editor, each campaign member
 * row) would otherwise call /status independently, which turns a page with
 * twenty rows into twenty identical requests.
 *
 * A failed status check resolves to `available: false` rather than throwing —
 * the AI controls are an enhancement, and a status outage should grey them out,
 * not break the page they live on.
 */

const CACHE_TTL_MS = 60_000;

let cached = null;
let cachedAt = 0;
let inflight = null;

/** Test/logout seam — forget the cached status. */
export function resetAiStatusCache() {
  cached = null;
  cachedAt = 0;
  inflight = null;
}

async function loadStatus(force = false) {
  if (!force && cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached;

  // Collapse concurrent callers onto one request.
  if (!force && inflight) return inflight;

  inflight = personalizationController
    .getStatus()
    .then((data) => {
      cached = { ...data, failed: false, failure: null };
      cachedAt = Date.now();
      return cached;
    })
    .catch((error) => {
      // `failed` distinguishes "the server told us no provider is configured"
      // from "we never reached the server". Both leave available:false, but
      // only the first should silently hide the AI controls — a status call
      // that 401s or times out is a bug worth surfacing, and collapsing the two
      // makes a broken deployment look like an uninstalled feature.
      cached = {
        available: false,
        providers: [],
        quota: null,
        tones: [],
        failed: true,
        failure: error?.message || 'Could not reach the personalization service',
      };
      cachedAt = Date.now();
      return cached;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * @param {boolean} [enabled] - skip the fetch entirely (e.g. control is hidden)
 * @returns {{ status, loading, available, quota, refresh }}
 */
export function useAiStatus(enabled = true) {
  const [status, setStatus] = useState(cached);
  const [loading, setLoading] = useState(enabled && !cached);

  useEffect(() => {
    if (!enabled) return undefined;

    let alive = true;

    loadStatus().then((data) => {
      if (alive) {
        setStatus(data);
        setLoading(false);
      }
    });

    return () => {
      alive = false;
    };
  }, [enabled]);

  /** Re-read after a generation, so the quota counter reflects what was spent. */
  const refresh = useCallback(async () => {
    const data = await loadStatus(true);
    setStatus(data);
    return data;
  }, []);

  return {
    status,
    loading,
    available: Boolean(status?.available),
    /** True when the status request itself failed, not when it reported no providers. */
    failed: Boolean(status?.failed),
    failure: status?.failure || null,
    quota: status?.quota || null,
    refresh,
  };
}

export default useAiStatus;
