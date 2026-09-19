import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { Button, EmptyState, FilterPills, Skeleton, StatTile, WorkingLine } from 'src/core/primitives';
import { CampaignIcon, PlusIcon } from 'src/core/icons';
import { useCampaigns, isLive } from 'src/products/campaigns/hooks/useCampaigns.js';
import { useSidebarSummary } from 'src/core/sidebarSummary/hooks/useSidebarSummary.js';
import { CampaignCard } from './components/CampaignCard.jsx';
import { campaignsStrings } from './strings.js';

export { CampaignDetailPage as HubCampaignDetailPage } from './CampaignDetailPage.jsx';

const t = campaignsStrings.list;

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'running', label: 'Sending' },
  { id: 'paused', label: 'Paused' },
  { id: 'done', label: 'Finished' },
  { id: 'draft', label: 'Draft' },
];

/**
 * Campaigns — the handoff's Campaigns screen: working line, four stat tiles,
 * status pills, then a grid of campaign cards.
 *
 * Every figure is a real aggregate: running count and daily cap from
 * GET /hub/summary, the rest summed from each campaign's member counts.
 * Campaigns are still MADE from the Leads page (the audience is the decision
 * that matters), so "New campaign" goes there.
 */
export function HubCampaignsPage() {
  const { campaigns, loading, busy, start, pause, remove } = useCampaigns();
  const summary = useSidebarSummary();
  const navigate = useNavigate();
  const [status, setStatus] = useState('all');

  const totals = useMemo(
    () =>
      campaigns.reduce(
        (acc, c) => {
          const k = c.counts || {};
          acc.pending += isLive(c) ? k.pending ?? 0 : 0;
          acc.connected += k.connected ?? 0;
          acc.reached += (k.invited ?? 0) + (k.connected ?? 0) + (k.messaged ?? 0);
          return acc;
        },
        { pending: 0, connected: 0, reached: 0 },
      ),
    [campaigns],
  );

  const running = campaigns.filter(isLive).length;
  const counts = Object.fromEntries(STATUS_FILTERS.map((f) => [f.id, f.id === 'all' ? campaigns.length : campaigns.filter((c) => c.status === f.id).length]));
  const visible = status === 'all' ? campaigns : campaigns.filter((c) => c.status === status);
  const cap = summary.pacing?.dailyCap;
  const acceptPct = totals.reached ? Math.round((totals.connected / totals.reached) * 100) : 0;
  const open = (c) => navigate(`/hub/campaigns/${c._id}`);

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      layout="page"
      actions={
        <Button variant="primary" leadingIcon={<PlusIcon size={14} strokeWidth={2} />} onClick={() => navigate('/hub/leads')}>
          {t.newCampaign}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {running > 0 && (
          <WorkingLine
            verbs={['Sending', 'Watching', 'Pacing', 'Reconciling']}
            trailing={summary.pacing?.dayUsed != null ? `${summary.pacing.dayUsed} sent today` : null}
          >
            {running} {running === 1 ? 'campaign' : 'campaigns'} sending · paced through your working hours
          </WorkingLine>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile
            label="Sending now"
            value={running.toLocaleString()}
            fill={campaigns.length ? (running / campaigns.length) * 100 : 0}
            caption={cap ? `Inside the ${cap}-a-day cap` : 'Campaigns running right now'}
          />
          <StatTile
            label="In flight"
            value={totals.pending.toLocaleString()}
            fill={totals.pending + totals.reached ? (totals.pending / (totals.pending + totals.reached)) * 100 : 0}
            caption="Queued in a running campaign"
          />
          <StatTile
            label="Accepted"
            value={totals.connected.toLocaleString()}
            tone="success"
            fill={acceptPct}
            caption={totals.reached ? `${acceptPct}% of everyone invited` : 'Nobody invited yet'}
          />
          <StatTile
            label="Replies waiting"
            value={(summary.inboxUnread ?? 0).toLocaleString()}
            tone="warning"
            fill={summary.inboxUnread ? 60 : 0}
            caption="Unread conversations in the inbox"
          />
        </div>

        <FilterPills
          ariaLabel="Filter campaigns by status"
          value={status}
          onChange={setStatus}
          options={STATUS_FILTERS.filter((f) => f.id === 'all' || f.id !== 'draft' || counts.draft > 0).map((f) => ({ ...f, count: counts[f.id] }))}
        />

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3" role="status" aria-busy="true" aria-label="Loading campaigns">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-[18px] flex flex-col gap-3">
                <Skeleton width={120} height={10} />
                <Skeleton width="70%" height={14} />
                <Skeleton width="45%" height={10} />
                <Skeleton width="100%" height={3} />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)]">
            <EmptyState
              icon={<CampaignIcon size={22} strokeWidth={1.6} />}
              title={t.emptyTitle}
              hint={t.emptyHint}
              action={<Button variant="primary" onClick={() => navigate('/hub/leads')}>{t.goToLeads}</Button>}
            />
          </div>
        ) : visible.length === 0 ? (
          <p className="px-1 py-6 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">No campaigns in this state.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {visible.map((c) => (
              <CampaignCard key={c._id} campaign={c} onOpen={open} onStart={start} onPause={pause} onDelete={remove} busy={busy} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
