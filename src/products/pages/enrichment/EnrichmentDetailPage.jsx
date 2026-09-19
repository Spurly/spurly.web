import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable } from 'src/core/DataTable';
import { Button, Badge, FilterPills, StatTile, WorkingLine } from 'src/core/primitives';
import { useEnrichmentCampaignDetail } from 'src/products/enrichment/hooks/useEnrichmentCampaignDetail.js';
import {
  DetailPageSkeleton,
  DetailActionsSkeleton,
  DetailSubtitleSkeleton,
} from '../components/DetailPageSkeleton.jsx';
import { hubLeadEnrichColumns } from '../leads/components/columns.jsx';
import { ENRICHMENT_STATUS_VIEW as STATUS_VIEW } from './components/statusView.js';
import { enrichmentStrings } from './strings.js';

/**
 * One enrichment campaign: its progress, and the per-lead status table.
 *
 * Simpler than CampaignDetailPage on purpose — there is no note or message to
 * write and no start/pause step, because enrichment queues everything the
 * moment the campaign is created (see service.js#createEnrichmentCampaign)
 * and never contacts anyone. The only action this page has is retrying
 * whatever failed.
 */
export function EnrichmentDetailPage() {
  const {
    campaign,
    counts,
    status,
    leads,
    pagination,
    statusFilter,
    setStatusFilter,
    loading,
    busy,
    running,
    retryFailed,
    goToPage,
  } = useEnrichmentCampaignDetail();

  const t = enrichmentStrings.detail;

  if (loading && !campaign) {
    return (
      <DashboardLayout
        title={t.loadingPageTitle}
        subtitle={<DetailSubtitleSkeleton />}
        actions={<DetailActionsSkeleton />}
        backTo="/hub/enrichment"
        backLabel={t.allCampaigns}
        layout="page"
      >
        <DetailPageSkeleton
          columns={hubLeadEnrichColumns}
          label={t.loading}
        />
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout title={t.loadingPageTitle} backTo="/hub/enrichment" backLabel={t.allCampaigns} layout="page">
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
          {t.notFound} <Link to="/hub/enrichment" className="underline">{t.backToList}</Link>
        </p>
      </DashboardLayout>
    );
  }

  const view = STATUS_VIEW[status] ?? STATUS_VIEW.done;
  const total = counts.total ?? 0;
  const pct = (n) => (total ? Math.round(((n ?? 0) / total) * 100) : 0);

  return (
    <DashboardLayout
      title={campaign.name}
      backTo="/hub/enrichment"
      backLabel={t.allCampaigns}
      badge={
        <Badge tone={view.tone} dot pulse={running}>
          {view.label}
        </Badge>
      }
      subtitle={
        <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">
          {total.toLocaleString()} people · {(counts.enriched ?? 0).toLocaleString()} enriched · {(counts.queued ?? 0).toLocaleString()} queued
        </span>
      }
      layout="page"
      actions={
        counts.failed > 0 ? (
          <Button variant="primary" leadingIcon={<RotateCcw size={13} />} disabled={busy} onClick={retryFailed}>
            {t.retryFailed}
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        {running && (
          <WorkingLine verbs={['Enriching', 'Reading', 'Resolving']} trailing={`${((counts.queued ?? 0) + (counts.enriching ?? 0)).toLocaleString()} in flight`}>
            profiles resolve in the background · this page updates as each one lands
          </WorkingLine>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile label="People" value={total.toLocaleString()} caption="In this batch" />
          <StatTile label="Enriched" value={(counts.enriched ?? 0).toLocaleString()} fill={pct(counts.enriched)} tone="success" caption={`${pct(counts.enriched)}% complete`} />
          <StatTile label="In flight" value={((counts.queued ?? 0) + (counts.enriching ?? 0)).toLocaleString()} fill={pct((counts.queued ?? 0) + (counts.enriching ?? 0))} caption="Queued or resolving" />
          <StatTile label="Failed" value={(counts.failed ?? 0).toLocaleString()} fill={pct(counts.failed)} tone="danger" caption={counts.failed ? 'Retry puts them back in the queue' : 'No failures'} />
        </div>

        <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] overflow-hidden">
          <DataTable
            columns={hubLeadEnrichColumns}
            data={leads}
            loading={loading}
            stickyHeader={false}
            emptyMessage={statusFilter ? 'Nobody in this state' : 'Nobody in this batch'}
            emptyHint={statusFilter ? 'Try another filter.' : undefined}
            toolbar={{
              chips: (
                <FilterPills
                  size="sm"
                  ariaLabel="Filter by status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { id: '', label: 'Everyone', count: counts.total ?? 0 },
                    { id: 'queued', label: 'Queued', count: counts.queued ?? 0 },
                    { id: 'enriching', label: 'Enriching', count: counts.enriching ?? 0 },
                    { id: 'enriched', label: 'Enriched', count: counts.enriched ?? 0 },
                    { id: 'failed', label: 'Failed', count: counts.failed ?? 0 },
                  ]}
                />
              ),
            }}
            pagination={{
              page: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              onPageChange: goToPage,
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
