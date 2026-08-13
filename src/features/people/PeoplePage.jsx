import { useState, useEffect, useRef } from 'react';
import { Download, Send } from 'lucide-react';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { DataTable } from 'src/components/DataTable';
import { Button } from 'src/ui/primitives';
import { LeadDetailSidebar } from 'src/components/LeadDetailSidebar';
import { useAllProfiles } from 'src/hooks/useAllProfiles';
import { useMetrics } from 'src/hooks/useMetrics';
import { useOutreachSummary } from 'src/hooks/useOutreachSummary';
import capturedLeadsController from 'src/core/controllers/capturedLeadsController';
import { exportProfilesAsCSV } from 'src/common/utils/csvExport';
import { peopleColumns } from './columns.jsx';
import { buildDegreeTabs } from './helpers';
import { CreateCampaignModal } from './components/CreateCampaignModal';
import { PeopleFilterBar } from './components/PeopleFilterBar';
import { StatusFilter } from './components/StatusFilter';

/**
 * People — every profile captured from LinkedIn and Sales Navigator.
 *
 * Data flow is unchanged from the previous version of this page: search,
 * sorting, filtering and pagination are all server-side, because the table only
 * ever holds one page. Sorting 100 rows out of 4,000 client-side would look
 * correct and be wrong.
 *
 * Layout is two horizontal bands, not three: degree tabs share a row with the
 * invite budget, and the outreach status filter moved into the table toolbar.
 */
export function PeoplePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [outreachFilter, setOutreachFilter] = useState('all');
  const [selectedPeople, setSelectedPeople] = useState(new Set());
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
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
    currentPage,
  } = useAllProfiles();

  const { metrics: stats } = useMetrics();

  // The extension writes send results back asynchronously, so poll while the
  // page is open rather than letting counts go stale mid-campaign.
  const { summary: outreachSummary, refresh: refreshOutreach } = useOutreachSummary({
    pollMs: 30000,
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
    }, 350);
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
      return;
    }

    if (pagination.total === 0) return;

    setIsExporting(true);
    try {
      const opts = buildFetchOptions({ limit: pagination.total, skip: 0 });
      const { profiles: allProfiles } = await capturedLeadsController.getAllProfiles(opts);
      const rows = allProfiles.map((p) => p.raw ?? p);
      exportProfilesAsCSV(rows, `people-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (e) {
      console.error('[People] Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const contactedCount =
    (outreachSummary?.statusCounts?.invited || 0) + (outreachSummary?.statusCounts?.messaged || 0);

  return (
    <DashboardLayout
      title="People"
      subtitle={`${(outreachSummary?.total || pagination.total || 0).toLocaleString()} captured · ${contactedCount.toLocaleString()} contacted`}
    >
      <div className="relative flex flex-col h-full min-h-0 overflow-hidden">
        <PeopleFilterBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          summary={outreachSummary}
          outreachFilter={outreachFilter}
          onOutreachFilterChange={handleOutreachFilterChange}
        />

        <DataTable
          columns={peopleColumns}
          data={profiles}
          rowKey={(row) => row._id}
          density="default"
          loading={loading}
          error={error}
          selectable
          selectedKeys={selectedPeople}
          onSelectionChange={setSelectedPeople}
          onRowClick={setSelectedPerson}
          sort={sort}
          onSortChange={handleSortChange}
          emptyMessage={
            searchQuery
              ? 'No people match your search'
              : outreachFilter !== 'all'
                ? 'No people in this status'
                : 'No people captured yet'
          }
          emptyHint={
            searchQuery
              ? 'Try a different search term'
              : outreachFilter !== 'all'
                ? 'Try a different status filter'
                : 'People you capture from LinkedIn will appear here'
          }
          toolbar={{
            searchValue: searchQuery,
            onSearch: setSearchQuery,
            searchPlaceholder: 'Search name, company, location',
            bulkActions: (
              <Button
                size="sm"
                variant="primary"
                leadingIcon={<Send size={13} />}
                onClick={() => setShowCampaignModal(true)}
              >
                Create campaign
              </Button>
            ),
            filters: (
              <StatusFilter
                value={outreachFilter}
                onChange={handleOutreachFilterChange}
                counts={outreachSummary?.statusCounts}
                total={outreachSummary?.total}
              />
            ),
            actions: (
              <Button
                size="sm"
                variant="ghost"
                leadingIcon={<Download size={13} />}
                onClick={handleExport}
                loading={isExporting}
                disabled={selectedPeople.size === 0 && pagination.total === 0}
              >
                {selectedPeople.size > 0 ? `Export ${selectedPeople.size}` : 'Export'}
              </Button>
            ),
          }}
          pagination={{
            page: currentPage,
            pageSize: pagination.limit,
            total: pagination.total,
            onPageChange: goToPage,
            onPageSizeChange: setPageSize,
          }}
        />

        {selectedPerson && (
          <LeadDetailSidebar lead={selectedPerson} onClose={() => setSelectedPerson(null)} />
        )}

        {/* Receives the selected rows, not just ids, so it can warn about
            people who have already been contacted. */}
        {showCampaignModal && (
          <CreateCampaignModal
            people={profiles.filter((p) => selectedPeople.has(p._id))}
            personIds={Array.from(selectedPeople)}
            onClose={() => setShowCampaignModal(false)}
            onSuccess={() => {
              setSelectedPeople(new Set());
              refreshOutreach();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
