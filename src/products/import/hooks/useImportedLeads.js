import { useState, useEffect, useCallback, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import importController from '../controller/import.js';
import { DEFAULT_LIMIT, IMPORT_EVENTS } from '../constants/constants.js';

/**
 * Owns the CSV/extension staging area: the paginated list of imported
 * leads, and queueing them for import into the Hub.
 *
 * 2026-09-18: sending a staged row no longer promotes it into the Hub
 * directly. It queues a manual Hub audience that resolves each profile
 * through Unipile first, and a row disappears from this list on its own,
 * server-side, once that resolve lands it in Hub Leads — the server does the
 * work; this hook just needs to keep asking. `pollTick` below re-fetches on
 * an interval WHENEVER any row is 'queued', so the table visibly drains
 * without the user needing to refresh, and stops polling the moment nothing
 * is left in flight.
 *
 * All server calls go through `importController`, which reports back over
 * `eventEmitter` instead of returning promises — this hook has no
 * async/await or try/catch of its own. `eventEmitter` is also returned so a
 * caller (StagingPanel) can `.once()` a PROMOTE_SUCCESS/DELETE_SUCCESS/
 * RETRY_SUCCESS for its own UI-only follow-up (toast copy, clearing
 * selection) without this hook having to know about that.
 */

/** How often to re-poll while something is still resolving. */
const POLL_INTERVAL_MS = 4000;
export function useImportedLeads() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: {} });
  const [pagination, setPagination] = useState({ total: 0, limit: DEFAULT_LIMIT, skip: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);

  /**
   * @param {Object} [opts]
   * @param {boolean} [opts.silent] - refresh WITHOUT flipping `loading`.
   */
  const load = useCallback(
    (opts = {}) => {
      const limit = pagination.limit || DEFAULT_LIMIT;
      if (!opts.silent) setLoading(true);
      setError(null);
      importController.loadLeads(eventEmitter, {
        limit,
        skip: Math.max(0, (page - 1) * limit),
        search,
        enrichStatus: statusFilter,
      });
    },
    [eventEmitter, pagination.limit, page, search, statusFilter],
  );

  useEffect(() => {
    function handleLoadSuccess(payload) {
      setLeads(payload.leads);
      setPagination(payload.pagination);
      if (payload.stats) setStats(payload.stats);
      setLoading(false);
    }
    function handleLoadFailure(message) {
      setError(message);
      setLoading(false);
    }
    function handlePromoteSuccess() {
      setBusy(false);
      load({ silent: true });
    }
    function handlePromoteFailure(message) {
      setActionError(message);
      setBusy(false);
    }
    function handleDeleteSuccess() {
      setBusy(false);
      load({ silent: true });
    }
    function handleDeleteFailure(message) {
      setActionError(message);
      setBusy(false);
    }

    function handleRetrySuccess() {
      setBusy(false);
      load({ silent: true });
    }
    function handleRetryFailure(message) {
      setActionError(message);
      setBusy(false);
    }

    eventEmitter.on(IMPORT_EVENTS.LOAD_SUCCESS, handleLoadSuccess);
    eventEmitter.on(IMPORT_EVENTS.LOAD_FAILURE, handleLoadFailure);
    eventEmitter.on(IMPORT_EVENTS.PROMOTE_SUCCESS, handlePromoteSuccess);
    eventEmitter.on(IMPORT_EVENTS.PROMOTE_FAILURE, handlePromoteFailure);
    eventEmitter.on(IMPORT_EVENTS.DELETE_SUCCESS, handleDeleteSuccess);
    eventEmitter.on(IMPORT_EVENTS.DELETE_FAILURE, handleDeleteFailure);
    eventEmitter.on(IMPORT_EVENTS.RETRY_SUCCESS, handleRetrySuccess);
    eventEmitter.on(IMPORT_EVENTS.RETRY_FAILURE, handleRetryFailure);

    return () => {
      eventEmitter.off(IMPORT_EVENTS.LOAD_SUCCESS, handleLoadSuccess);
      eventEmitter.off(IMPORT_EVENTS.LOAD_FAILURE, handleLoadFailure);
      eventEmitter.off(IMPORT_EVENTS.PROMOTE_SUCCESS, handlePromoteSuccess);
      eventEmitter.off(IMPORT_EVENTS.PROMOTE_FAILURE, handlePromoteFailure);
      eventEmitter.off(IMPORT_EVENTS.DELETE_SUCCESS, handleDeleteSuccess);
      eventEmitter.off(IMPORT_EVENTS.DELETE_FAILURE, handleDeleteFailure);
      eventEmitter.off(IMPORT_EVENTS.RETRY_SUCCESS, handleRetrySuccess);
      eventEmitter.off(IMPORT_EVENTS.RETRY_FAILURE, handleRetryFailure);
    };
  }, [eventEmitter, load]);

  // Poll while anything is mid-resolve, so a lead visibly disappears from
  // this table on its own once it lands in Hub Leads — no manual refresh,
  // and no polling at all once the queue is empty.
  const queuedCount = stats.byStatus?.queued || 0;
  const hasQueued = queuedCount > 0;
  useEffect(() => {
    if (!hasQueued) return undefined;
    const interval = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasQueued, load]);

  // Debounced refetch on any query change. 350ms matches the DataTable toolbar.
  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, page]);

  /**
   * Send selected leads to the Hub (and out of staging), grouped under a
   * named audience. `audienceName` is optional — leave it blank and the
   * server names the audience itself with a dated default.
   */
  const promoteSelected = useCallback(
    (ids, audienceName) => {
      if (!ids?.length || busy) return;
      setActionError(null);
      setBusy(true);
      importController.promoteLeads(eventEmitter, ids, audienceName);
    },
    [busy, eventEmitter],
  );

  /** Remove selected leads from staging without promoting them. */
  const deleteSelected = useCallback(
    (ids) => {
      if (!ids?.length || busy) return;
      setActionError(null);
      setBusy(true);
      importController.deleteLeads(eventEmitter, ids);
    },
    [busy, eventEmitter],
  );

  /** Reset failed rows back to 'pending' so they can be re-sent. */
  const retrySelected = useCallback(
    (ids) => {
      if (!ids?.length || busy) return;
      setActionError(null);
      setBusy(true);
      importController.retryLeads(eventEmitter, ids);
    },
    [busy, eventEmitter],
  );

  return {
    leads,
    stats,
    pagination,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(null),

    search,
    setSearch,
    statusFilter,
    setStatusFilter: (next) => {
      setStatusFilter(next);
      setPage(1);
    },
    page,
    setPage,

    busy,

    eventEmitter,
    refresh: load,
    promoteSelected,
    deleteSelected,
    retrySelected,
  };
}
