import { SectionCard } from 'src/common/components/SectionCard';
import { DataTable } from 'src/common/components/DataTable';
import { columns } from './columns';
import { useRecentCaptures } from 'src/hooks/useRecentCaptures';

/**
 * Recent Captures widget for the dashboard.
 * Fetches all recent captured leads from the latest session with pagination.
 */
export function RecentCaptures({ pageSize = 10, onViewAll }) {
  const {
    profiles,
    loading,
    error,
    pagination,
    goToPage,
    setPageSize,
  } = useRecentCaptures(pageSize);

  const handlePageChange = (pageNum) => {
    goToPage(pageNum);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
  };

  return (
    <SectionCard
      title="Recent Captures"
      onViewAll={onViewAll}
    >
      <DataTable
        columns={columns}
        data={profiles}
        rowKey={(row) => row._id}
        loading={loading}
        error={error}
        emptyMessage="No recent captures yet"
        emptyHint="Captures from LinkedIn will appear here"
        pagination={{
          page: Math.floor(pagination.skip / pagination.limit) + 1,
          pageSize: pagination.limit,
          total: pagination.total,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          pageSizeOptions: [5, 10, 25, 50],
        }}
      />
    </SectionCard>
  );
}
