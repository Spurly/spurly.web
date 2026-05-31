import { useState } from 'react';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { Tabs } from 'src/common/components/Tabs';
import { DataTable, FilterButton } from 'src/common/components/DataTable';
import { LeadDetailSidebar } from 'src/components/LeadDetailSidebar';
import { useAllProfiles } from 'src/hooks/useAllProfiles';
import { capturedLeadsColumns, buildCapturedLeadsTabs } from './helpers.jsx';

export function CapturedLeadsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrichmentFilter, setEnrichmentFilter] = useState(null);

  const {
    profiles,
    loading,
    error,
    pagination,
    goToPage,
    setPageSize,
    currentPage,
  } = useAllProfiles();

  const tabs = buildCapturedLeadsTabs(pagination.total);

  const filteredProfiles = profiles.filter(profile => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      profile.name?.toLowerCase().includes(query) ||
      profile.email?.toLowerCase().includes(query) ||
      profile.company?.toLowerCase().includes(query) ||
      profile.title?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="flex h-full bg-spurly-surface-bg">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-spurly-border px-6 py-6">
            <h1 className="text-dashboard-title font-bold text-spurly-navy-light">Captured Leads</h1>
            <p className="text-body text-spurly-text-secondary mt-1">
              All leads captured from LinkedIn & Sales Navigator.
            </p>
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Reusable DataTable */}
          <div className="flex-1 overflow-y-auto">
            <DataTable
              columns={capturedLeadsColumns}
              data={filteredProfiles}
              rowKey={(row) => row._id}
              loading={loading}
              error={error}
              selectable
              selectedKeys={selectedLeads}
              onSelectionChange={setSelectedLeads}
              onRowClick={setSelectedLead}
              emptyMessage={searchQuery ? 'No leads match your search' : 'No leads captured yet'}
              emptyHint={searchQuery ? 'Try a different search term' : 'Leads captured from LinkedIn will appear here'}
              toolbar={{
                searchValue: searchQuery,
                onSearch: setSearchQuery,
                searchPlaceholder: 'Search by name, email, company...',
                bulkActions: (
                  <>
                    <button className="px-4 py-2 rounded-spurly bg-spurly-surface-bg hover:bg-spurly-border text-spurly-navy-light font-medium text-label transition">
                      Enrich
                    </button>
                    <button className="px-4 py-2 rounded-spurly bg-spurly-surface-bg hover:bg-spurly-border text-spurly-navy-light font-medium text-label transition">
                      Add to List
                    </button>
                    <button className="px-4 py-2 rounded-spurly bg-spurly-surface-bg hover:bg-spurly-border text-spurly-navy-light font-medium text-label transition">
                      Export
                    </button>
                  </>
                ),
                actions: <FilterButton onClick={() => setEnrichmentFilter(!enrichmentFilter)} active={enrichmentFilter} />,
              }}
              pagination={{
                page: currentPage,
                pageSize: pagination.limit,
                total: filteredProfiles.length,
                onPageChange: goToPage,
                onPageSizeChange: setPageSize,
              }}
            />
          </div>
        </div>

        {/* Right Sidebar - Lead Details */}
        <LeadDetailSidebar lead={selectedLead} onClose={() => setSelectedLead(null)} />
      </div>
    </DashboardLayout>
  );
}
