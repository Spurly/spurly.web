import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "src/components/DashboardLayout";
import { Tabs } from "src/common/components/Tabs";
import { DataTable, FilterButton } from "src/common/components/DataTable";
import { LeadDetailSidebar } from "src/components/LeadDetailSidebar";
import { useAllProfiles } from "src/hooks/useAllProfiles";
import { useMetrics } from "src/hooks/useMetrics";
import capturedLeadsController from "src/core/controllers/capturedLeadsController";
import { exportProfilesAsCSV } from "src/common/utils/csvExport";
import { columns } from "./columns.jsx";
import { buildCapturedLeadsTabs } from "./helpers";
import { CreateSessionModal } from "./CreateSessionModal";

export function CapturedLeadsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [enrichmentFilter, setEnrichmentFilter] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  // Refs so the debounce effect can read current tab/limit without re-triggering
  const activeTabRef = useRef(activeTab);
  const pageLimitRef = useRef(pagination.limit);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  useEffect(() => {
    pageLimitRef.current = pagination.limit;
  }, [pagination.limit]);

  // Debounced server-side search — fires 350ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const opts = { limit: pageLimitRef.current, skip: 0 };
      if (activeTabRef.current !== "all")
        opts.connectionDegree = Number(activeTabRef.current);
      if (searchQuery.trim()) opts.search = searchQuery.trim();
      fetchAllProfiles(opts);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchAllProfiles]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery("");
    setSelectedLeads(new Set());
    if (tabId === "all") {
      fetchAllProfiles({ limit: pagination.limit, skip: 0 });
    } else {
      fetchAllProfiles({
        limit: pagination.limit,
        skip: 0,
        connectionDegree: Number(tabId),
      });
    }
  };

  const tabs = buildCapturedLeadsTabs(
    pagination.total,
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
      const opts = { limit: pagination.total, skip: 0 };
      if (activeTab !== "all") opts.connectionDegree = Number(activeTab);
      if (searchQuery.trim()) opts.search = searchQuery.trim();

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
    <DashboardLayout>
      <div className="relative flex flex-col h-full overflow-hidden">
        {/* Page header */}
        <div className="glass-chrome border-b border-[var(--separator)] px-6 py-5 shrink-0">
          <h1 className="text-[20px] font-bold tracking-[-0.018em] text-[var(--text-primary)]">
            Captured People
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            All People captured from LinkedIn &amp; Sales Navigator.
          </p>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

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
            emptyMessage={
              searchQuery
                ? "No People match your search"
                : "No People captured yet"
            }
            emptyHint={
              searchQuery
                ? "Try a different search term"
                : "Leads captured from LinkedIn will appear here"
            }
            toolbar={{
              searchValue: searchQuery,
              onSearch: setSearchQuery,
              searchPlaceholder: "Search by name, email, company...",
              bulkActions: (
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="h-8 px-3 rounded-[10px] text-[13px] font-semibold transition-colors"
                  style={{
                    background: "var(--accent-tint)",
                    color: "var(--brand-purple)",
                  }}
                >
                  Create session
                </button>
              ),
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

        {/* Create session modal */}
        {showSessionModal && (
          <CreateSessionModal
            profileIds={Array.from(selectedLeads)}
            onClose={() => setShowSessionModal(false)}
            onSuccess={() => setSelectedLeads(new Set())}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
