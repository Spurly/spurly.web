import { Link } from 'react-router-dom';
import { Meter, Stat } from 'src/core/primitives/Meter';

/**
 * The two-pane "console" shell for a hub detail page (one campaign, one
 * sequence): a main column (banners, an optional steps strip, the table)
 * beside a fixed-width rail of read-only status cards — delivery/progress
 * readings, pacing or outcome facts, the message or note editor.
 *
 * Lives in core/layout rather than either product's pages: both the
 * campaigns and sequences detail pages want the identical shell, and this is
 * the "shared" tier for a pattern used by more than one product — the same
 * reasoning that put DataTable here instead of duplicating it per product.
 *
 * Deliberately its own padded region rather than a change to
 * DashboardLayout's card wrapper (which ships with none): every other page
 * under DashboardLayout keeps managing its own gutter, so this only changes
 * spacing for the pages that opt into it.
 *
 * No internal height clamp: earlier this was pinned to the viewport with
 * `h-full`/`overflow-hidden` on every level (main column AND rail each
 * scrolling independently, "console" style). That meant a rail card whose
 * content genuinely needs room — the message/note editor, once it grows
 * past a couple of lines — was squeezed into whatever the fixed-height rail
 * had left over and had to scroll internally, inside its own little box.
 * Now the console just lays out at its natural height and DashboardLayout's
 * `"plain"` main column is the one thing that scrolls, so a tall message
 * scrolls the whole page like anything else, never a nested scrollbar.
 */
export function DetailConsole({ main, rail, className = '' }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0 flex flex-col gap-4">{main}</div>
        <div className="w-[376px] shrink-0 flex flex-col gap-3 pb-1">{rail}</div>
      </div>
    </div>
  );
}

/**
 * Muted parent label, a slash, then the current title — built to be handed
 * straight to DashboardLayout's `title` prop, which renders whatever it gets
 * inside a bare <h1>. No change to DashboardLayout itself: this only changes
 * what the two detail pages choose to put in that slot.
 */
export function Breadcrumb({ parent, parentHref, title }) {
  return (
    <>
      {parentHref ? (
        <Link
          to={parentHref}
          className="text-[var(--ui-text-tertiary)] font-medium hover:text-[var(--ui-text-secondary)] hover:no-underline"
        >
          {parent}
        </Link>
      ) : (
        <span className="text-[var(--ui-text-tertiary)] font-medium">{parent}</span>
      )}
      <span className="mx-2 text-[var(--ui-text-quaternary)] font-normal" aria-hidden="true">/</span>
      {title}
    </>
  );
}

/**
 * One card in the rail: a mono micro-cap header band, then content.
 * `grow` lets exactly one card — the message/note editor, in practice — take
 * whatever height the fixed-size cards above it leave, instead of every card
 * being sized to its own content and leaving dead space at the bottom of a
 * tall rail.
 */
export function RailCard({ title, children, grow = false, tone = 'default', className = '' }) {
  const toneBorder =
    tone === 'accent'
      ? 'border-[var(--ui-accent-tint-strong)] shadow-[inset_2px_0_0_var(--ui-accent)]'
      : 'border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)]';

  return (
    <div
      className={[
        'rounded-[var(--ui-radius-lg)] border bg-[var(--ui-surface-card)] overflow-hidden flex flex-col',
        grow ? 'flex-1' : 'shrink-0',
        toneBorder,
        className,
      ].filter(Boolean).join(' ')}
    >
      {title && (
        <div className="shrink-0 flex items-center h-12 px-4 border-b border-[var(--ui-neutral-150)]">
          <h2 className={`ui-micro ${tone === 'accent' ? '!text-[var(--ui-accent-fg)]' : '!text-[var(--ui-text-secondary)]'}`}>{title}</h2>
        </div>
      )}
      <div className={grow ? 'flex-1 flex flex-col' : ''}>{children}</div>
    </div>
  );
}

/**
 * Up to four readings in a row, reusing the same Stat the rest of the app
 * already renders a labelled figure with (MetricCard, the credits rail) —
 * see spurly_web_design_system notes on `.ui-reading`/`.ui-num` being the
 * only sanctioned way to render a figure.
 */
export function ReadingsGrid({ items }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item) => (
        <Stat key={item.label} label={item.label} value={item.value} size="sm" />
      ))}
    </div>
  );
}

/** A label/value fact list — "When this starts", "Outcomes" — each row a
 * hairline-divided baseline pair, the value in the mono figure treatment. */
export function FactList({ items }) {
  return (
    <dl className="flex flex-col">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-3 py-2.5 border-b border-[var(--ui-border-hairline)] last:border-b-0"
        >
          <dt className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] uppercase tracking-[0.09em] text-[var(--ui-text-secondary)] shrink-0">{item.label}</dt>
          <dd
            className="text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)] text-right truncate"
            style={item.tone ? { color: item.tone } : undefined}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A labelled Meter with its own reading and an optional caption underneath —
 * the "18 of 128 finished" / "62 / 200 this week" shape used by both detail
 * pages' rails. */
export function ProgressMeter({ label, valueLabel, value, max, tone = 'accent', caption }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{label}</span>
        <span className="ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-text-body)]">{valueLabel}</span>
      </div>
      <Meter value={value} max={max} tone={tone} label={label} />
      {caption && (
        <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)] leading-relaxed">{caption}</p>
      )}
    </div>
  );
}

export default DetailConsole;
