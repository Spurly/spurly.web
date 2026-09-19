import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Avatar, Button, Meter, Skeleton, SoonTag, StatTile, WorkingLine } from 'src/core/primitives';
import { PlusIcon, SparkIcon } from 'src/core/icons';
import { useAuth } from 'src/core/auth/hooks/useAuth.js';
import { useDashboardSummary } from 'src/core/sidebarSummary/hooks/useDashboardSummary.js';
import { useNotifications } from 'src/core/notifications/hooks/useNotifications.js';
import { useCampaigns, isLive } from 'src/products/campaigns/hooks/useCampaigns.js';
import leadController from 'src/products/leads/controller/lead.js';
import { LEAD_EVENTS } from 'src/products/leads/constants/constants.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import { relativeTime, absoluteTime } from 'src/shared/utils/outreach';
import { CAMPAIGN_STATUS_VIEW as STATUS_VIEW } from 'src/products/pages/campaigns/components/statusView.js';
import { dashboardStrings as t } from './strings.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** The four newest leads — the "Top of the list" panel until fit ranking exists. */
function useNewestLeads(limit = 4) {
  const [state, setState] = useState({ leads: [], loading: true });
  useEffect(() => {
    let alive = true;
    const em = new EventEmitter();
    em.once(LEAD_EVENTS.LIST_LEADS_SUCCESS, (data) => alive && setState({ leads: (data?.leads ?? []).slice(0, limit), loading: false }));
    em.once(LEAD_EVENTS.LIST_LEADS_FAILURE, () => alive && setState({ leads: [], loading: false }));
    leadController.listLeads(em, { page: 1, limit });
    return () => {
      alive = false;
    };
  }, [limit]);
  return state;
}

const DOT = {
  danger: 'var(--ui-danger-dot)',
  warning: 'var(--ui-warning-dot)',
  success: 'var(--ui-success-dot)',
  accent: 'var(--ui-accent)',
};

function AttentionRow({ tone, title, hint, cta, onClick }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 border-b border-[var(--ui-border-hairline)] last:border-b-0">
      <span className="mt-[7px] w-[7px] h-[7px] rounded-full shrink-0" style={{ background: DOT[tone] }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)] leading-[1.45]">{title}</p>
        <p className="mt-0.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.45]">{hint}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-accent-fg)] hover:underline focus:outline-none focus-visible:underline"
      >
        {cta}
      </button>
    </div>
  );
}

/**
 * Home — the handoff's Dashboard ("Good morning, Marcus").
 *
 * Real data throughout: the four tiles and the attention list come from
 * GET /hub/summary/dashboard + the campaign list; "Top of the list" shows
 * the newest leads (the fit ranking it is designed for is SOON); "Recently"
 * is the notification feed, which IS the product's activity record — the
 * handoff's "Overnight" timeline, from data that exists.
 */
