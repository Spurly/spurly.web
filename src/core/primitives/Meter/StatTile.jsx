import { Meter } from './Meter';

/**
 * The handoff's stat tile (Dashboard, Campaigns, Settings → Billing):
 * a card with a mono micro-caps label, one large mono reading, the
 * standard meter under it, and a one-line caption saying what the number
 * means ("Oldest has been sitting 2 days").
 *
 * `max` draws the meter against a real ceiling; `fill` (0-100) draws it
 * against a ratio the caller already computed. Leave both out and no meter
 * is drawn — a bar with an invented denominator is worse than none.
 *
 * `soon` renders the tile in its not-built-yet state: the reading becomes
 * an em dash and a SOON tag sits beside the label, so a stakeholder sees
 * where the number will live without being shown a fake one.
 */
export function StatTile({
  label,
  value,
  suffix = null,
  max = null,
  fill = null,
  tone = 'accent',
  caption = null,
  soon = false,
  size = 'lg',
  className = '',
}) {
  const hasMeter = !soon && (max != null || fill != null);
  const meterValue = fill != null ? fill : Number(value) || 0;
  const meterMax = fill != null ? 100 : max;

  return (
    <div
      className={`min-w-0 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] ${
        size === 'sm' ? 'px-3.5 py-3' : 'px-4 pt-4 pb-3.5'
      } ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-text-secondary)] truncate">{label}</span>
        {soon && <SoonTag />}
      </div>
      <div
        className={`ui-num tracking-[-0.02em] leading-none ${
          size === 'sm' ? 'text-[length:var(--ui-t-section)] mt-2' : 'text-[length:var(--ui-t-metric)] mt-2.5'
        } ${soon ? 'text-[var(--ui-text-disabled)]' : 'text-[var(--ui-text-primary)]'}`}
      >
        {soon ? '—' : value}
        {!soon && suffix}
      </div>
      {hasMeter ? (
        <Meter value={meterValue} max={meterMax} tone={tone} label={label} className="mt-3" />
      ) : (
        <div className="h-[var(--ui-meter-h)] mt-3 rounded-[var(--ui-radius-pill)] bg-[var(--ui-meter-track)] opacity-60" />
      )}
      {caption && (
        <p className="mt-2.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.4] truncate">
          {caption}
        </p>
      )}
    </div>
  );
}

/** The "not built yet" marker — mono micro-caps on a neutral chip. */
export function SoonTag({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center h-[17px] px-1.5 rounded-[var(--ui-radius-2xs)] bg-[var(--ui-neutral-150)] text-[var(--ui-text-quaternary)] font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] font-medium uppercase tracking-[0.08em] leading-none shrink-0 ${className}`}
      title="Coming soon"
    >
      Soon
    </span>
  );
}
