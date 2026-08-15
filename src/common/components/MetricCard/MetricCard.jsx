export function MetricCard({ label, value, change, delta, changeType, icon, variant = 'solid', hint, hintColor }) {
  /* delta (number) is the design-system prop; change (string/number) + changeType is the legacy form */
  const deltaValue = delta !== undefined ? delta : (change !== undefined ? parseFloat(change) : undefined);
  const isPositive = changeType ? changeType === 'positive' : (deltaValue !== undefined ? deltaValue >= 0 : true);

  const cardBase =
    variant === 'glass'
      ? 'bg-[var(--ui-surface-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)]'
      : 'bg-[var(--surface-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-sm)]';

  return (
    <div className={`relative rounded-[var(--ui-radius-lg)] p-[var(--ui-pad-lg)] overflow-hidden ${cardBase}`}>
      {/* icon background accent */}
      {icon && (
        <div
          className="absolute top-4 right-4 grid place-items-center w-10 h-10 rounded-[var(--ui-radius-lg)]"
          style={{ background: 'var(--accent-tint)' }}
        >
          <span className="text-[var(--brand-purple)] grid place-items-center" style={{ width: 18, height: 18 }}>
            {icon}
          </span>
        </div>
      )}
      <p
        className="text-[11px] font-medium uppercase tracking-[0.04em] mb-2"
        style={{ color: hintColor ?? 'var(--text-tertiary)' }}
      >{label}</p>
      <p className="text-[24px] font-medium tracking-[-0.012em] text-[var(--text-primary)] leading-none tabular-nums">{value}</p>
      {deltaValue !== undefined && (
        <div className="flex items-center gap-1.5 mt-3">
          <span
            className="text-[13px] font-medium"
            style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}
          >
            {isPositive ? '+' : ''}{typeof deltaValue === 'number' ? deltaValue.toFixed(1) : deltaValue}%
          </span>
          <span className="text-[12px] text-[var(--text-tertiary)]">vs last 7 days</span>
        </div>
      )}
      {hint && deltaValue === undefined && (
        <p
          className="text-[11px] leading-snug mt-6"
          style={{ color: hintColor ?? 'var(--text-tertiary)' }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
