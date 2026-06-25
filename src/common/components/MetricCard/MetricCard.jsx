export function MetricCard({ label, value, change, delta, changeType, icon, variant = 'solid', hint, hintColor }) {
  /* delta (number) is the design-system prop; change (string/number) + changeType is the legacy form */
  const deltaValue = delta !== undefined ? delta : (change !== undefined ? parseFloat(change) : undefined);
  const isPositive = changeType ? changeType === 'positive' : (deltaValue !== undefined ? deltaValue >= 0 : true);

  const cardBase =
    variant === 'glass'
      ? 'bg-[var(--glass-regular)] [backdrop-filter:blur(24px)_saturate(180%)] border border-[var(--border-glass)] shadow-[var(--shadow-glass)]'
      : 'bg-[var(--surface-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-sm)]';

  return (
    <div className={`relative rounded-[18px] p-6 overflow-hidden ${cardBase}`}>
      {/* icon background accent */}
      {icon && (
        <div
          className="absolute top-4 right-4 grid place-items-center w-10 h-10 rounded-[12px]"
          style={{ background: 'var(--accent-tint)' }}
        >
          <span className="text-[var(--brand-purple)] grid place-items-center" style={{ width: 18, height: 18 }}>
            {icon}
          </span>
        </div>
      )}
      <p
        className="text-[12px] font-semibold uppercase tracking-[0.04em] mb-3"
        style={{ color: hintColor ?? 'var(--text-tertiary)' }}
      >{label}</p>
      <p className="text-[36px] font-bold tracking-[-0.02em] text-[var(--text-primary)] leading-none tabular-nums">{value}</p>
      {deltaValue !== undefined && (
        <div className="flex items-center gap-1.5 mt-3">
          <span
            className="text-[13px] font-semibold"
            style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}
          >
            {isPositive ? '+' : ''}{typeof deltaValue === 'number' ? deltaValue.toFixed(1) : deltaValue}%
          </span>
          <span className="text-[12px] text-[var(--text-tertiary)]">vs last 7 days</span>
        </div>
      )}
      {hint && deltaValue === undefined && (
        <p
          className="text-[11.5px] leading-snug mt-6"
          style={{ color: hintColor ?? 'var(--text-tertiary)' }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
