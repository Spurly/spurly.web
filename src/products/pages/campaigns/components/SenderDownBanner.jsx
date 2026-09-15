import { AlertTriangle } from 'lucide-react';
import { sinceLabel } from './sinceLabel.js';

/**
 * The sender has stopped checking in.
 *
 * Shown ABOVE the pacing banner and instead of trusting it, because when the
 * worker is dead every word underneath is describing rules that nothing is
 * applying. This is the one state where the page must contradict the campaign's
 * own status.
 */
export function SenderDownBanner({ sender }) {
  if (!sender?.expected || !sender.stale) return null;

  return (
    <div
      className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 border-b border-[var(--ui-border-hairline)]"
      style={{ background: 'var(--ui-warning-tint)' }}
    >
      <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--ui-warning-fg)' }} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[var(--ui-t-label)]" style={{ color: 'var(--ui-warning-fg)' }}>
          This campaign says it is running, but nothing has picked it up
          {sender.lastRunAt ? ` since ${sinceLabel(sender.lastRunAt)}` : ' yet'}.
          No invitations are going out.
        </p>
        <p className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-0.5">
          The scheduled sender checks in every minute. If this persists, it is not running.
        </p>
      </div>
    </div>
  );
}
