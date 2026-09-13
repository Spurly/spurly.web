import { Clock } from 'lucide-react';
import { sinceLabel } from './sinceLabel.js';

/**
 * What the campaign is doing between sends.
 *
 * Only shown while running: on a draft it would be answering a question nobody
 * has asked yet, and on a paused campaign the pause is the answer.
 */
export function PacingBanner({ campaign, pacing, sender }) {
  if (!pacing || campaign.status !== 'running') return null;
  // A dead worker is not a pacing state, and saying "sending now" over one
  // would be the page's most confident lie.
  if (sender?.expected && sender.stale) return null;

  const sending = pacing.ok;
  return (
    <div
      className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 border-b border-[var(--ui-border-hairline)]"
      style={{ background: sending ? 'var(--ui-success-tint)' : 'var(--ui-surface-sunken)' }}
    >
      <Clock size={14} className="mt-0.5 shrink-0 text-[var(--ui-text-tertiary)]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[var(--ui-t-label)] text-[var(--ui-text-primary)]">
          {sending ? 'Sending now, a few at a time.' : pacing.message}
        </p>
        <p className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-0.5">
          {pacing.window.startHour}:00–{pacing.window.endHour}:00 {pacing.timezone.replace('_', ' ')} ·
          {' '}up to {pacing.hourlyCap}/hour ·
          {' '}{pacing.weekUsed} of {pacing.weeklyLimit} invitations used this week
          {/* Said explicitly because the number will not match this campaign's
              own count, and the difference is the whole point: LinkedIn counts
              invitations per person, so anything sent from the extension is
              spending the same allowance. */}
          {' '}across everything you send.
        </p>
        {/* The heartbeat, stated quietly when it is fine. A campaign that is
            deliberately idle and one that nothing is serving look identical
            without it. */}
        {sender?.lastRunAt && (
          <p className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-0.5">
            Sender last checked in {sinceLabel(sender.lastRunAt)}.
          </p>
        )}
      </div>
    </div>
  );
}
