import { Badge } from 'src/core/primitives';
import { campaignsStrings } from '../strings.js';

const t = campaignsStrings.senders;
const TONE = { active: 'success', paused: 'neutral', 'needs-attention': 'danger', removed: 'danger' };

/** Is there anyone left to move: a paused, broken or removed sender. */
export const hasSenderToRebalance = (senders = []) => senders.some((s) => s.health && s.health !== 'active');

/**
 * Who sends this (campaign or sequence) and how each account is doing. One row per account: name, state, what is
 * queued and sent, and that account's own pacing for today. Rendered only for a pool; solo and single-account pages
 * never mount it.
 */
export function SendersPanel({ senders = [], pacingBySender = [], sentKey = 'invited', describe = null }) {
  if (!senders.length) return null;
  const pace = new Map(pacingBySender.map((p) => [String(p.accountId), p]));
  return (
    <div data-testid="senders-panel" className="px-[var(--ui-card-x)] py-2.5 border-b border-[var(--ui-neutral-150)] bg-[var(--ui-surface-header)]">
      <p className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-primary)] mb-1.5">{t.heading}</p>
      <ul className="space-y-1">
        {senders.map((s) => {
          const p = pace.get(String(s.accountId));
          const counts = s.counts || {};
          return (
            <li key={s.accountId} className="flex items-center gap-2 flex-wrap text-[length:var(--ui-t-label)]">
              <span className="font-medium">{s.name || 'LinkedIn account'}</span>
              <Badge tone={TONE[s.health] || 'neutral'} dot>{t.health[s.health] || t.health.active}</Badge>
              <span className="text-[var(--ui-text-secondary)]">
                {describe ? describe(counts) : `${t.queued(counts.pending ?? 0)} · ${t.sent(counts[sentKey] ?? 0)}`}
              </span>
              {s.health !== 'active' && (
                <span className="text-[var(--ui-text-secondary)]">
                  {t.pausedReasons[s.pausedReason] || (s.health === 'removed' ? t.pausedReasons['sender-removed'] : s.health === 'needs-attention' ? t.pausedReasons.account : t.pausedFallback)}
                </span>
              )}
              {p && s.health === 'active' && (
                <span className="text-[var(--ui-text-secondary)]">
                  · {p.ok ? t.sendingNow : `${t.waiting}: ${p.message || ''}`}
                  {p.dailyCap ? ` · ${t.usage(p.dayUsed ?? 0, p.dailyCap)}` : ''}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
