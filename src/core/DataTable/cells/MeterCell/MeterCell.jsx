import { Meter } from 'src/core/primitives';

/**
 * A ratio in a row — the handoff's one meter under a mono figure
 * ("160/250", "12/14 enriched"). Only for ratios with a REAL ceiling.
 */
export function MeterCell({ value = 0, max = 0, label = null, tone = 'accent', width = 140 }) {
  return (
    <span className="flex flex-col gap-[5px] min-w-0" style={{ width }}>
      <span className="font-[family-name:var(--ui-font-mono)] tabular-nums text-[length:var(--ui-t-meta)] text-[var(--ui-text-body)] leading-[1.2] truncate">
        {value.toLocaleString()}/{max.toLocaleString()}
        {label && <span className="text-[var(--ui-text-quaternary)]"> {label}</span>}
      </span>
      <Meter value={value} max={max || 1} tone={tone} label={label || 'Progress'} />
    </span>
  );
}
