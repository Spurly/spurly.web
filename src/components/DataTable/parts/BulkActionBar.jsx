import { X } from 'lucide-react';
import { Button } from 'src/ui/primitives';

/**
 * Replaces the toolbar contents while rows are selected, rather than sitting
 * alongside them. Selection is a mode: showing search and bulk actions at once
 * asks the user to work out which one applies.
 */
export function BulkActionBar({ count, onClear, children }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[13px] font-medium text-[var(--ui-text-primary)] tabular-nums shrink-0">
        {count} selected
      </span>
      <span className="w-px h-4 bg-[var(--ui-border)] shrink-0" aria-hidden="true" />
      {children}
      <Button variant="ghost" size="sm" leadingIcon={<X size={13} />} onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
