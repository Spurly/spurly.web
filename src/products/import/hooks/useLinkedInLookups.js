import { useState, useEffect, useCallback, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import importController from '../controller/import.js';
import { LOOKUP_EVENTS, LOOKUP_LIMIT } from '../constants/constants.js';

/**
 * The "Find profiles" tab: CSV rows that came with a name + company but no
 * LinkedIn URL, which Spurly is searching for on LinkedIn in the background.
 *
 * Buckets (`view`): needs_review (several people fit — pick one), not_found,
 * in_progress (still searching), found (added to staging for you).
 *
 * Polls while anything is still being searched, so a row moves out of
 * "Searching" on its own; stops when nothing is in flight. Same event-emitter
 * contract as useImportedLeads — no async/await or try/catch in here.
 */

const POLL_INTERVAL_MS = 8000;

const EMPTY_STATS = { byStatus: {}, inFlight: 0, needsReview: 0, notFound: 0, found: 0 };

export function useLinkedInLookups({ onStaged } = {}) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [view, setViewState] = useState('needs_review');
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [pagination, setPagination] = useState({ total: 0, limit: LOOKUP_LIMIT, skip: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  // Row id currently being picked/skipped — disables just that row's buttons.
  const [pendingId, setPendingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    (opts = {}) => {
      if (!opts.silent) setLoading(true);
      setError(null);
      importController.loadLookups(eventEmitter, {
        status: view,
        limit: LOOKUP_LIMIT,
        skip: Math.max(0, (page - 1) * LOOKUP_LIMIT),
      });
    },
    [eventEmitter, view, page],
  );

  useEffect(() => {
    function onLoad(payload) {
      setRows(payload.rows);
      if (payload.stats) setStats(payload.stats);
      setPagination(payload.pagination);
      setLoading(false);
    }
    function onLoadFail(message) {
      setError(message);
      setLoading(false);
    }
    function onPick() {
      setPendingId(null);
      onStaged?.();
      load({ silent: true });
    }
    function onActionFail(message) {
      setPendingId(null);
      setBusy(false);
      setActionError(message);
    }
    function onDone() {
      setPendingId(null);
      setBusy(false);
      load({ silent: true });
    }

    eventEmitter.on(LOOKUP_EVENTS.LOAD_SUCCESS, onLoad);
    eventEmitter.on(LOOKUP_EVENTS.LOAD_FAILURE, onLoadFail);
    eventEmitter.on(LOOKUP_EVENTS.PICK_SUCCESS, onPick);
    eventEmitter.on(LOOKUP_EVENTS.PICK_FAILURE, onActionFail);
    eventEmitter.on(LOOKUP_EVENTS.DISMISS_SUCCESS, onDone);
    eventEmitter.on(LOOKUP_EVENTS.DISMISS_FAILURE, onActionFail);
    eventEmitter.on(LOOKUP_EVENTS.RETRY_SUCCESS, onDone);
    eventEmitter.on(LOOKUP_EVENTS.RETRY_FAILURE, onActionFail);
    return () => {
      eventEmitter.off(LOOKUP_EVENTS.LOAD_SUCCESS, onLoad);
      eventEmitter.off(LOOKUP_EVENTS.LOAD_FAILURE, onLoadFail);
      eventEmitter.off(LOOKUP_EVENTS.PICK_SUCCESS, onPick);
      eventEmitter.off(LOOKUP_EVENTS.PICK_FAILURE, onActionFail);
      eventEmitter.off(LOOKUP_EVENTS.DISMISS_SUCCESS, onDone);
      eventEmitter.off(LOOKUP_EVENTS.DISMISS_FAILURE, onActionFail);
      eventEmitter.off(LOOKUP_EVENTS.RETRY_SUCCESS, onDone);
      eventEmitter.off(LOOKUP_EVENTS.RETRY_FAILURE, onActionFail);
    };
  }, [eventEmitter, load, onStaged]);

  // Deferred a tick (like useImportedLeads' debounce) so the load's own
  // setState never runs synchronously inside this effect.
  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, page]);

  const inFlight = stats.inFlight > 0;
  useEffect(() => {
    if (!inFlight) return undefined;
    const interval = setInterval(() => {
      load({ silent: true });
      // Found rows land in staging — keep its count honest too.
      onStaged?.();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [inFlight, load, onStaged]);

  const pick = useCallback(
    (id, profileUrl) => {
      if (pendingId) return;
      setActionError(null);
      setPendingId(id);
      importController.pickLookup(eventEmitter, id, profileUrl);
    },
    [eventEmitter, pendingId],
  );

  const dismiss = useCallback(
    (id) => {
      if (pendingId) return;
      setActionError(null);
      setPendingId(id);
      importController.dismissLookups(eventEmitter, { ids: [id] });
    },
    [eventEmitter, pendingId],
  );

  const dismissAll = useCallback(
    (status) => {
      if (busy) return;
      setActionError(null);
      setBusy(true);
      importController.dismissLookups(eventEmitter, { status });
    },
    [busy, eventEmitter],
  );

  const retry = useCallback(
    (ids) => {
      if (busy) return;
      setActionError(null);
      setBusy(true);
      importController.retryLookups(eventEmitter, ids);
    },
    [busy, eventEmitter],
  );

  return {
    view,
    setView: (next) => {
      setViewState(next);
      setPage(1);
    },
    rows,
    stats,
    pagination,
    page,
    setPage,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(null),
    pendingId,
    busy,
    refresh: load,
    pick,
    dismiss,
    dismissAll,
    retry,
  };
}
