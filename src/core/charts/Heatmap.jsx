import { useState } from 'react';
import { DAY_LABELS, hourLabel } from './format.js';

/**
 * Day-of-week x hour grid (Monday first), cell shade = how many. The hover
 * readout and the "busiest slot" line are the text equivalent of the picture,
 * so nothing here depends on colour alone.
 */
export function Heatmap({ grid = [], unit = 'sends', color = 'var(--ui-chart-1)' }) {
  const [hover, setHover] = useState(null);
  const rows = DAY_LABELS.map((_, d) => (Array.isArray(grid[d]) ? grid[d] : []));
  const cell = (d, h) => Number(rows[d][h]) || 0;
  let max = 0;
  let best = null;
  for (let d = 0; d < 7; d += 1) {
    for (let h = 0; h < 24; h += 1) {
      const v = cell(d, h);
      if (v > max) {
        max = v;
        best = { d, h, v };
      }
    }
  }

  const readout = hover
    ? `${DAY_LABELS[hover.d]} ${hourLabel(hover.h)} · ${hover.v} ${hover.v === 1 ? unit.replace(/s$/, '') : unit}`
    : best
      ? `Busiest: ${DAY_LABELS[best.d]} ${hourLabel(best.h)} · ${best.v} ${best.v === 1 ? unit.replace(/s$/, '') : unit}`
      : `No ${unit} in this range yet`;

  return (
    <div>
      <div
        role="img"
        aria-label={best ? `Heatmap of ${unit} by weekday and hour. Busiest slot ${DAY_LABELS[best.d]} ${hourLabel(best.h)}.` : `Heatmap of ${unit}: no data`}
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: '28px repeat(24, minmax(0, 1fr))' }}
        onMouseLeave={() => setHover(null)}
      >
        {DAY_LABELS.map((day, d) => (
          <div key={day} className="contents">
            <span className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] leading-[18px]">{day}</span>
            {Array.from({ length: 24 }, (_, h) => {
              const v = cell(d, h);
              const t = max > 0 ? v / max : 0;
              return (
                <span
                  key={h}
                  onMouseEnter={() => setHover({ d, h, v })}
                  className="h-[18px] rounded-[var(--ui-radius-2xs)] transition-transform duration-[var(--ui-dur-fast)] hover:scale-125 hover:z-10"
                  style={{
                    background:
                      v > 0
                        ? `color-mix(in srgb, ${color} ${Math.round(18 + t * 82)}%, var(--ui-surface-card))`
                        : 'var(--ui-meter-track)',
                    opacity: v > 0 ? 1 : 0.55,
                  }}
                />
              );
            })}
          </div>
        ))}
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] text-center leading-none pt-1">
            {h % 6 === 0 ? hourLabel(h).replace(' ', '').toLowerCase() : ''}
          </span>
        ))}
      </div>
      <p className="mt-3 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]" aria-live="polite">
        {readout}
      </p>
    </div>
  );
}
