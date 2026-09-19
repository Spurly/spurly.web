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
      className={`relative overflow-hidden flex items-start gap-2.5 px-[var(--ui-card-x)] py-2.5 border-b ${
        sending
          ? 'bg-[var(--ui-accent-wash)] border-[var(--ui-accent-tint-strong)] shadow-[inset_2px_0_0_var(--ui-accent)]'
          : 'bg-[var(--ui-surface-header)] border-[var(--ui-neutral-150)]'
      }`}
    >
      {sending ? (
        <>
          <span className="sp-scan" aria-hidden="true" />
          <span className="relative mt-[6px] w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--ui-accent)] sp-pulse" aria-hidden="true" />
        </>
      ) : (
        <Clock size={14} className="mt-0.5 shrink-0 text-[var(--ui-text-quaternary)]" aria-hidden="true" />
      )}
      <div className="min-w-0">
        <p className={`relative text-[length:var(--ui-t-label)] ${sending ? 'text-[var(--ui-accent-fg)] font-medium' : 'text-[var(--ui-text-primary)]'}`}>
          {sending ? 'Sending now, a few at a time.' : pacing.message}
        </p>
        <p className="relative text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] mt-0.5">
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
          <p className="relative font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] mt-1">
            Sender last checked in {sinceLabel(sender.lastRunAt)}.
          </p>
        )}
      </div>
    </div>
  );
}
