import { useState, useEffect, useCallback, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import importController from '../controller/import.js';
import { DEFAULT_LIMIT, IMPORT_EVENTS } from '../constants/constants.js';

/**
 * Owns the CSV staging area: the paginated list of imported leads, and
 * promotion into the Hub.
 *
 * Enrichment used to run here too — an extension-driven run that visited
 * each staged profile before it was sent to the Hub. That path is retired
 * (2026-09-14): enrichment now happens entirely on the Hub side, through
 * Unipile, after a lead is promoted — see products/enrichment. A staged
 * lead can be promoted enriched or not; either way it lands in the Hub the
 * same way, and enriching it there is one consistent flow instead of two.
 *
 * All server calls go through `importController`, which reports back over
 * `eventEmitter` instead of returning promises — this hook has no
 * async/await or try/catch of its own. `eventEmitter` is also returned so a
 * caller (StagingPanel) can `.once()` a PROMOTE_SUCCESS/DELETE_SUCCESS for
 * its own UI-only follow-up (toast copy, clearing selection) without this
 * hook having to know about that.
 */
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

    eventEmitter.on(IMPORT_EVENTS.LOAD_SUCCESS, handleLoadSuccess);
    eventEmitter.on(IMPORT_EVENTS.LOAD_FAILURE, handleLoadFailure);
    eventEmitter.on(IMPORT_EVENTS.PROMOTE_SUCCESS, handlePromoteSuccess);
    eventEmitter.on(IMPORT_EVENTS.PROMOTE_FAILURE, handlePromoteFailure);
    eventEmitter.on(IMPORT_EVENTS.DELETE_SUCCESS, handleDeleteSuccess);
    eventEmitter.on(IMPORT_EVENTS.DELETE_FAILURE, handleDeleteFailure);

    return () => {
      eventEmitter.off(IMPORT_EVENTS.LOAD_SUCCESS, handleLoadSuccess);
      eventEmitter.off(IMPORT_EVENTS.LOAD_FAILURE, handleLoadFailure);
      eventEmitter.off(IMPORT_EVENTS.PROMOTE_SUCCESS, handlePromoteSuccess);
      eventEmitter.off(IMPORT_EVENTS.PROMOTE_FAILURE, handlePromoteFailure);
      eventEmitter.off(IMPORT_EVENTS.DELETE_SUCCESS, handleDeleteSuccess);
      eventEmitter.off(IMPORT_EVENTS.DELETE_FAILURE, handleDeleteFailure);
    };
  }, [eventEmitter, load]);

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
  };
}
