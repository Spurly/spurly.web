import { useState } from 'react';
import { Button, SwitchRow } from 'src/core/primitives';
import { POST_REACTIONS } from 'src/products/posts/constants/constants.js';
import { relativeTime } from 'src/shared/utils/outreach.js';

const card = 'rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-4 flex flex-col gap-3';
const select = 'h-9 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-2.5 text-[var(--ui-text-primary)]';

/**
 * Bulk engagement rule: like the latest post of the people in one audience. Off
 * by default, likes only, a few per run, each counted against your daily limits.
 * Render with a `key` that changes when the saved rule arrives.
 */
export function RulePanel({ rule, audiences, saving, onSave }) {
  const [enabled, setEnabled] = useState(rule.enabled);
  const [audienceId, setAudienceId] = useState(rule.audienceId || '');
  const [reaction, setReaction] = useState(rule.reaction || 'like');
  const blocked = enabled && !audienceId;
  const last = rule.lastRun;

  return (
    <div className="flex flex-col gap-4 max-w-[640px]">
      <div>
        <h2 className="font-semibold">Like posts automatically</h2>
        <p className="text-[var(--ui-text-secondary)]">Spurly reacts to the most recent post of people in one audience: a few per run, spread out, and only within your daily limits. It never comments.</p>
      </div>
      <div className={card}>
        <SwitchRow title="Turn this on" hint="Off until you switch it on." checked={enabled} onChange={setEnabled} />
        <label className="flex flex-col gap-1.5 text-[length:var(--ui-t-body)] font-medium">
          Audience
          <select value={audienceId} onChange={(e) => setAudienceId(e.target.value)} className={select}>
            <option value="">Pick an audience…</option>
            {audiences.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[length:var(--ui-t-body)] font-medium">
          Reaction
          <select value={reaction} onChange={(e) => setReaction(e.target.value)} className={select}>
            {POST_REACTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
        {blocked && <p className="text-[var(--ui-danger-fg)]">Pick an audience before switching this on.</p>}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" loading={saving} disabled={saving || blocked} onClick={() => onSave({ enabled, audienceId: audienceId || null, reaction })}>Save</Button>
        {rule.lastRunAt && (
          <span className="text-[var(--ui-text-secondary)]">
            Last run {relativeTime(rule.lastRunAt)}
            {last && !last.error ? ` · liked ${last.liked}, skipped ${last.skipped}${last.stoppedBy ? ` · stopped: ${last.stoppedBy}` : ''}` : ''}
            {last?.error ? ` · failed: ${last.error}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
