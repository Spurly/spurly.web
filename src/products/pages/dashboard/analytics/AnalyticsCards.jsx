import { useState } from 'react';
import { Button, FilterPills, SectionCard, Skeleton } from 'src/core/primitives';
import { ActivityChart, ChartEmpty, Funnel3D, Gauge, Heatmap, RankedBars, hasData } from 'src/core/charts';
import { analyticsStrings as t } from './strings.js';

/** Section cards for the analytics, each a pure function of the analytics payload. */

export function ActivityCard({ data, loading }) {
  const s = data?.series;
  const any = s && (hasData(s.invites) || hasData(s.newConnections) || hasData(s.replies));
  return (
    <SectionCard title={t.activity.title} className="h-full">
      {loading || !data ? (
        <Skeleton height={260} />
      ) : any ? (
        <ActivityChart days={s.days} invites={s.invites} newConnections={s.newConnections} replies={s.replies} />
      ) : (
        <ChartEmpty className="h-[260px]">{t.activity.empty}</ChartEmpty>
      )}
    </SectionCard>
  );
}

export function HealthCard({ data, loading }) {
  return (
    <SectionCard title={t.health.title} className="h-full">
      {loading || !data ? (
        <Skeleton height={220} />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-around gap-x-4 gap-y-5">
            <Gauge
              value={data.acceptance.rate}
              label={t.health.acceptance}
              caption={t.health.acceptanceCaption(data.acceptance.matured, data.acceptance.windowDays)}
              color="var(--ui-chart-1)"
              size={150}
            />
            <Gauge
              value={data.reply.rate}
              label={t.health.reply}
              caption={t.health.replyCaption(data.reply.conversations)}
              color="var(--ui-chart-2)"
              size={150}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--ui-border-hairline)] pt-4">
            <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.health.medianReply}</span>
            <span className="ui-num !font-normal text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)]">
              {data.reply.medianHoursToReply == null ? t.health.medianNone : t.health.medianValue(data.reply.medianHoursToReply)}
            </span>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export function FunnelCard({ data, loading }) {
  return (
    <SectionCard title={t.funnel.title} className="h-full">
      {loading || !data ? (
        <Skeleton height={260} />
      ) : (
        <>
          <Funnel3D stages={data.funnel} />
          <p className="mt-5 text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)] leading-[1.5]">{t.funnel.note}</p>
        </>
      )}
    </SectionCard>
  );
}

export function HeatCard({ data, loading, timezone }) {
  const [mode, setMode] = useState('sends');
  return (
    <SectionCard
      title={t.heat.title}
      className="h-full"
      action={
        <FilterPills
          size="sm"
          ariaLabel="Heatmap data"
          value={mode}
          onChange={setMode}
          options={[
            { id: 'sends', label: t.heat.sends },
            { id: 'replies', label: t.heat.replies },
          ]}
        />
      }
    >
      {loading || !data ? (
        <Skeleton height={220} />
      ) : (
        <>
          <Heatmap
            grid={mode === 'sends' ? data.heat.sends : data.heat.replies}
            unit={mode === 'sends' ? 'sends' : 'replies'}
            color={mode === 'sends' ? 'var(--ui-chart-1)' : 'var(--ui-chart-3)'}
          />
          <p className="mt-1 text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">{t.heat.note(timezone)}</p>
        </>
      )}
    </SectionCard>
  );
}

export function LeaderboardCard({ data, loading, onOpen, onViewAll }) {
  const rows = data?.campaigns ?? [];
  const max = Math.max(1, ...rows.map((r) => r.sent));
  return (
    <SectionCard title={t.campaigns.title} onViewAll={onViewAll} viewAllLabel={t.campaigns.viewAll} className="h-full" noPadding>
      {loading || !data ? (
        <div className="p-4"><Skeleton height={180} /></div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.campaigns.empty}</p>
      ) : (
        rows.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onOpen(c.id)}
            className="w-full text-left px-4 py-3 border-b border-[var(--ui-border-hairline)] last:border-b-0 transition-colors hover:bg-[var(--ui-surface-hover)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)]">{c.name}</span>
              <span className="ui-num !font-normal text-[length:var(--ui-t-label)] text-[var(--ui-accent-fg)] shrink-0">
                {c.type === 'message' ? `${c.messaged.toLocaleString()} messaged` : c.rate != null ? `${c.rate}%` : '—'}
              </span>
            </span>
            <span className="mt-2 block h-[6px] rounded-full bg-[var(--ui-meter-track)] overflow-hidden">
              <span className="block h-full rounded-full relative ui-bar-grow" style={{ width: `${Math.max(4, (c.sent / max) * 100)}%`, background: 'var(--ui-accent-border)' }}>
                {c.sent > 0 && c.accepted > 0 && (
                  <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(c.accepted / c.sent) * 100}%`, background: 'var(--ui-chart-1)' }} />
                )}
              </span>
            </span>
            <span className="mt-1.5 block text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">
              {t.campaigns.row(c.sent, c.accepted)}
            </span>
          </button>
        ))
      )}
    </SectionCard>
  );
}

export function AudienceCard({ data, loading }) {
  const empty = data && data.audience.locations.length === 0 && data.audience.companies.length === 0;
  return (
    <SectionCard title={t.audience.title} className="h-full">
      {loading || !data ? (
        <Skeleton height={180} />
      ) : empty ? (
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.audience.empty}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-text-secondary)] mb-3">{t.audience.where}</p>
            <RankedBars rows={data.audience.locations} color="var(--ui-chart-1)" empty={t.audience.empty} />
          </div>
          <div>
            <p className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-text-secondary)] mb-3">{t.audience.work}</p>
            <RankedBars rows={data.audience.companies} color="var(--ui-chart-2)" empty={t.audience.empty} />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export function AnalyticsError({ message, onRetry }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-warning-border)] bg-[var(--ui-warning-tint)] px-4 py-3">
      <p className="text-[length:var(--ui-t-control)] text-[var(--ui-warning-fg)]">{message || t.error}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>{t.retry}</Button>
    </div>
  );
}

