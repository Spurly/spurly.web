import { useId } from 'react';

/**
 * A tiny trend line for a KPI tile. Plain SVG (no chart library): one path for
 * the line, one for the soft fill, drawn in on mount. All-zero or too-short
 * data renders a flat baseline rather than a misleading spike.
 */
export function Sparkline({ values = [], color = 'var(--ui-chart-1)', height = 30, className = '', label }) {
  const gid = `spark-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const data = values.map((v) => (Number.isFinite(v) ? v : 0));
  const W = 100;
  const H = 30;
  const pad = 2;

  if (data.length < 2) {
    return <div className={`h-[var(--ui-meter-h)] rounded-full bg-[var(--ui-meter-track)] ${className}`} aria-hidden="true" />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const flat = max === min;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    flat ? H - pad - 1 : H - pad - ((v - min) / span) * (H - pad * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}
      role="img"
      aria-label={label || 'Trend'}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {!flat && <path d={area} fill={`url(#${gid})`} className="ui-spark-fill" />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength="1"
        className="ui-spark-line"
        style={{ opacity: flat ? 0.45 : 1 }}
      />
    </svg>
  );
}
