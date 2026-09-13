import { Download, Send, RotateCcw } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { DataTable } from 'src/platform/DataTable';
import { Button } from 'src/ui/primitives';
import { LeadDetailSidebar } from 'src/platform/people/LeadDetailSidebar';
import { peopleColumns } from 'src/platform/people/columns.jsx';
import { PeopleFilterBar } from 'src/platform/people/components/PeopleFilterBar';
import { StatusFilter } from 'src/platform/people/components/StatusFilter';
import { usePeoplePage } from 'src/products/leadgen/people/hooks/usePeoplePage.js';
import { peopleStrings as t } from './strings.js';

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
  const {
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
  } = usePeoplePage();

  return (
    <DashboardLayout
      title={t.pageTitle}
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
          reorderable
          columnOrder={columnOrder}
          onColumnOrderChange={onColumnOrderChange}
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
              ? t.emptyMessage.search
              : outreachFilter !== 'all'
                ? t.emptyMessage.filtered
                : t.emptyMessage.none
          }
          emptyHint={
            searchQuery
              ? t.emptyHint.search
              : outreachFilter !== 'all'
                ? t.emptyHint.filtered
                : t.emptyHint.none
          }
          toolbar={{
            searchValue: searchQuery,
            onSearch: setSearchQuery,
            searchPlaceholder: t.search.placeholder,
            bulkActions: (
              <Button
                size="sm"
                variant="primary"
                leadingIcon={<Send size={13} />}
                onClick={handleCreateCampaign}
                loading={creatingCampaign}
                disabled={creatingCampaign || selectedPeople.size === 0}
              >
                {t.createCampaign}
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
              <>
                {hasCustomColumnOrder && (
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<RotateCcw size={13} />}
                    onClick={resetColumnOrder}
                    title={t.resetColumnsTitle}
                  >
                    {t.resetColumns}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  leadingIcon={<Download size={13} />}
                  onClick={handleExport}
                  loading={isExporting}
                  disabled={selectedPeople.size === 0 && pagination.total === 0}
                >
                  {selectedPeople.size > 0 ? `${t.export} ${selectedPeople.size}` : t.export}
                </Button>
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

        {selectedPerson && (
          <LeadDetailSidebar
            lead={selectedPerson}
            onClose={() => setSelectedPerson(null)}
            onNotesSaved={handleNotesSaved}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
