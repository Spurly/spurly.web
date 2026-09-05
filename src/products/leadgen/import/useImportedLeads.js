import { useState, useEffect, useCallback, useRef } from 'react';
import importedLeadsApi from 'src/products/leadgen/import/api.js';
import {
  startEnrichment,
  stopEnrichment,
  getEnrichmentState,
  onExtensionEvent,
  ENRICH_EVENTS,
  pingExtension,
  supportsEnrichment,
  MIN_ENRICH_VERSION,
} from 'src/shared/extension/extensionBridge.js';

const DEFAULT_LIMIT = 50;

/**
 * Most leads the extension will drain in one run. Mirrors MAX_ENRICH_QUEUE in
 * the backend's importedLeads service — the server enforces it, this is here
 * so the user gets told before making the request.
 */
export const MAX_ENRICH_PER_RUN = 500;

/**
 * Owns the CSV staging area: the paginated list of imported leads, the
 * enrichment run, and promotion into People.
 *
 * The enrichment run itself lives in the extension's background worker, so
 * this hook is a *view* of it, not the owner. That matters for correctness:
 * the run keeps going if the user navigates away, so on mount we ask the
 * worker whether one is already in flight rather than assuming it isn't.
 */
export function useImportedLeads() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: {} });
  const [pagination, setPagination] = useState({ total: 0, limit: DEFAULT_LIMIT, skip: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [enriching, setEnriching] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [actionError, setActionError] = useState(null);
  // Non-failures worth saying out loud — chiefly "we couldn't hand this to the
  // extension directly, but it's queued and the worker will pick it up".
  const [actionNotice, setActionNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  // Read inside callbacks/intervals that must not re-subscribe on every change.
  const queryRef = useRef({ search, statusFilter, page, limit: DEFAULT_LIMIT });
  useEffect(() => {
    queryRef.current = { search, statusFilter, page, limit: pagination.limit || DEFAULT_LIMIT };
  }, [search, statusFilter, page, pagination.limit]);

  /**
   * @param {Object} overrides - query overrides for this call
   * @param {Object} [opts]
   * @param {boolean} [opts.silent] - refresh WITHOUT flipping `loading`.
   *
   * `silent` exists because DataTable swaps its body for skeleton rows
   * whenever `loading` is true. The 4s poll during an enrichment run would
   * otherwise strobe the whole table every tick, which reads as the page
   * being broken. Background refreshes update the data in place; only
   * user-driven loads (first paint, search, filter, page) show a skeleton.
   */
  const fetchLeads = useCallback(async (overrides = {}, opts = {}) => {
    const q = { ...queryRef.current, ...overrides };
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const limit = q.limit || DEFAULT_LIMIT;
      const [listRes, statsRes] = await Promise.all([
        importedLeadsApi.getLeads({
          limit,
          skip: Math.max(0, (q.page - 1) * limit),
          search: q.search,
          enrichStatus: q.statusFilter,
        }),
        importedLeadsApi.getStats(),
      ]);

      if (listRes?.success) {
        setLeads(listRes.data?.leads || []);
        setPagination(listRes.data?.pagination || { total: 0, limit, skip: 0 });
      } else {
        setError(listRes?.message || 'Could not load imported leads');
      }
      const nextStats = statsRes?.success ? statsRes.data || { total: 0, byStatus: {} } : null;
      if (nextStats) setStats(nextStats);
      return nextStats;
    } catch (err) {
      setError(err?.message || 'Could not load imported leads');
      return null;
    } finally {
      if (!opts.silent) setLoading(false);
    }
  }, []);

  // Debounced refetch on any query change. 350ms matches the DataTable toolbar.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads({ search, statusFilter, page });
    }, 350);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page, fetchLeads]);

  // Resync with a run that may already be going (page was reloaded mid-run).
  useEffect(() => {
    let cancelled = false;
    getEnrichmentState()
      .then((state) => {
        if (cancelled || !state?.running) return;
        setEnriching(true);
        setProgress({ current: state.current || 0, total: state.total || 0 });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Live progress from the extension.
  useEffect(() => {
    const unsubscribe = onExtensionEvent(({ action, payload }) => {
      if (action === ENRICH_EVENTS.PROGRESS) {
        setProgress({ current: payload.current || 0, total: payload.total || 0 });
        setEnriching(true);
      } else if (action === ENRICH_EVENTS.COMPLETE) {
        setEnriching(false);
        setProgress({ current: 0, total: 0 });
        if (payload?.error) setActionError(payload.error);
        fetchLeads({}, { silent: true });
      }
    });
    return unsubscribe;
  }, [fetchLeads]);

  // While a run is in flight, poll so rows flip to Enriched as they land even
  // if a progress event was dropped (the worker can sleep between profiles).
  useEffect(() => {
    if (!enriching) return undefined;

    // Self-heal a stuck run. ENRICH_COMPLETE can be missed — the page may have
    // been closed when it fired, or the message dropped — and without this the
    // UI would sit on a progress bar and poll forever. Two consecutive empty
    // readings (~8s) rather than one, so we can't trip on the brief window
    // between starting a run and the first status write landing.
    let consecutiveEmpty = 0;

    const id = setInterval(async () => {
      const nextStats = await fetchLeads({}, { silent: true });
      if (!nextStats) return;

      const waiting = (nextStats.byStatus?.queued || 0) + (nextStats.byStatus?.enriching || 0);
      consecutiveEmpty = waiting === 0 ? consecutiveEmpty + 1 : 0;

      if (consecutiveEmpty >= 2) {
        setEnriching(false);
        setProgress({ current: 0, total: 0 });
      }
    }, 4000);

    return () => clearInterval(id);
  }, [enriching, fetchLeads]);

  /**
   * Hammer the start trigger until the worker confirms.
   *
   * Every call also WAKES the service worker, which is the point: a message to
   * a sleeping worker is silently dropped, so a single attempt regularly does
   * nothing. Same approach as the campaign send path.
   */
  const kickStart = useCallback(async () => {
    for (let i = 0; i < 10; i += 1) {
      let res;
      try {
        res = await startEnrichment();
      } catch {
        res = { started: false, error: 'no response' };
      }
      if (res?.started) return { ok: true };

      const message = (res && res.error) || '';

      // An out-of-date bridge rejects the action outright. Retrying can only
      // waste a minute — the build will not gain the feature mid-loop.
      if (message.startsWith('UNSUPPORTED_ACTION')) {
        return {
          ok: false,
          hard: true,
          error: `Your Spurly extension is too old to enrich leads — v${MIN_ENRICH_VERSION} or newer is required. Reload it at chrome://extensions, and remove any duplicate Spurly extension pointing at an older folder.`,
        };
      }

      // Non-retryable — hammering won't change the answer.
      if (/not logged in|already running/i.test(message)) {
        return { ok: false, hard: true, error: message };
      }
      // "No leads are queued" from the worker means it already drained the
      // queue (its own poll beat us to it) — not a failure.
      if (/no leads are queued/i.test(message)) return { ok: true };

      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    // Soft failure: the worker never answered, but the queue is in the
    // database and the extension's alarm poll will drain it regardless.
    return { ok: false, hard: false };
  }, []);

  /**
   * Queue the selected leads, then ask the extension to drain the queue.
   *
   * Queueing happens on the BACKEND first, so if the extension is asleep or
   * temporarily unreachable the work is still recorded and can be retried —
   * nothing is lost by a failed handshake.
   */
  const enrichSelected = useCallback(
    async (ids) => {
      if (!ids?.length || busy || enriching) return { ok: false };
      setActionError(null);
      setActionNotice(null);

      if (ids.length > MAX_ENRICH_PER_RUN) {
        const message = `Enrich up to ${MAX_ENRICH_PER_RUN} leads at a time — you selected ${ids.length}. Try a smaller batch.`;
        setActionError(message);
        return { ok: false, error: message };
      }

      setBusy(true);
      try {
        const queueRes = await importedLeadsApi.queueEnrichment(ids);
        if (!queueRes?.success) {
          setActionError(queueRes?.message || 'Could not queue those leads');
          return { ok: false, error: queueRes?.message };
        }

        // Rows are queued server-side — reflect it immediately. Silent: the
        // user is looking at the rows they just selected, and blanking them
        // into skeletons mid-action is disorienting.
        await fetchLeads({}, { silent: true });

        const ext = await pingExtension();
        if (!ext.installed) {
          setActionError(
            'Your leads are queued, but the Spurly extension isn’t detected. Enable it, then press Resume.',
          );
          return { ok: false, needsExtension: true };
        }

        // An out-of-date build answers the ping but silently drops
        // ENRICH_START, so without this check the user waits out ten retries
        // for a generic timeout. `loginKnown` guards against a sleeping worker
        // that couldn't report its version in time — unknown is not "old".
        if (ext.loginKnown && !supportsEnrichment(ext.version)) {
          setActionError(
            `Your Spurly extension (v${ext.version || 'unknown'}) is too old to enrich leads — v${MIN_ENRICH_VERSION} or newer is required. ` +
              'Reload it at chrome://extensions, and remove any duplicate Spurly extension that points at an older folder. Your leads stay queued.',
          );
          return { ok: false, needsExtension: true };
        }

        setEnriching(true);
        // `pending` counts newly-queued PLUS leads already waiting from an
        // earlier failed start, which is what this run will actually process.
        setProgress({ current: 0, total: queueRes.data?.pending || ids.length });

        const started = await kickStart();
        if (!started.ok) {
          // A hard rejection (old build, signed out) is a real error the user
          // must act on.
          if (started.hard) {
            setEnriching(false);
            setProgress({ current: 0, total: 0 });
            setActionError(started.error);
            return { ok: false, error: started.error };
          }

          // Otherwise the direct handoff just didn't land — most likely the
          // service worker was asleep. The work is queued in the database and
          // the extension's poll picks it up within about a minute, so this is
          // a delay, not a failure. Stay in the enriching state: the list poll
          // and progress events will take over as soon as the run begins.
          setActionNotice(
            'Queued. The Spurly extension will start this within a minute — you can leave this page.',
          );
          return { ok: true, deferred: true };
        }
        return { ok: true };
      } catch (err) {
        const message = err?.message || 'Could not start enrichment';
        setActionError(message);
        setEnriching(false);
        return { ok: false, error: message };
      } finally {
        setBusy(false);
      }
    },
    [busy, enriching, fetchLeads, kickStart],
  );

  /** Abort the run and clear anything still queued. */
  const stopEnriching = useCallback(async () => {
    try {
      await stopEnrichment();
    } catch {
      /* best effort — the backend cancel below is what actually matters */
    }
    try {
      await importedLeadsApi.cancelEnrichment();
    } catch {
      /* best effort */
    }
    setEnriching(false);
    setProgress({ current: 0, total: 0 });
    await fetchLeads({}, { silent: true });
  }, [fetchLeads]);

  /** Move selected leads into People (and out of staging). */
  const promoteSelected = useCallback(
    async (ids) => {
      if (!ids?.length || busy) return { ok: false };
      setActionError(null);
      setBusy(true);
      try {
        const res = await importedLeadsApi.promoteLeads(ids);
        if (!res?.success) {
          setActionError(res?.message || 'Could not move those leads');
          return { ok: false, error: res?.message };
        }
        await fetchLeads({}, { silent: true });
        return { ok: true, promoted: res.data?.promoted || 0 };
      } catch (err) {
        const message = err?.message || 'Could not move those leads';
        setActionError(message);
        return { ok: false, error: message };
      } finally {
        setBusy(false);
      }
    },
    [busy, fetchLeads],
  );

  /** Remove selected leads from staging without promoting them. */
  const deleteSelected = useCallback(
    async (ids) => {
      if (!ids?.length || busy) return { ok: false };
      setActionError(null);
      setBusy(true);
      try {
        const res = await importedLeadsApi.deleteLeads(ids);
        if (!res?.success) {
          setActionError(res?.message || 'Could not delete those leads');
          return { ok: false };
        }
        await fetchLeads({}, { silent: true });
        return { ok: true, deleted: res.data?.deleted || 0 };
      } catch (err) {
        setActionError(err?.message || 'Could not delete those leads');
        return { ok: false };
      } finally {
        setBusy(false);
      }
    },
    [busy, fetchLeads],
  );

  return {
    leads,
    stats,
    pagination,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(null),
    actionNotice,
    clearActionNotice: () => setActionNotice(null),

    search,
    setSearch,
    statusFilter,
    setStatusFilter: (next) => {
      setStatusFilter(next);
      setPage(1);
    },
    page,
    setPage,

    enriching,
    progress,
    busy,

    refresh: fetchLeads,
    enrichSelected,
    stopEnriching,
    promoteSelected,
    deleteSelected,
  };
}
