import { useState, useEffect, useCallback, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import importController from '../controller/import.js';
import { LOOKUP_EVENTS, LOOKUP_LIMIT } from '../constants/constants.js';

/**
 * The "Find profiles" tab: CSV rows that came with a name + company but no
 * LinkedIn URL, which Spurly searches for on LinkedIn in the background.
 *
 * One paginated table with a status filter (all | needs_review |
 * in_progress | not_found | found) and a search box — the same shape as the
 * Staged leads table. Polls while anything is still being searched, so rows
 * move on their own; stops when nothing is in flight.
 *
 * Same event-emitter contract as useImportedLeads — no async/await or
 * try/catch in here. `eventEmitter` is returned so the panel can `.once()` an
 * outcome for its own UI follow-up (advance the review drawer, toast).
 */

const POLL_INTERVAL_MS = 5000;

const EMPTY_STATS = { byStatus: {}, inFlight: 0, needsReview: 0, notFound: 0, found: 0 };

export function useLinkedInLookups({ onStaged } = {}) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [statusFilter, setStatusFilterState] = useState('all');
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [pagination, setPagination] = useState({ total: 0, limit: LOOKUP_LIMIT, skip: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    (opts = {}) => {
      if (!opts.silent) setLoading(true);
      setError(null);
      importController.loadLookups(eventEmitter, {
        status: statusFilter,
        search,
        limit: LOOKUP_LIMIT,
        skip: Math.max(0, (page - 1) * LOOKUP_LIMIT),
      });
    },
    [eventEmitter, statusFilter, search, page],
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
      setBusy(false);
      onStaged?.();
      load({ silent: true });
    }
    function onActionFail(message) {
      setBusy(false);
      setActionError(message);
    }
    function onDone() {
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

  // Debounced like the Staged leads table (350ms), which also keeps the
  // load's setState out of this effect's synchronous body.
  useEffect(() => {
    const timer = setTimeout(() => load(), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, page]);

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

  const run = useCallback(
    (fn) => {
      if (busy) return;
      setActionError(null);
      setBusy(true);
      fn();
    },
    [busy],
  );

  const pick = useCallback(
    (id, profileUrl) => run(() => importController.pickLookup(eventEmitter, id, profileUrl)),
    [run, eventEmitter],
  );
  /** Skip specific rows ("None of these", bulk Skip). */
  const dismiss = useCallback(
    (ids) => run(() => importController.dismissLookups(eventEmitter, { ids })),
    [run, eventEmitter],
  );
  const retry = useCallback(
    (ids) => run(() => importController.retryLookups(eventEmitter, ids)),
    [run, eventEmitter],
  );

  return {
    eventEmitter,
    statusFilter,
    setStatusFilter: (next) => {
      setStatusFilterState(next);
      setPage(1);
    },
    search,
    setSearch: (next) => {
      setSearchState(next);
      setPage(1);
    },
    page,
    setPage,
    rows,
    stats,
    pagination,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(null),
    busy,
    refresh: load,
    pick,
    dismiss,
    retry,
  };
}
