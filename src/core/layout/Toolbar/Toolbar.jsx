/**
 * Horizontal control strip — a fixed-height row with a left cluster, a spacer
 * and a right cluster. Used by the table toolbar, page headers and filter bars
 * so all three sit on the same vertical rhythm instead of each picking its own
 * padding.
 *
 * HEIGHT is --ui-band (40px) and is not a per-call-site decision any more. The
 * People page used to stack a 40px filter bar directly on top of a 44px table
 * toolbar; a 4px difference between two adjacent bands is small enough that
 * nobody spots the cause and large enough that the buttons in them visibly
 * fail to line up down the right edge.
 *
 * PADDING is --ui-pad-x (12px), the same value the table cells use, which is
 * what lets the page title above align with the search field inside.
 *
 * `flush` removes the left padding for content that carries its own — tab
 * strips, in practice. A tab's hover box extends past its label, so a padded
 * tab strip puts the *label* 10px right of everything else on the page. The
 * Tabs primitive compensates itself; this is the escape hatch for anything
 * else that needs to.
 */
export function Toolbar({
  left = null,
  right = null,
  height,
  bordered = true,
  flush = false,
  className = '',
}) {
  return (
    <div
      className={[
        'flex items-center gap-2 shrink-0',
        bordered ? 'border-b border-[var(--ui-border-hairline)]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        height: height ?? 'var(--ui-band)',
        paddingInline: flush ? 0 : 'var(--ui-pad-x)',
      }}
    >
      {/* h-full so a full-height child (a tab strip) can hang its underline on
          the toolbar's own bottom border rather than floating above it. */}
      <div className="flex items-center gap-2 min-w-0 flex-1 h-full">{left}</div>
      {right && (
        <div
          className="flex items-center gap-1.5 shrink-0"
          style={flush ? { paddingRight: 'var(--ui-pad-x)' } : undefined}
        >
          {right}
        </div>
      )}
    </div>
  );
}
