import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { useAllProfiles } from 'src/platform/people/useAllProfiles';
import { patchEntity } from 'src/shared/entities/patchEntity.js';
import { useMetrics } from 'src/platform/people/useMetrics';
import { useOutreachSummary } from 'src/platform/outreach/useOutreachSummary';
import { useTableColumnOrder } from 'src/platform/people/useTableColumnOrder';
import capturedLeadsController from 'src/platform/people/controller';
import { exportProfilesAsCSV } from 'src/shared/utils/csvExport';
import { peopleColumns } from 'src/platform/people/columns.jsx';
import { buildDegreeTabs } from 'src/platform/people/helpers';
import campaignsController from 'src/products/leadgen/campaigns/controller.js';

const OUTREACH_POLL_MS = 30000;
const SEARCH_DEBOUNCE_MS = 350;

/**
 * All state and orchestration for the People page. Moved out of the page
 * component unchanged.
 *
 * The People DATA layer itself — the profile fetch, columns, cells, filters,
 * the detail sidebar — stays in platform/people, because the hub product
 * will render the same leads; this hook only owns what is specific to the
 * leadgen view (tabs, search, sort, selection, and the two actions —
 * create campaign, export — that are this page's own).
 */
export function usePeoplePage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [outreachFilter, setOutreachFilter] = useState('all');
  const [selectedPeople, setSelectedPeople] = useState(new Set());
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // `key: null` means "no column sort" — the list falls back to the server's
  // default of newest-captured-first, which is what you want after a capture run.
  const [sort, setSort] = useState({ key: null, direction: null });

  const {
    profiles,
    loading,
    error,
    pagination,
    fetchAllProfiles,
    goToPage,
    setPageSize,
    patchProfile,
    currentPage,
  } = useAllProfiles();

  const { metrics: stats } = useMetrics();

  // The extension writes send results back asynchronously, so poll while the
  // page is open rather than letting counts go stale mid-campaign.
  const { summary: outreachSummary, refresh: refreshOutreach } = useOutreachSummary({
    pollMs: OUTREACH_POLL_MS,
  });

  // Refs so the debounced search effect can read current tab/filter/limit
  // without re-triggering itself.
  const activeTabRef = useRef(activeTab);
  const outreachFilterRef = useRef(outreachFilter);
  const pageLimitRef = useRef(pagination.limit);
  const sortRef = useRef(sort);

  useEffect(() => { sortRef.current = sort; }, [sort]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { outreachFilterRef.current = outreachFilter; }, [outreachFilter]);
  useEffect(() => { pageLimitRef.current = pagination.limit; }, [pagination.limit]);

  const buildFetchOptions = (overrides = {}) => {
    const tab = overrides.tab ?? activeTabRef.current;
    const chip = overrides.outreachStatus ?? outreachFilterRef.current;
    const search = overrides.search ?? searchQuery;
    const activeSort = overrides.sort ?? sortRef.current;

    const opts = { limit: overrides.limit ?? pageLimitRef.current, skip: overrides.skip ?? 0 };
    if (tab !== 'all') opts.connectionDegree = Number(tab);
    if (chip && chip !== 'all') opts.outreachStatus = chip;
    if (search && search.trim()) opts.search = search.trim();
    if (activeSort?.key && activeSort?.direction) {
      opts.sortBy = activeSort.key;
      opts.sortDir = activeSort.direction;
    }
    return opts;
  };

  // Debounced server-side search — fires 350ms after the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      const opts = { limit: pageLimitRef.current, skip: 0 };
      if (activeTabRef.current !== 'all') opts.connectionDegree = Number(activeTabRef.current);
      if (outreachFilterRef.current !== 'all') opts.outreachStatus = outreachFilterRef.current;
      if (searchQuery.trim()) opts.search = searchQuery.trim();

      const activeSort = sortRef.current;
      if (activeSort?.key && activeSort?.direction) {
        opts.sortBy = activeSort.key;
        opts.sortDir = activeSort.direction;
      }
      fetchAllProfiles(opts);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchAllProfiles]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery('');
    setSelectedPeople(new Set());
    fetchAllProfiles(buildFetchOptions({ tab: tabId, search: '', limit: pagination.limit }));
  };

  // A third click on the same header clears the sort, dropping back to the
  // server default.
  const handleSortChange = (next) => {
    setSort(next);
    setSelectedPeople(new Set());
    fetchAllProfiles(buildFetchOptions({ sort: next, limit: pagination.limit }));
  };

  const handleOutreachFilterChange = (filterId) => {
    setOutreachFilter(filterId);
    setSelectedPeople(new Set());
    fetchAllProfiles(buildFetchOptions({ outreachStatus: filterId, limit: pagination.limit }));
  };

  // `pagination.total` reflects the CURRENT query, so with a status filter
  // active it would show a filtered count next to unfiltered degree counts.
  // The outreach summary carries the unfiltered total, which is what the
  // "All" tab means.
  const tabs = buildDegreeTabs(outreachSummary?.total || pagination.total, stats.connectionDegrees);

  /**
   * "Create campaign" — creates immediately and opens the campaign.
   *
   * There is no confirmation dialog and no name prompt. Both used to sit here;
   * the name is now generated server-side, and the dialog's remaining job was a
   * dedupe preview the campaign page shows anyway. Everyone selected is
   * enrolled (`excludeContacted: false`) — the same choice the extension's
   * Outreach tab makes, on the grounds that the user ticked those rows on
   * purpose. The campaign page is where the action and the message get written,
   * so going straight there is the step the user was heading for.
   */
  const handleCreateCampaign = async () => {
    if (creatingCampaign || selectedPeople.size === 0) return;

    setCreatingCampaign(true);
    try {
      const { campaign, memberCount } = await campaignsController.createCampaign({
        personIds: Array.from(selectedPeople),
        excludeContacted: false,
      });
      setSelectedPeople(new Set());
      refreshOutreach();
      toast.success(`Campaign created with ${memberCount} lead${memberCount === 1 ? '' : 's'}`);
      navigate(`/dashboard/campaigns/${campaign._id}`);
    } catch (e) {
      console.error('[People] Create campaign error:', e);
      // Staying put on failure matters: the selection survives, so the user can
      // click again once whatever failed is fixed.
      toast.error(getToastError(e, "Couldn't create the campaign"));
    } finally {
      setCreatingCampaign(false);
    }
  };

  /**
   * Export as CSV — same columns, ordering and escaping as the extension's
   * "Download CSV" (see common/utils/csvExport.js).
   *
   * With a selection: export those rows, no extra fetch needed. Without one:
   * re-fetch the full filtered set in one shot, because `profiles` only holds
   * the current page.
   */
  const handleExport = async () => {
    if (selectedPeople.size > 0) {
      const rows = profiles.filter((p) => selectedPeople.has(p._id)).map((p) => p.raw ?? p);
      exportProfilesAsCSV(rows, `people-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`Exported ${rows.length.toLocaleString()} selected`);
      return;
    }

    if (pagination.total === 0) return;

    setIsExporting(true);
    try {
      const opts = buildFetchOptions({ limit: pagination.total, skip: 0 });
      const { profiles: allProfiles } = await capturedLeadsController.getAllProfiles(opts);
      const rows = allProfiles.map((p) => p.raw ?? p);
      exportProfilesAsCSV(rows, `people-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`Exported ${rows.length.toLocaleString()} people`);
    } catch (e) {
      console.error('[People] Export error:', e);
      toast.error(getToastError(e, "Couldn't export your people"));
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * A note was saved from the drawer.
   *
   * Patched locally in both places rather than refetched. A refetch would be a
   * round-trip on every autosave, and — because the list is server-sorted and
   * server-paged — it could reorder or re-page rows out from under a drawer the
   * user is still typing in.
   *
   * `selectedPerson` is patched too so that closing and reopening the row shows
   * the saved note. It does NOT reset the editor mid-edit: `NotesEditor` reads
   * its initial value once and is keyed on the person id.
   */
  const handleNotesSaved = useCallback(
    (personId, notes) => {
      patchProfile(personId, { notes });
      setSelectedPerson((prev) =>
        prev && prev._id === personId ? patchEntity(prev, { notes }) : prev,
      );
    },
    [patchProfile],
  );

  /* Column order is per-user and saved server-side, so it survives a reload
     and follows the user to another machine. The two identity columns are
     marked `locked` in the definition and never move. */
  const {
    columnOrder,
    onColumnOrderChange,
    resetColumnOrder,
    isCustomized: hasCustomColumnOrder,
  } = useTableColumnOrder('people', peopleColumns);

  // Read the server's count rather than summing status buckets. Once 'connected'
  // existed, invited+messaged undercounted: an invite that gets accepted moves
  // out of `invited` into `connected`, so the headline number would have DROPPED
  // as outreach succeeded. The backend counts `lastTouchedAt` instead, which is
  // the actual question — did we ever reach this person — and is unaffected by
  // where the status pill has since moved.
  const contactedCount = outreachSummary?.contacted || 0;

  return {
    activeTab,
    outreachFilter,
    selectedPeople,
    setSelectedPeople,
    selectedPerson,
    setSelectedPerson,
    searchQuery,
    setSearchQuery,
    creatingCampaign,
    isExporting,
    sort,
    profiles,
    loading,
    error,
    pagination,
    goToPage,
    setPageSize,
    currentPage,
    outreachSummary,
    tabs,
    handleTabChange,
    handleSortChange,
    handleOutreachFilterChange,
    handleCreateCampaign,
    handleExport,
    handleNotesSaved,
    columnOrder,
    onColumnOrderChange,
    resetColumnOrder,
    hasCustomColumnOrder,
    contactedCount,
  };
}
