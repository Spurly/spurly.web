import { useState, useEffect, useCallback, useRef } from 'react';
import outreachController from 'src/platform/outreach/controller.js';
import { useErrorToast } from 'src/ui/primitives';

const EMPTY_SUMMARY = {
  total: 0,
  statusCounts: { none: 0, invited: 0, connected: 0, messaged: 0, failed: 0 },
  contacted: 0,
  needsAttention: 0,
  connectionBudget: { weekUsed: 0, dayUsed: 0, weeklyLimit: 0, weeklyRemaining: 0, resetsAt: null },
  messagesThisWeek: 0,
};

/**
 * Outreach status counts + the weekly LinkedIn invite budget.
 *
 * The extension writes send results back asynchronously, so when a campaign is
 * mid-flight the counts go stale within seconds. Pass `pollMs` to keep them
 * live while something is sending.
 *
 * @param {Object}  [opts]
 * @param {number}  [opts.pollMs=0] - refetch interval; 0 disables polling
 */
export function useOutreachSummary({ pollMs = 0 } = {}) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await outreachController.getSummary();
      if (!mountedRef.current) return;
      setSummary({ ...EMPTY_SUMMARY, ...next });
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      // Non-fatal: the People table still works without status counts, so we
      // surface the error but keep the last-known summary.
      setError(err.message || 'Failed to load outreach summary');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!pollMs) return undefined;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [pollMs, refresh]);

  /* Reported twice on purpose: the inline block the page renders (which
     persists next to the empty table) and one toast (which catches the eye
     if that block is off screen). The toast gets fixed copy — the server's
     text goes inline, where there's room for it. */
  useErrorToast(error, "Couldn't load outreach activity");

  return { summary, loading, error, refresh };
}
