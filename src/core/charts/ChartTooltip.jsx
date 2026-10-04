/**
 * The one hover card every chart uses: a title line and one row per series
 * with its swatch. Recharts passes `active`, `payload` and `label`.
 */
export function ChartTooltip({ active, payload, label, formatLabel = (l) => l, formatValue = (v) => v }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;
  return (
    <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-md)] px-3 py-2 min-w-[140px]">
      <p className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] uppercase tracking-[var(--ui-track-meta)] text-[var(--ui-text-quaternary)]">
        {formatLabel(label)}
      </p>
      <div className="mt-1.5 flex flex-col gap-1">
        {payload.map((p) => (
          <div key={p.dataKey ?? p.name} className="flex items-center justify-between gap-4 text-[length:var(--ui-t-label)]">
            <span className="flex items-center gap-1.5 text-[var(--ui-text-secondary)]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.stroke || p.fill }} aria-hidden="true" />
              {p.name}
            </span>
            <span className="ui-num !font-normal text-[var(--ui-text-primary)]">{formatValue(p.value, p)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
