import { fmtNum } from './format.js';

/**
 * The outreach funnel as stacked slabs in perspective. Width is the stage's
 * share of the widest stage (with a floor so a tiny stage stays visible and
 * labelled); the conversion chip shows the step's own ratio and is omitted
 * when it would not be meaningful (previous stage empty, or this stage larger
 * than the last because the two count different things).
 *
 * Pure CSS 3D, no WebGL. Slabs rise in one after another and lift on hover;
 * under reduced motion the stylesheet flattens both.
 */
const SHADES = [1, 2, 3, 4, 5, 6].map((n) => `var(--ui-funnel-${n})`);

export function Funnel3D({ stages = [] }) {
  const max = Math.max(1, ...stages.map((s) => Number(s.value) || 0));
  if (stages.length === 0) return null;

  return (
    <div className="ui-funnel" role="list" aria-label="Outreach funnel">
      <div className="ui-funnel__stage">
        {stages.map((s, i) => {
          const value = Number(s.value) || 0;
          const prev = i > 0 ? Number(stages[i - 1].value) || 0 : null;
          const conv = prev && value <= prev ? Math.round((value / prev) * 100) : null;
          const width = Math.max(22, Math.round((value / max) * 100));
          return (
            <div key={s.key ?? s.label} className="ui-funnel__row" role="listitem" style={{ '--i': i }}>
              <span className="ui-funnel__label">{s.label}</span>
              <div className="ui-funnel__track">
                <div
                  className="ui-funnel__slab"
                  style={{ width: `${width}%`, background: SHADES[Math.min(i, SHADES.length - 1)], '--slab-edge': SHADES[Math.min(i + 1, SHADES.length - 1)] }}
                >
                  <span className="ui-funnel__value">{fmtNum(value)}</span>
                </div>
              </div>
              <span className="ui-funnel__conv">{conv != null ? `${conv}%` : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
