/**
 * One bar for every ratio in the product.
 *
 * Spurly is full of them — 0/25 sent today, 412 of an audience imported,
 * 378 credits left, 31.2% connected — and before this each one was drawn
 * its own way or, more often, not drawn at all and left as bare text. One
 * shape, learned once, read everywhere.
 *
 * Deliberately 3px and deliberately not labelled: the figure above it is
 * the label. A meter with its own percentage caption is saying the same
 * thing twice.
 *
 * `value`/`max` rather than a percentage so callers pass the numbers they
 * already have and never compute a ratio wrong. A `max` of 0 or an unknown
 * total renders the track alone, which is the honest answer — see the
 * classic-search import, where LinkedIn returns no total and a progress
 * bar would have to invent its own denominator.
 */
export function Meter({
  value = 0,
  max = 100,
  tone = 'accent',
  label,
  className = '',
}) {
  const known = Number.isFinite(max) && max > 0;
  const pct = known ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      className={`ui-meter ${className}`}
      data-tone={tone === 'accent' ? undefined : tone}
      role="progressbar"
      aria-label={label}
      aria-valuenow={known ? value : undefined}
      aria-valuemin={known ? 0 : undefined}
      aria-valuemax={known ? max : undefined}
      aria-valuetext={known ? undefined : 'Total unknown'}
    >
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * The whole reading: a mono micro-cap label, the figure, and the bar.
 *
 * This is the composition the campaign header, the audience row and the
 * credits block in the rail all want, and building it three times is how
 * they end up three different sizes.
 */
export function Stat({
  label,
  value,
  suffix = null,
  value2 = null,
  max = null,
  tone = 'accent',
  className = '',
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="ui-micro truncate">{label}</div>
      <div className="ui-reading mt-2 truncate">
        {value}
        {value2 != null && <span className="text-[var(--ui-text-quaternary)]">/{value2}</span>}
        {suffix && (
          <span className="text-[var(--ui-t-section)] text-[var(--ui-text-tertiary)]">{suffix}</span>
        )}
      </div>
      {max != null && (
        <Meter value={Number(value) || 0} max={max} tone={tone} label={label} className="mt-2.5" />
      )}
    </div>
  );
}
