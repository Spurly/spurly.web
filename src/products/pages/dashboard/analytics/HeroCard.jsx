import { useNavigate } from 'react-router-dom';
import { Surface, Skeleton } from 'src/core/primitives';
import { AreaTrend, CountUp, fmtNum, sumOf } from 'src/core/charts';
import { analyticsStrings as t } from './strings.js';

/** A raised, clickable stat: lifts toward the cursor and bobs gently on its own. */
function PopStat({ label, value, color, to, index = 0, big = false, prefix = '' }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={`ui-pop ${big ? 'ui-pop--big' : ''}`}
      style={{ '--pop': color, '--d': `${index * 0.5}s` }}
    >
      <span className="ui-pop__dot" aria-hidden="true" />
      <span className="ui-pop__value ui-num">
        {prefix}
        <CountUp value={value} />
      </span>
      <span className="ui-pop__label">{label}</span>
    </button>
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
      className="relative p-6 ui-hero-live overflow-hidden"
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
              <p className="mt-2 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)] leading-[1.5] max-w-[420px]">
                {hasGain ? t.hero.grown(gained) : t.hero.network(totals.connections)}
              </p>
              <div className="mt-5 flex flex-wrap items-stretch gap-3">
                <PopStat
                  big
                  index={0}
                  prefix={hasGain ? '+' : ''}
                  value={hasGain ? gained : totals.connections}
                  label={hasGain ? t.hero.gained : t.hero.networkLabel.toLowerCase()}
                  color="var(--ui-chart-4)"
                  to="/hub/network"
                />
                <PopStat index={1} value={totals.invites} label={t.hero.invites} color="var(--ui-chart-1)" to="/hub/campaigns" />
                <PopStat index={2} value={totals.messages} label={t.hero.messages} color="var(--ui-chart-2)" to="/hub/campaigns" />
                <PopStat index={3} value={totals.repliesConversations} label={t.hero.conversations} color="var(--ui-chart-3)" to="/hub/inbox" />
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
