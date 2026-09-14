import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { DataTable } from 'src/platform/DataTable';
import { Button, EmptyState } from 'src/ui/primitives';
import { useEnrichmentCampaigns } from 'src/products/hub/enrichment/hooks/useEnrichmentCampaigns.js';
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

  const columns = useMemo(
    () => enrichmentListColumns({ onDelete: remove, busy }),
    [busy], // eslint-disable-line react-hooks/exhaustive-deps
  );

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
          data={campaigns}
          rowKey={(row) => row._id}
          loading={loading}
          onRowClick={(row) => navigate(`/hub/enrichment/${row._id}`)}
          emptyMessage={t.emptyTitle}
          emptyHint={t.emptyHint}
        />
      )}
    </DashboardLayout>
  );
}
