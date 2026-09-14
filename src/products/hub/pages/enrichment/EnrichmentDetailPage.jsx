import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { DataTable } from 'src/platform/DataTable';
import { Button, Badge } from 'src/ui/primitives';
import { useEnrichmentCampaignDetail } from 'src/products/hub/enrichment/hooks/useEnrichmentCampaignDetail.js';
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
      >
        <DetailPageSkeleton
          backTo="/hub/enrichment"
          backLabel={t.allCampaigns}
          sectionTitle={t.sectionTitle}
          columns={hubLeadEnrichColumns}
          label={t.loading}
        />
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout title={t.loadingPageTitle}>
        <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)]">
          {t.notFound} <Link to="/hub/enrichment" className="underline">{t.backToList}</Link>
        </p>
      </DashboardLayout>
    );
  }

  const view = STATUS_VIEW[status] ?? STATUS_VIEW.done;

  return (
    <DashboardLayout
      title={campaign.name}
      subtitle={`${counts.total ?? 0} people · ${counts.enriched ?? 0} enriched · ${counts.queued ?? 0} queued`}
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={view.tone}>
            <span className="inline-flex items-center gap-1">
              {running && <Loader2 size={11} className="animate-spin" aria-hidden="true" />}
              {view.label}
            </span>
          </Badge>
          {counts.failed > 0 && (
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={<RotateCcw size={13} />}
              disabled={busy}
              onClick={retryFailed}
            >
              {t.retryFailed}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Link to="/hub/enrichment" className="inline-flex items-center gap-1 text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] hover:underline">
          <ArrowLeft size={13} aria-hidden="true" /> {t.allCampaigns}
        </Link>

        <DataTable
          columns={hubLeadEnrichColumns}
          data={leads}
          loading={loading}
          emptyMessage={statusFilter ? 'Nobody in this state' : 'Nobody in this campaign'}
          emptyHint={statusFilter ? 'Try another filter.' : undefined}
          toolbar={{
            filters: (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="text-[var(--ui-t-label)] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-2 py-1 text-[var(--ui-text-secondary)]"
              >
                <option value="">Everyone ({counts.total ?? 0})</option>
                <option value="queued">Queued ({counts.queued ?? 0})</option>
                <option value="enriching">Enriching ({counts.enriching ?? 0})</option>
                <option value="enriched">Enriched ({counts.enriched ?? 0})</option>
                <option value="failed">Failed ({counts.failed ?? 0})</option>
              </select>
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
    </DashboardLayout>
  );
}
