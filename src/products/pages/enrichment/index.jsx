import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable, sortRows, filterRows } from 'src/core/DataTable';
import { Button, EmptyState } from 'src/core/primitives';
import { useEnrichmentCampaigns } from 'src/products/enrichment/hooks/useEnrichmentCampaigns.js';
import { enrichmentListColumns } from './components/listColumns.jsx';
import { enrichmentStrings } from './strings.js';

export { EnrichmentDetailPage as HubEnrichmentDetailPage } from './EnrichmentDetailPage.jsx';

const t = enrichmentStrings.list;

/**
 * Hub enrichment — the list.
 *
 * Mirrors campaigns/pages/campaigns/index.jsx exactly: campaigns here are
 * made from the leads page's "Needs enrichment" tab, not from a button on
 * this page, because the audience (which leads need enriching) is the
 * decision that matters and is already made there.
 */
export function HubEnrichmentPage() {
  const { campaigns, loading, busy, remove } = useEnrichmentCampaigns();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: null, direction: null });

  const columns = useMemo(
    () => enrichmentListColumns({ onDelete: remove, busy }),
    [busy], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const visibleCampaigns = useMemo(() => {
    const filtered = filterRows(campaigns, search, ['name']);
    return sortRows(filtered, sort, {
      leadIds: (row) => row.leadIds?.length ?? 0,
      counts: (row) => row.counts?.total ?? 0,
    });
  }, [campaigns, search, sort]);

  return (
    <DashboardLayout title={t.pageTitle} subtitle={t.pageSubtitle}>
      {!loading && campaigns.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={20} />}
          title={t.emptyTitle}
          hint={t.emptyHint}
          action={<Button onClick={() => navigate('/hub/leads')}>{t.goToLeads}</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          data={visibleCampaigns}
          rowKey={(row) => row._id}
          loading={loading}
          onRowClick={(row) => navigate(`/hub/enrichment/${row._id}`)}
          emptyMessage={search ? 'No enrichment campaigns match your search' : t.emptyTitle}
          emptyHint={search ? 'Try a different search term' : t.emptyHint}
          reorderable
          sort={sort}
          onSortChange={setSort}
          toolbar={{
            searchValue: search,
            onSearch: setSearch,
            searchPlaceholder: 'Search by name...',
          }}
        />
      )}
    </DashboardLayout>
  );
}
