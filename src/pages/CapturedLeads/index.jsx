import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "src/components/DashboardLayout";
import { Tabs } from "src/common/components/Tabs";
import { DataTable, FilterButton } from "src/common/components/DataTable";
import { LeadDetailSidebar } from "src/components/LeadDetailSidebar";
import { useAllProfiles } from "src/hooks/useAllProfiles";
import { useMetrics } from "src/hooks/useMetrics";
import { useOutreachSummary } from "src/hooks/useOutreachSummary";
import capturedLeadsController from "src/core/controllers/capturedLeadsController";
import { exportProfilesAsCSV } from "src/common/utils/csvExport";
import { columns } from "./columns.jsx";
import { buildCapturedLeadsTabs } from "./helpers";
import { CreateCampaignModal } from "./CreateCampaignModal";
import { OutreachFilterBar } from "./OutreachFilterBar";

export function CapturedLeadsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [outreachFilter, setOutreachFilter] = useState("all");
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [enrichmentFilter, setEnrichmentFilter] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // Column sort from the table headers. `key: null` means "no column sort" —
  // the list falls back to the server's default (newest captured first), which
  // is what this page wants after a capture run.
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

  // Status counts + weekly invite budget. The extension writes send results
  // back asynchronously, so poll while the page is open to avoid stale counts
  // sitting there while a campaign is mid-flight.
  const { summary: outreachSummary, refresh: refreshOutreach } = useOutreachSummary({
    pollMs: 30000,
  });

  // Refs so the debounce effect can read current tab/filter/limit without
  // re-triggering
  const activeTabRef = useRef(activeTab);
  const outreachFilterRef = useRef(outreachFilter);
  const pageLimitRef = useRef(pagination.limit);
  const sortRef = useRef(sort);
  useEffect(() => {
    sortRef.current = sort;
  }, [sort]);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  useEffect(() => {
    outreachFilterRef.current = outreachFilter;
  }, [outreachFilter]);
  useEffect(() => {
    pageLimitRef.current = pagination.limit;
  }, [pagination.limit]);

  // Build the fetch options for the current tab + chip + search state.
  const buildFetchOptions = (overrides = {}) => {
    const tab = overrides.tab ?? activeTabRef.current;
    const chip = overrides.outreachStatus ?? outreachFilterRef.current;
    const search = overrides.search ?? searchQuery;

    const activeSort = overrides.sort ?? sortRef.current;

    const opts = { limit: overrides.limit ?? pageLimitRef.current, skip: overrides.skip ?? 0 };
    if (tab !== "all") opts.connectionDegree = Number(tab);
    if (chip && chip !== "all") opts.outreachStatus = chip;
    if (search && search.trim()) opts.search = search.trim();
    // Sorting is server-side: the table only holds one page, so ordering it
    // client-side would sort 50 rows out of 126 and look wrong.
    if (activeSort?.key && activeSort?.direction) {
      opts.sortBy = activeSort.key;
      opts.sortDir = activeSort.direction;
    }
    return opts;
  };

  // Debounced server-side search — fires 350ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const opts = { limit: pageLimitRef.current, skip: 0 };
      if (activeTabRef.current !== "all")
        opts.connectionDegree = Number(activeTabRef.current);
      if (outreachFilterRef.current !== "all")
        opts.outreachStatus = outreachFilterRef.current;
      if (searchQuery.trim()) opts.search = searchQuery.trim();
      // Read from the ref so changing sort doesn't re-run the search debounce.
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
    setSearchQuery("");
    setSelectedLeads(new Set());
    fetchAllProfiles(buildFetchOptions({ tab: tabId, search: "", limit: pagination.limit }));
  };

  // A third click on the same header clears the sort (direction: null), which
  // drops back to the server default of newest-captured-first.
  const handleSortChange = (next) => {
    setSort(next);
    setSelectedLeads(new Set());
    fetchAllProfiles(buildFetchOptions({ sort: next, limit: pagination.limit }));
  };

  const handleOutreachFilterChange = (filterId) => {
    setOutreachFilter(filterId);
    setSelectedLeads(new Set());
    fetchAllProfiles(
      buildFetchOptions({ outreachStatus: filterId, limit: pagination.limit }),
    );
  };

  // `pagination.total` reflects the CURRENT query, so with a status chip active
  // it would show e.g. "All Leads 4" next to unfiltered degree counts. The
  // outreach summary carries the unfiltered total, which is what this tab means.
  const tabs = buildCapturedLeadsTabs(
    outreachSummary?.total || pagination.total,
    stats.connectionDegrees,
  );

  // Export as CSV — same column set, ordering, and escaping as the
  // "Download CSV" button in spurly.extension (see
  // src/common/utils/csvExport.js). Profile entity instances expose `.raw`,
  // the original backend payload the CSV columns are built from
  // (experiences, skills, _captureStatus, profileUrl, etc.) — same shape
  // the extension exports from.
  //
  // With a selection: export just those rows (no extra fetch needed).
  // With no selection: export every lead matching the current tab/search
  // filter, not just the current page — `profiles` in state only holds one
  // page (pagination.limit rows), so we re-fetch the full filtered set in
  // one shot before exporting.
  const handleExport = async () => {
    if (selectedLeads.size > 0) {
      const rows = profiles
        .filter((p) => selectedLeads.has(p._id))
        .map((p) => p.raw ?? p);
      const date = new Date().toISOString().split("T")[0];
      exportProfilesAsCSV(rows, `captured-leads-${date}.csv`);
      return;
    }

    if (pagination.total === 0) return;

    setIsExporting(true);
    try {
      const opts = buildFetchOptions({ limit: pagination.total, skip: 0 });

      const { profiles: allProfiles } =
        await capturedLeadsController.getAllProfiles(opts);
      const rows = allProfiles.map((p) => p.raw ?? p);
      const date = new Date().toISOString().split("T")[0];
      exportProfilesAsCSV(rows, `captured-leads-${date}.csv`);
    } catch (e) {
      console.error("[CapturedLeads] Export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout
      title="Captured People"
      subtitle="All People captured from LinkedIn & Sales Navigator."
    >
      <div className="relative flex flex-col h-full overflow-hidden">
        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Outreach status chips + weekly LinkedIn invite budget */}
        <OutreachFilterBar
          activeFilter={outreachFilter}
          onFilterChange={handleOutreachFilterChange}
          summary={outreachSummary}
        />

        {/* DataTable */}
        <div className="flex-1 overflow-y-auto">
          <DataTable
            columns={columns}
            data={profiles}
            rowKey={(row) => row._id}
            loading={loading}
            error={error}
            selectable
            selectedKeys={selectedLeads}
            onSelectionChange={setSelectedLeads}
            onRowClick={setSelectedLead}
            sort={sort}
            onSortChange={handleSortChange}
            emptyMessage={
              searchQuery
                ? "No People match your search"
                : outreachFilter !== "all"
                  ? "No People in this status"
                  : "No People captured yet"
            }
            emptyHint={
              searchQuery
                ? "Try a different search term"
                : outreachFilter !== "all"
                  ? "Try a different status filter"
                  : "Leads captured from LinkedIn will appear here"
            }
            toolbar={{
              searchValue: searchQuery,
              onSearch: setSearchQuery,
              searchPlaceholder: "Search by name, company, location...",
              bulkActions:
                selectedLeads.size > 0 ? (
                  <button
                    onClick={() => setShowCampaignModal(true)}
                    className="h-8 px-3 rounded-[10px] text-[13px] font-semibold transition-colors"
                    style={{
                      background: "var(--accent-tint)",
                      color: "var(--brand-purple)",
                    }}
                  >
                    Create campaign ({selectedLeads.size})
                  </button>
                ) : null,
              actions: (
                <>
                  <button
                    onClick={handleExport}
                    disabled={
                      isExporting ||
                      (selectedLeads.size === 0 && pagination.total === 0)
                    }
                    className="h-8 px-3 rounded-[10px] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    {isExporting
                      ? "Exporting…"
                      : selectedLeads.size > 0
                        ? `Export (${selectedLeads.size})`
                        : "Export"}
                  </button>
                  {/* Filters disabled for now — re-enable when needed.
                  <FilterButton
                    onClick={() => setEnrichmentFilter(!enrichmentFilter)}
                    active={enrichmentFilter}
                  />
                  */}
                </>
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
        </div>

        {/* Lead detail drawer (overlay) */}
        {selectedLead && (
          <LeadDetailSidebar
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
          />
        )}

        {/* Create campaign modal — receives the selected rows (not just ids) so
            it can warn about people who have already been contacted. */}
        {showCampaignModal && (
          <CreateCampaignModal
            people={profiles.filter((p) => selectedLeads.has(p._id))}
            personIds={Array.from(selectedLeads)}
            onClose={() => setShowCampaignModal(false)}
            onSuccess={() => {
              setSelectedLeads(new Set());
              refreshOutreach();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
