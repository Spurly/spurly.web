import { Button } from 'src/core/primitives';

/**
 * The selection band (Leads v2): its own 48px row under the toolbar, on the
 * accent wash with the spine down its left edge — selection is Spurly's blue
 * state, and the spine is the one motif that says "this is live".
 *
 * Mono count, a quiet Clear, a hairline, then the page's bulk actions.
 */
export function BulkActionBar({ count, onClear, children }) {
  return (
    <div
      className="flex items-center gap-2 h-12 shrink-0 px-[var(--ui-card-x)] overflow-x-auto bg-[var(--ui-accent-wash)] border-b border-[var(--ui-accent-tint-strong)] shadow-[inset_2px_0_0_var(--ui-accent)] sp-rise"
      role="region"
      aria-label="Bulk actions"
    >
      <span className="ui-num text-[length:var(--ui-t-label)] text-[var(--ui-accent-fg)] shrink-0 whitespace-nowrap">
        {count} selected
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="!h-[26px] !px-2 !text-[var(--ui-accent-fg)] hover:!bg-[var(--ui-accent-tint-strong)]"
      >
        Clear
      </Button>
      <span className="w-px h-[18px] bg-[var(--ui-accent-border)] shrink-0" aria-hidden="true" />
      <div className="flex items-center gap-2 min-w-0 flex-1">{children}</div>
    </div>
  );
}
