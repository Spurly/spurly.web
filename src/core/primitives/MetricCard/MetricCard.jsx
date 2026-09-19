export function MetricCard({ label, value, change, delta, changeType, icon, variant = 'solid', hint, hintColor }) {
  /* delta (number) is the design-system prop; change (string/number) + changeType is the legacy form */
  const deltaValue = delta !== undefined ? delta : (change !== undefined ? parseFloat(change) : undefined);
  const isPositive = changeType ? changeType === 'positive' : (deltaValue !== undefined ? deltaValue >= 0 : true);

  const cardBase =
    variant === 'glass'
      ? 'bg-[var(--ui-surface-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)]'
      : 'bg-[var(--ui-surface-card)] border border-[var(--ui-border-hairline)] shadow-[var(--ui-shadow-sm)]';

  return (
    <div className={`relative rounded-[var(--ui-radius-lg)] p-[var(--ui-pad-lg)] overflow-hidden ${cardBase}`}>
      {/* icon background accent */}
      {icon && (
        <div
          className="absolute top-4 right-4 grid place-items-center w-10 h-10 rounded-[var(--ui-radius-lg)]"
          style={{ background: 'var(--ui-accent-tint)' }}
        >
          <span className="text-[var(--ui-accent-fg)] grid place-items-center" style={{ width: 18, height: 18 }}>
            {icon}
          </span>
        </div>
      )}
      <p
        className="text-[length:var(--ui-t-meta)] font-medium uppercase tracking-[0.04em] mb-2"
        style={{ color: hintColor ?? 'var(--ui-text-tertiary)' }}
      >{label}</p>
      <p className="text-[length:var(--ui-t-metric)] font-medium tracking-[-0.012em] text-[var(--ui-text-primary)] leading-none tabular-nums">{value}</p>
      {deltaValue !== undefined && (
        <div className="flex items-center gap-1.5 mt-3">
          <span
            className="text-[length:var(--ui-t-body)] font-medium"
            style={{ color: isPositive ? 'var(--ui-success)' : 'var(--ui-danger)' }}
          >
            {isPositive ? '+' : ''}{typeof deltaValue === 'number' ? deltaValue.toFixed(1) : deltaValue}%
          </span>
          <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">vs last 7 days</span>
        </div>
      )}
      {hint && deltaValue === undefined && (
        <p
          className="text-[length:var(--ui-t-meta)] leading-snug mt-6"
          style={{ color: hintColor ?? 'var(--ui-text-tertiary)' }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
