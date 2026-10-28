import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { Button, DepthProvider, FilterPills, Skeleton, StatTile, WorkingLine } from 'src/core/primitives';
import { useDashboardAnalytics } from 'src/core/dashboardAnalytics/hooks/useDashboardAnalytics.js';
import { ANALYTICS_RANGES, DEFAULT_ANALYTICS_RANGE } from 'src/core/dashboardAnalytics/constants/constants.js';
import { PlusIcon } from 'src/core/icons';
import { useAuth } from 'src/core/auth/hooks/useAuth.js';
import { useDashboardSummary } from 'src/core/sidebarSummary/hooks/useDashboardSummary.js';
import { useCampaigns, isLive } from 'src/products/campaigns/hooks/useCampaigns.js';
import { dashboardStrings as t } from './strings.js';
import { analyticsStrings as at } from './analytics/strings.js';
import { HeroCard } from './analytics/HeroCard.jsx';
import { TrendTile } from './analytics/TrendTile.jsx';
import { ClaudeCard } from './ClaudeCard.jsx';
import {
  ActivityCard,
  AnalyticsError,
  AudienceCard,
  FunnelCard,
  HealthCard,
  HeatCard,
  LeaderboardCard,
} from './analytics/AnalyticsCards.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Home — the handoff's Dashboard ("Good morning, Marcus").
 *
 * Analytics first: hero, Claude, trend tiles, charts, then the summary tiles.
 * The attention / newest-leads / campaigns / recent-activity cards were removed
 * (2026-10-17) — each duplicated a page of its own.
 */
export function HubDashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.name || '').split(' ')[0] || '';
  const navigate = useNavigate();

  const { leadsTotal, leadsNeedingEnrichment, pacing, connectRate, inboxUnread, loading } =
    useDashboardSummary();
  const [days, setDays] = useState(DEFAULT_ANALYTICS_RANGE);
  const { data: analytics, loading: analyticsLoading, error: analyticsError, reload: reloadAnalytics } = useDashboardAnalytics(days);
  const { campaigns } = useCampaigns();

  const running = useMemo(() => campaigns.filter(isLive), [campaigns]);

  const used = pacing?.dayUsed ?? 0;

  return (
    <DashboardLayout
      title={firstName ? `${greeting()}, ${firstName}` : t.pageTitle}
      subtitle={t.pageSubtitle}
      layout="page"
      actions={
        <Button variant="primary" leadingIcon={<PlusIcon size={14} strokeWidth={2} />} onClick={() => navigate('/hub/leads', { state: { newAudience: true } })}>
          {t.newAudience}
        </Button>
      }
    >
      <DepthProvider value="tilt">
      <div className="flex flex-col gap-4">
        {(running.length > 0 || (leadsNeedingEnrichment ?? 0) > 0) && (
          <WorkingLine
            verbs={['Paging', 'Sending', 'Enriching', 'Reconciling']}
            trailing={leadsTotal != null ? `${leadsTotal.toLocaleString()} leads` : null}
          >
            {[
              running.length ? `${running.length} ${running.length === 1 ? 'campaign' : 'campaigns'} sending` : null,
              leadsNeedingEnrichment ? `${leadsNeedingEnrichment.toLocaleString()} profiles waiting for enrichment` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </WorkingLine>
        )}

        {analyticsError && !analytics && <AnalyticsError message={analyticsError} onRetry={reloadAnalytics} />}

        <HeroCard data={analytics} loading={analyticsLoading && !analytics} days={days} />

        {!user?.isManaged && <ClaudeCard />}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-text-secondary)]">{at.range(days)}</p>
          <FilterPills size="sm" ariaLabel="Analytics range" value={days} onChange={setDays} options={ANALYTICS_RANGES} />
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <TrendTile
            label={at.tiles.invites}
            value={analytics?.period.invites.value ?? 0}
            prev={analytics?.period.invites.prev ?? 0}
            delta={analytics?.period.invites.delta ?? null}
            series={analytics?.series.invites}
            color="var(--ui-chart-1)"
            days={days}
            loading={analyticsLoading}
          />
          <TrendTile
            label={at.tiles.newConnections}
            value={analytics?.period.newConnections.value ?? 0}
            prev={analytics?.period.newConnections.prev ?? 0}
            delta={analytics?.period.newConnections.delta ?? null}
            series={analytics?.series.newConnections}
            color="var(--ui-chart-2)"
            days={days}
            loading={analyticsLoading}
          />
          <TrendTile
            label={at.tiles.messages}
            value={analytics?.period.messages.value ?? 0}
            prev={analytics?.period.messages.prev ?? 0}
            delta={analytics?.period.messages.delta ?? null}
            series={analytics?.series.messages}
            color="var(--ui-chart-1)"
            days={days}
            loading={analyticsLoading}
          />
          <TrendTile
            label={at.tiles.replies}
            value={analytics?.period.replies.value ?? 0}
            prev={analytics?.period.replies.prev ?? 0}
            delta={analytics?.period.replies.delta ?? null}
            series={analytics?.series.replies}
            color="var(--ui-chart-3)"
            days={days}
            loading={analyticsLoading}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 min-w-0"><ActivityCard data={analytics} loading={analyticsLoading} /></div>
          <div className="min-w-0"><HealthCard data={analytics} loading={analyticsLoading} /></div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0"><FunnelCard data={analytics} loading={analyticsLoading} /></div>
          <div className="min-w-0">
            <HeatCard data={analytics} loading={analyticsLoading} timezone={analytics?.range?.timezone} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <LeaderboardCard
              data={analytics}
              loading={analyticsLoading}
              onOpen={(id) => navigate(`/hub/campaigns/${id}`)}
              onViewAll={() => navigate('/hub/campaigns')}
            />
          </div>
          <div className="min-w-0"><AudienceCard data={analytics} loading={analyticsLoading} /></div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-4 pt-4 pb-3.5 flex flex-col gap-3">
                <Skeleton width={90} height={8} />
                <Skeleton width={60} height={22} />
                <Skeleton width="100%" height={3} />
              </div>
            ))
          ) : (
            <>
              <StatTile
                label={t.metrics.leadsSourced}
                value={(leadsTotal ?? 0).toLocaleString()}
                fill={leadsTotal ? Math.round((((leadsTotal ?? 0) - (leadsNeedingEnrichment ?? 0)) / leadsTotal) * 100) : 0}
                caption={leadsNeedingEnrichment ? `${leadsNeedingEnrichment.toLocaleString()} still need enrichment` : 'Every lead has a full profile'}
              />
              <StatTile
                label={t.metrics.invitesToday}
                value={used.toLocaleString()}
                caption="Connection requests sent today"
              />
              <StatTile
                label={t.metrics.connectRate}
                value={connectRate == null ? '—' : `${connectRate}%`}
                fill={connectRate ?? 0}
                tone="success"
                caption={connectRate == null ? 'Nobody invited yet' : 'Of everyone invited, all time'}
              />
              <StatTile
                label={t.metrics.repliesWaiting}
                value={(inboxUnread ?? 0).toLocaleString()}
                fill={inboxUnread ? 60 : 0}
                tone="warning"
                caption={inboxUnread ? 'Unread conversations in the inbox' : 'Nothing unread'}
              />
            </>
          )}
        </div>
      </div>
      </DepthProvider>
    </DashboardLayout>
  );
}

export default HubDashboardPage;
