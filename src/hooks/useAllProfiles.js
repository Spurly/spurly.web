import { useState, useEffect, useCallback, useRef } from 'react';
import capturedLeadsController from 'src/core/controllers/capturedLeadsController.js';
import { patchEntity } from 'src/core/entities/patchEntity.js';
import { useErrorToast } from 'src/ui/primitives';

export function useAllProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 100,
    skip: 0,
    total: 0,
    pages: 0,
    hasMore: false,
  });

  // Tracks the last-used fetch options so goToPage / setPageSize
  // preserve the active connectionDegree filter across pagination.
  const lastOptionsRef = useRef({ limit: 100, skip: 0 });

  const fetchAllProfiles = useCallback(async (options = {}) => {
    const opts = { ...options };
    lastOptionsRef.current = opts;
    setLoading(true);
    setError(null);

    try {
      const { profiles: list, pagination: pag } =
        await capturedLeadsController.getAllProfiles(opts);

      setProfiles(list);
      setPagination({
        limit: pag.limit,
        skip: pag.skip,
        total: pag.total,
        pages: pag.pages,
        hasMore: pag.hasMore,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to fetch profiles';
      setError(message);
      setProfiles([]);
      console.error('[useAllProfiles] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllProfiles({ limit: 100, skip: 0 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = useCallback((pageNum) => {
    const skip = (pageNum - 1) * lastOptionsRef.current.limit;
    fetchAllProfiles({ ...lastOptionsRef.current, skip });
  }, [fetchAllProfiles]);

  const setPageSize = useCallback((newLimit) => {
    fetchAllProfiles({ ...lastOptionsRef.current, limit: newLimit, skip: 0 });
  }, [fetchAllProfiles]);

  /**
   * Patch one already-loaded row in place, without a refetch.
   *
   * For edits the user makes FROM this page (today: notes). Refetching instead
   * would be a round-trip that can reorder or re-page the list under the
   * cursor, and would fight the drawer the user is still typing in.
   *
   * Rows are `Profile` class instances, so the copy goes through
   * `patchEntity` rather than a spread — see the note there.
   */
  const patchProfile = useCallback((id, patch) => {
    if (!id || !patch) return;
    setProfiles((prev) => {
      let changed = false;
      const next = prev.map((row) => {
        if (row?._id !== id) return row;
        changed = true;
        return patchEntity(row, patch);
      });
      // Same array back when nothing matched, so an edit to a row that has
      // since been paged away doesn't re-render the table for no reason.
      return changed ? next : prev;
    });
  }, []);

  const refresh = useCallback(() => {
    fetchAllProfiles({ ...lastOptionsRef.current, skip: 0 });
  }, [fetchAllProfiles]);

  /* Reported twice on purpose: the inline block the page renders (which
     persists next to the empty table) and one toast (which catches the eye
     if that block is off screen). The toast gets fixed copy — the server's
     text goes inline, where there's room for it. */
  useErrorToast(error, "Couldn't load your people");

  return {
    profiles,
    loading,
    error,
    pagination,
    fetchAllProfiles,
    goToPage,
    setPageSize,
    patchProfile,
    refresh,
    currentPage: Math.floor(pagination.skip / pagination.limit) + 1,
    totalPages: pagination.pages || Math.ceil(pagination.total / pagination.limit),
  };
}
