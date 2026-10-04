import { Surface } from 'src/core/primitives';
import { CountUp, Sparkline } from 'src/core/charts';
import { analyticsStrings as t } from './strings.js';

/**
 * A KPI tile with the number, how it moved against the previous period, and a
 * sparkline of the range. The delta is omitted rather than shown as 0% when
 * there was nothing to compare against.
 */
export function TrendTile({ label, value, delta, prev, series, color, days, loading = false }) {
  const up = delta != null && delta > 0;
  const down = delta != null && delta < 0;
  return (
    <Surface className="min-w-0 px-4 pt-4 pb-3.5">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-text-secondary)] truncate">{label}</span>
        {delta != null && delta !== 0 && (
          <span
            className="inline-flex items-center gap-0.5 rounded-[var(--ui-radius-pill)] px-1.5 h-[18px] font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] shrink-0"
            style={{
              background: up ? 'var(--ui-success-tint)' : 'var(--ui-danger-tint)',
              color: up ? 'var(--ui-success-fg)' : 'var(--ui-danger-fg)',
            }}
          >
            <span aria-hidden="true">{up ? '▲' : '▼'}</span>
            {Math.abs(delta)}%
            <span className="sr-only">{up ? 'up' : down ? 'down' : ''} versus the previous period</span>
          </span>
        )}
      </div>
      <div className="ui-num tracking-[-0.02em] leading-none text-[length:var(--ui-t-metric)] mt-2.5 text-[var(--ui-text-primary)]">
        {loading ? '—' : <CountUp value={value} />}
      </div>
      <div className="mt-3">
        <Sparkline values={series} color={color} label={`${label} per day`} />
      </div>
      <p className="mt-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] truncate">
        {loading ? '' : prev > 0 || delta != null ? t.tiles.vs(days) : t.tiles.first}
      </p>
    </Surface>
  );
}
