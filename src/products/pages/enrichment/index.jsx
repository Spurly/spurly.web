import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable, sortRows, filterRows } from 'src/core/DataTable';
import { Button, FilterPills, StatTile, WorkingLine } from 'src/core/primitives';
import { EnrichIcon, SparkIcon } from 'src/core/icons';
import { useEnrichmentCampaigns } from 'src/products/enrichment/hooks/useEnrichmentCampaigns.js';
import { useSidebarSummary } from 'src/core/sidebarSummary/hooks/useSidebarSummary.js';
import { enrichmentListColumns } from './components/listColumns.jsx';
import { enrichmentStrings } from './strings.js';

export { EnrichmentDetailPage as HubEnrichmentDetailPage } from './EnrichmentDetailPage.jsx';

const t = enrichmentStrings.list;

/**
 * Enrichment — the batches list.
 *
 * No mockup of its own in the handoff, so it is drawn in the Campaigns
 * register: four stat tiles (every figure a real aggregate of the batches
 * below, or the sidebar summary), the working line while anything is still
 * resolving, status pills, then ONE card with the table.
 *
 * Batches are made from the Leads page's "Needs enrichment" tab (the
 * audience is the decision that matters, and it is made there), so the
 * header's action goes to that tab.
 */
export function HubEnrichmentPage() {
  const { campaigns, loading, busy, remove } = useEnrichmentCampaigns();
  const summary = useSidebarSummary();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState({ key: null, direction: null });

  const columns = useMemo(
    () => enrichmentListColumns({ onDelete: remove, busy }),
    [busy], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const totals = useMemo(
    () =>
      campaigns.reduce(
        (acc, c) => {
          const k = c.counts || {};
          acc.total += k.total ?? 0;
          acc.enriched += k.enriched ?? 0;
          acc.inFlight += (k.queued ?? 0) + (k.enriching ?? 0);
          acc.failed += k.failed ?? 0;
          if (c.status === 'running') acc.running += 1;
          return acc;
        },
        { total: 0, enriched: 0, inFlight: 0, failed: 0, running: 0 },
      ),
    [campaigns],
  );

  const visible = useMemo(() => {
    const byStatus = status === 'all' ? campaigns : campaigns.filter((c) => c.status === status);
    return sortRows(filterRows(byStatus, search, ['name']), sort, {
      leadIds: (row) => row.counts?.total ?? row.leadIds?.length ?? 0,
      counts: (row) => row.counts?.total ?? 0,
    });
  }, [campaigns, search, sort, status]);

  const pct = totals.total ? Math.round((totals.enriched / totals.total) * 100) : 0;

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      layout="page"
      actions={
        <Button variant="primary" leadingIcon={<SparkIcon size={14} />} onClick={() => navigate('/hub/leads', { state: { tab: 'enrich' } })}>
          {t.enrichLeads}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {totals.running > 0 && (
          <WorkingLine verbs={['Enriching', 'Reading', 'Resolving', 'Reconciling']} trailing={`${totals.inFlight.toLocaleString()} in flight`}>
            {totals.running} {totals.running === 1 ? 'batch' : 'batches'} running · profiles resolve in the background, you can leave the page
          </WorkingLine>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile
            label="Needs enrichment"
            value={(summary.leadsNeedingEnrichment ?? 0).toLocaleString()}
            caption="Leads without a full profile yet"
            tone="warning"
            fill={summary.leadsTotal ? Math.round(((summary.leadsNeedingEnrichment ?? 0) / summary.leadsTotal) * 100) : 0}
          />
          <StatTile
            label="Enriched"
            value={totals.enriched.toLocaleString()}
            caption={totals.total ? `${pct}% of everyone sent through` : 'Nothing sent through yet'}
            tone="success"
            fill={pct}
          />
          <StatTile
            label="In flight"
            value={totals.inFlight.toLocaleString()}
            caption={totals.inFlight ? 'Queued or resolving right now' : 'Nothing waiting'}
            fill={totals.total ? Math.round((totals.inFlight / totals.total) * 100) : 0}
          />
          <StatTile
            label="Failed"
            value={totals.failed.toLocaleString()}
            caption={totals.failed ? 'Open a batch to retry them' : 'No failures'}
            tone="danger"
            fill={totals.total ? Math.round((totals.failed / totals.total) * 100) : 0}
          />
        </div>

        <FilterPills
          ariaLabel="Filter batches by status"
          value={status}
          onChange={setStatus}
          options={[
            { id: 'all', label: 'All', count: campaigns.length },
            { id: 'running', label: 'Enriching', count: campaigns.filter((c) => c.status === 'running').length },
            { id: 'done', label: 'Done', count: campaigns.filter((c) => c.status === 'done').length },
          ]}
        />

        <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] overflow-hidden">
          <DataTable
            columns={columns}
            data={visible}
            rowKey={(row) => row._id}
            loading={loading}
            stickyHeader={false}
            onRowClick={(row) => navigate(`/hub/enrichment/${row._id}`)}
            emptyIcon={<EnrichIcon size={22} strokeWidth={1.6} />}
            emptyMessage={search || status !== 'all' ? 'No batches match' : t.emptyTitle}
            emptyHint={search || status !== 'all' ? 'Try a different search or filter.' : t.emptyHint}
            emptyAction={
              !search && status === 'all' ? (
                <Button variant="primary" onClick={() => navigate('/hub/leads', { state: { tab: 'enrich' } })}>
                  {t.goToLeads}
                </Button>
              ) : null
            }
            reorderable
            sort={sort}
            onSortChange={setSort}
            toolbar={{
              searchValue: search,
              onSearch: setSearch,
              searchPlaceholder: 'Search batches by name',
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
