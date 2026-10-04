import { fmtNum } from './format.js';

/**
 * Horizontal ranked bars. `rows` are { label, value, sub? }. The value is
 * always printed, so the bar is a convenience for comparison and never the only
 * way to read the number.
 */
export function RankedBars({ rows = [], color = 'var(--ui-chart-1)', empty = 'Nothing to show yet' }) {
  if (rows.length === 0) return <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0));
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-[length:var(--ui-t-label)]">
            <span className="truncate text-[var(--ui-text-body)]" title={r.label}>{r.label}</span>
            <span className="ui-num !font-normal text-[var(--ui-text-primary)] shrink-0">{fmtNum(r.value)}</span>
          </div>
          <div className="mt-1 h-[6px] rounded-full bg-[var(--ui-meter-track)] overflow-hidden">
            <div
              className="h-full rounded-full ui-bar-grow"
              style={{ width: `${Math.max(3, ((Number(r.value) || 0) / max) * 100)}%`, background: color }}
            />
          </div>
          {r.sub && <p className="mt-0.5 text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
