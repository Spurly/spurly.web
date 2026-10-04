import { Surface, Skeleton } from 'src/core/primitives';
import { AreaTrend, CountUp, fmtNum, sumOf } from 'src/core/charts';
import { analyticsStrings as t } from './strings.js';

function MiniStat({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="ui-num text-[length:var(--ui-t-heading)] leading-none text-[var(--ui-text-primary)]">
        <CountUp value={value} />
      </div>
      <p className="mt-1.5 text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)] truncate">{label}</p>
    </div>
  );
}

/**
 * "Since you started using Spurly": the headline proof. The big number is the
 * connections gained since the first lead/outreach record; when that is not
 * known (nothing synced yet) it falls back to the network size rather than
 * inventing a gain.
 */
export function HeroCard({ data, loading, days }) {
  if (loading || !data) {
    return (
      <Surface className="p-6">
        <Skeleton height={14} width={220} />
        <div className="mt-5"><Skeleton height={44} width={180} /></div>
        <div className="mt-6"><Skeleton height={140} /></div>
      </Surface>
    );
  }

  const { totals, series, daysWithSpurly } = data;
  const gained = totals.connectionsSinceStart;
  const hasGain = gained != null && gained > 0;
  const rangeGain = sumOf(series.newConnections);
  const quiet = totals.invites === 0 && totals.connections === 0 && totals.messages === 0;

  return (
    <Surface
      className="relative p-6"
      style={{ background: 'linear-gradient(135deg, var(--ui-accent-wash) 0%, var(--ui-surface-card) 62%)' }}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
        <div className="min-w-0">
          <p className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-accent-fg)]">{t.hero.eyebrow}</p>
          {daysWithSpurly != null && (
            <p className="mt-1 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.hero.day(daysWithSpurly)}</p>
          )}
          {quiet ? (
            <p className="mt-4 text-[length:var(--ui-t-title)] text-[var(--ui-text-body)] leading-[1.5] max-w-[420px]">{t.hero.empty}</p>
          ) : (
            <>
              <div className="mt-4 flex items-baseline gap-2.5 flex-wrap">
                <span className="ui-num leading-none tracking-[-0.03em] text-[var(--ui-text-primary)]" style={{ fontSize: 44 }}>
                  {hasGain ? '+' : ''}
                  <CountUp value={hasGain ? gained : totals.connections} />
                </span>
                <span className="text-[length:var(--ui-t-title)] text-[var(--ui-text-body)]">
                  {hasGain ? t.hero.gained : t.hero.networkLabel.toLowerCase()}
                </span>
              </div>
              <p className="mt-2 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)] leading-[1.5] max-w-[420px]">
                {hasGain ? t.hero.grown(gained) : t.hero.network(totals.connections)}
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 max-w-[460px]">
                <MiniStat label={t.hero.invites} value={totals.invites} />
                <MiniStat label={t.hero.messages} value={totals.messages} />
                <MiniStat label={t.hero.conversations} value={totals.repliesConversations} />
              </div>
            </>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-text-secondary)]">
              {t.hero.networkLabel} · {fmtNum(totals.connections)}
            </span>
            <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-accent-fg)]">
              {t.hero.inRange(rangeGain, days)}
            </span>
          </div>
          <AreaTrend days={series.days} values={series.network} name="Connections" height={190} />
        </div>
      </div>
    </Surface>
  );
}
