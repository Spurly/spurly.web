/**
 * Horizontal control strip — a fixed-height row with a left cluster, a spacer
 * and a right cluster. Used by the table toolbar, page headers and filter bars
 * so all three sit on the same vertical rhythm instead of each picking its own
 * padding.
 */
export function Toolbar({ left = null, right = null, height = 40, bordered = true, className = '' }) {
  return (
    <div
      className={[
        'flex items-center gap-2 px-3 shrink-0',
        bordered ? 'border-b border-[var(--ui-border-hairline)]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">{left}</div>
      {right && <div className="flex items-center gap-1.5 shrink-0">{right}</div>}
    </div>
  );
}
