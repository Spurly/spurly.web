import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { useAllProfiles } from './useAllProfiles.js';
import { patchEntity } from 'src/shared/entities/patchEntity.js';
import { useMetrics } from './useMetrics.js';
import { useOutreachSummary } from 'src/platform/outreach/hooks/useOutreachSummary';
import { useTableColumnOrder } from './useTableColumnOrder.js';
import capturedLeadsController from '../controller/people.js';
import { exportProfilesAsCSV } from 'src/shared/utils/csvExport';
import { peopleColumns } from '../../pages/people/components/columns.jsx';
import { buildDegreeTabs } from '../helpers.js';
import hubImportGateway from 'src/platform/hubImport/gateway/hubImport.js';

const OUTREACH_POLL_MS = 30000;
const SEARCH_DEBOUNCE_MS = 350;

/**
 * All state and orchestration for the People page. Moved out of the page
 * component unchanged.
 *
 * The People DATA layer itself — the profile fetch, controller, entities,
 * columns, cells, filters, the detail sidebar — lives alongside this hook
 * in products/leadgen/people and products/leadgen/pages/people, since in
 * practice leadgen is the only product that renders it today; this hook
 * owns what is specific to the leadgen VIEW (tabs, search, sort, selection,
 * and the two actions — create campaign, export — that are this page's
 * own). Only the two hooks resolving company logos and profile photos
 * (platform/people/hooks/companyLogo.js, profilePhoto.js) stayed in
 * platform/people — platform/DataTable's shared cell components call them
 * directly, and hub's own tables go through DataTable too.
 */
export function usePeoplePage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [outreachFilter, setOutreachFilter] = useState('all');
  const [selectedPeople, setSelectedPeople] = useState(new Set());
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importingToHub, setImportingToHub] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
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
  const { summary: outreachSummary } = useOutreachSummary({
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
   * "Import to Hub" — turns the current selection into seeds for a new Hub
   * audience, prompts for a name, and hands the seeds to the Hub sourcing API.
   *
   * The import itself is a background job (same pattern as Hub's own search
   * import) — opening the modal only collects a name; the actual POST and
   * navigation happen once the user confirms it, in `submitImportToHub`.
   * Profiles stay in People either way — this is a copy, not a move.
   */
  const buildHubSeeds = () =>
    profiles
      .filter((p) => selectedPeople.has(p._id))
      .map((p) => ({
        profileUrl: p.linkedInUrl,
        name: p.name,
        headline: p.headline || p.title,
        currentTitle: p.title,
        companyName: p.currentCompany || p.company,
        location: p.location,
        profilePictureUrl: p.avatar,
      }))
      .filter((seed) => seed.profileUrl);

  const openImportToHub = () => {
    if (selectedPeople.size === 0) return;
    setImportModalOpen(true);
  };

  const closeImportToHub = () => {
    if (importingToHub) return;
    setImportModalOpen(false);
  };

  const submitImportToHub = async (name) => {
    if (importingToHub) return;
    const seeds = buildHubSeeds();
    if (seeds.length === 0) {
      toast.error("None of the selected contacts have a LinkedIn URL to import");
      return;
    }

    setImportingToHub(true);
    try {
      const audience = await hubImportGateway.createManualAudience({ name, seeds });
      setImportModalOpen(false);
      setSelectedPeople(new Set());
      toast.success(
        `Importing ${seeds.length} profile${seeds.length === 1 ? '' : 's'} into Hub`,
        {
          action: {
            label: 'View in Hub',
            onClick: () => navigate(`/hub/leads?searchId=${audience._id}`),
          },
        },
      );
    } catch (e) {
      console.error('[People] Import to Hub error:', e);
      toast.error(getToastError(e, "Couldn't start the Hub import"));
    } finally {
      setImportingToHub(false);
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
    importingToHub,
    importModalOpen,
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
    openImportToHub,
    closeImportToHub,
    submitImportToHub,
    handleExport,
    handleNotesSaved,
    columnOrder,
    onColumnOrderChange,
    resetColumnOrder,
    hasCustomColumnOrder,
    contactedCount,
  };
}