export function HubDashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.name || '').split(' ')[0] || '';
  const navigate = useNavigate();

  const { leadsTotal, leadsNeedingEnrichment, pacing, connectRate, inboxUnread, enrichmentFailedRecent, loading } =
    useDashboardSummary();
  const { campaigns, loading: campaignsLoading, start } = useCampaigns();
  const { leads: newest, loading: newestLoading } = useNewestLeads(4);
  const { items: activity, loading: activityLoading } = useNotifications({ limit: 5 });

  const running = useMemo(() => campaigns.filter(isLive), [campaigns]);
  const shown = useMemo(
    () => campaigns.filter((c) => c.status === 'running' || c.status === 'paused').slice(0, 4),
    [campaigns],
  );
  const paused = useMemo(() => campaigns.filter((c) => c.status === 'paused').slice(0, 2), [campaigns]);

  const attention = [
    inboxUnread > 0 && {
      key: 'inbox',
      tone: 'success',
      title: t.attention.repliesWaitingTitle(inboxUnread),
      hint: t.attention.repliesWaitingHint,
      cta: t.attention.repliesWaitingCta,
      onClick: () => navigate('/hub/inbox'),
    },
    enrichmentFailedRecent > 0 && {
      key: 'enrich',
      tone: 'danger',
      title: t.attention.enrichmentFailedTitle(enrichmentFailedRecent),
      hint: t.attention.enrichmentFailedHint,
      cta: t.attention.enrichmentFailedCta,
      onClick: () => navigate('/hub/enrichment'),
    },
    ...paused.map((c) => ({
      key: c._id,
      tone: 'warning',
      title: t.attention.pausedTitle(c.name || 'A campaign'),
      hint: `${(c.counts?.pending ?? 0).toLocaleString()} people still queued. Nothing goes out until it resumes.`,
      cta: t.attention.pausedCta,
      onClick: () => start(c),
    })),
  ].filter(Boolean);

  const cap = pacing?.dailyCap;
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
                max={cap || null}
                caption={cap ? `${Math.max(0, cap - used)} left before the daily cap` : 'No daily cap set'}
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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-3 items-start">
          <SectionCard title={t.attention.title} tone="accent" icon={<SparkIcon size={13} strokeWidth={1.9} />} noPadding>
            {loading || campaignsLoading ? (
              <div className="p-4 flex flex-col gap-3">
                <Skeleton height={36} />
                <Skeleton height={36} />
              </div>
            ) : attention.length === 0 ? (
              <div className="px-4 py-6">
                <p className="text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-primary)]">{t.attention.allCaughtUpTitle}</p>
                <p className="mt-1 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.attention.allCaughtUpHint}</p>
              </div>
            ) : (
              attention.map(({ key, ...row }) => <AttentionRow key={key} {...row} />)
            )}
          </SectionCard>

          <SectionCard
            title={t.topList.title}
            action={<SoonTag />}
            onViewAll={() => navigate('/hub/leads')}
            viewAllLabel={t.topList.allLeads}
            noPadding
          >
            {newestLoading ? (
              <div className="p-4 flex flex-col gap-3">
                <Skeleton height={30} />
                <Skeleton height={30} />
              </div>
            ) : newest.length === 0 ? (
              <p className="px-4 py-6 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.topList.empty}</p>
            ) : (
              <>
                {newest.map((lead) => (
                  <div key={lead._id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--ui-border-hairline)]">
                    <Avatar src={lead.profilePictureUrl || null} name={lead.name} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-primary)]">{lead.name}</p>
                      <p className="truncate text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">
                        {[lead.currentTitle, lead.companyName].filter(Boolean).join(' · ') || lead.headline}
                      </p>
                    </div>
                    <div className="w-[56px] shrink-0 flex flex-col items-end gap-1">
                      <span className="ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-text-disabled)]">—</span>
                      <span className="block h-[var(--ui-meter-h)] w-full rounded-[var(--ui-radius-pill)] bg-[var(--ui-meter-track)]" />
                    </div>
                  </div>
                ))}
                <p className="px-4 py-2.5 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)]">
                  {t.topList.hint}
                </p>
              </>
            )}
          </SectionCard>

          <SectionCard title={t.campaigns.title} onViewAll={() => navigate('/hub/campaigns')} viewAllLabel={t.campaigns.viewAll} noPadding>
            {campaignsLoading ? (
              <div className="p-4 flex flex-col gap-3">
                <Skeleton height={36} />
                <Skeleton height={36} />
              </div>
            ) : shown.length === 0 ? (
              <div className="px-4 py-6">
                <p className="text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-primary)]">{t.campaigns.emptyTitle}</p>
                <p className="mt-1 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.campaigns.emptyHint}</p>
              </div>
            ) : (
              shown.map((c) => {
                const view = STATUS_VIEW[c.status] ?? STATUS_VIEW.draft;
                const total = c.counts?.total ?? 0;
                const handled = Math.max(0, total - (c.counts?.pending ?? 0));
                const warn = c.status === 'paused';
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => navigate(`/hub/campaigns/${c._id}`)}
                    className="w-full text-left px-4 py-3.5 border-b border-[var(--ui-border-hairline)] last:border-b-0 transition-colors hover:bg-[var(--ui-surface-hover)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLive(c) ? 'sp-pulse' : ''}`}
                        style={{ background: warn ? 'var(--ui-warning-dot)' : 'var(--ui-accent-border)' }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 min-w-0 truncate text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)]">
                        {c.name || 'Untitled campaign'}
                      </span>
                      <span className={`font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] uppercase tracking-[var(--ui-track-meta)] ${warn ? 'text-[var(--ui-warning-fg)]' : 'text-[var(--ui-accent-fg)]'}`}>
                        {view.label}
                      </span>
                    </span>
                    <span className="flex items-center gap-3 mt-2.5">
                      <Meter value={handled} max={total || 1} tone={warn ? 'warning' : 'accent'} label="Handled" className="flex-1" />
                      <span className="ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-text-body)] shrink-0">
                        {handled}/{total}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </SectionCard>

          <SectionCard title={t.activity.title} onViewAll={() => navigate('/dashboard/notifications')} noPadding>
            {activityLoading ? (
              <div className="p-4 flex flex-col gap-3">
                <Skeleton height={28} />
                <Skeleton height={28} />
              </div>
            ) : activity.length === 0 ? (
              <p className="px-4 py-6 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.activity.empty}</p>
            ) : (
              <div className="px-4 py-4 flex flex-col gap-3.5">
                {activity.map((n, i) => (
                  <div key={n._id} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0 pt-[5px]">
                      <span className="w-[7px] h-[7px] rounded-full" style={{ background: i === 0 ? 'var(--ui-accent)' : 'var(--ui-border-strong)' }} />
                      {i < activity.length - 1 && <span className="flex-1 w-px bg-[var(--ui-border-hairline)] mt-1" />}
                    </div>
                    <div className="min-w-0 pb-0.5">
                      <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)] leading-[1.4]">{n.text}</p>
                      <p className="mt-0.5 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-neutral-400)]" title={absoluteTime(n.createdAt)}>
                        {relativeTime(n.createdAt)} ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default HubDashboardPage;
