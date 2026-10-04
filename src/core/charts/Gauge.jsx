import { CountUp } from './CountUp.jsx';
import { fmtPct } from './format.js';

/**
 * A half-circle gauge for one rate. `value` is a percentage 0-100, or null when
 * there is no honest denominator yet: the track draws alone and the centre says
 * "—" instead of a 0% that would read as failure.
 */
export function Gauge({ value, label, caption, color = 'var(--ui-chart-1)', size = 168 }) {
  const known = Number.isFinite(value);
  const pct = known ? Math.min(100, Math.max(0, value)) : 0;
  const R = 52;
  const arc = `M ${60 - R} 62 A ${R} ${R} 0 0 1 ${60 + R} 62`;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size * 0.58 }}>
        <svg
          viewBox="0 0 120 70"
          width="100%"
          height="100%"
          role="img"
          aria-label={known ? `${label}: ${fmtPct(value)}` : `${label}: not enough data yet`}
        >
          <path d={arc} fill="none" stroke="var(--ui-meter-track)" strokeWidth="9" strokeLinecap="round" pathLength="100" />
          {known && pct > 0 && (
            <path
              d={arc}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="100"
              className="ui-gauge-sweep"
              style={{ '--gauge-offset': 100 - pct }}
            />
          )}
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="ui-num text-[length:var(--ui-t-heading)] leading-none text-[var(--ui-text-primary)]">
            {known ? <CountUp value={value} format={fmtPct} /> : '—'}
          </div>
        </div>
      </div>
      <p className="mt-2 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] uppercase tracking-[var(--ui-track-meta)] text-[var(--ui-text-secondary)]">
        {label}
      </p>
      {caption && <p className="mt-1 text-center text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)] leading-[1.4]">{caption}</p>}
    </div>
  );
}
