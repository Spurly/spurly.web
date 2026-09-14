import { useState, useEffect, useCallback, useRef } from 'react';
import importController from '../controller/import.js';
import { DEFAULT_LIMIT } from '../constants.js';

/**
 * Owns the CSV staging area: the paginated list of imported leads, and
 * promotion into the Hub.
 *
 * Enrichment used to run here too — an extension-driven run that visited
 * each staged profile before it was sent to the Hub. That path is retired
 * (2026-09-14): enrichment now happens entirely on the Hub side, through
 * Unipile, after a lead is promoted — see products/hub/enrichment. A staged
 * lead can be promoted enriched or not; either way it lands in the Hub the
 * same way, and enriching it there is one consistent flow instead of two.
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

  const [actionError, setActionError] = useState(null);
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
   */
  const fetchLeads = useCallback(async (overrides = {}, opts = {}) => {
    const q = { ...queryRef.current, ...overrides };
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const limit = q.limit || DEFAULT_LIMIT;
      const [listRes, statsRes] = await Promise.all([
        importController.getLeads({
          limit,
          skip: Math.max(0, (q.page - 1) * limit),
          search: q.search,
          enrichStatus: q.statusFilter,
        }),
        importController.getStats(),
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

  /** Send selected leads to the Hub (and out of staging). */
  const promoteSelected = useCallback(
    async (ids) => {
      if (!ids?.length || busy) return { ok: false };
      setActionError(null);
      setBusy(true);
      try {
        const res = await importController.promoteLeads(ids);
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
        const res = await importController.deleteLeads(ids);
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

    refresh: fetchLeads,
    promoteSelected,
    deleteSelected,
  };
}
