import { AlertTriangle, X } from 'lucide-react';
import { IconButton } from 'src/ui/primitives';

/**
 * Failure strip for a manual sync.
 *
 * FAILURES ONLY. A successful sync is confirmed by the toast and nothing else —
 * rendering the same sentence twice, once floating and once pinned above the
 * table, made a quiet success look like two separate events.
 *
 * Failures keep the strip because sync errors are frequently instructions
 * rather than statements — "LinkedIn's connections page isn't sorted by
 * recently added, set the sort back and sync again" is a task, and a task that
 * auto-dismisses after seven seconds is one the user can't act on.
 */
export function SyncFailure({ result, onDismiss }) {
  if (!result || result.ok) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-2 shrink-0 border-b border-[var(--ui-border-hairline)]"
      style={{
        height: 'var(--ui-band)',
        paddingInline: 'var(--ui-pad-x)',
        background: 'var(--ui-danger-tint)',
      }}
    >
      <AlertTriangle size={13} style={{ color: 'var(--ui-danger-fg)' }} aria-hidden="true" />
      <span className="text-[var(--ui-t-label)] font-medium" style={{ color: 'var(--ui-danger-fg)' }}>
        {result.error}
      </span>
      <span className="flex-1" />
      <IconButton size="sm" variant="ghost" label="Dismiss" icon={<X size={13} />} onClick={onDismiss} />
    </div>
  );
}
