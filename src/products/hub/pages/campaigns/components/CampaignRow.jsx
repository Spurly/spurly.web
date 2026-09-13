import { Link } from 'react-router-dom';
import { Loader2, Pause, Play, Trash2 } from 'lucide-react';
import { Button, Badge } from 'src/ui/primitives';
import { isLive } from 'src/products/hub/campaigns/hooks/useCampaigns.js';
import { CAMPAIGN_STATUS_VIEW as STATUS_VIEW } from './statusView.js';

/**
 * Progress is four counts and never a bar. A campaign's denominator does not
 * move but its numerator advances a handful of times an hour inside working
 * hours, so a bar would sit visibly still for most of a working day and read
 * as stuck.
 */
export function CountPills({ counts }) {
  const parts = [
    { key: 'invited', label: 'invited', tone: 'text-[var(--ui-text-primary)]' },
    { key: 'pending', label: 'queued', tone: 'text-[var(--ui-text-secondary)]' },
    { key: 'skipped', label: 'skipped', tone: 'text-[var(--ui-text-tertiary)]' },
    { key: 'failed', label: 'failed', tone: 'text-[var(--ui-danger-fg)]' },
  ].filter((p) => (counts?.[p.key] ?? 0) > 0);

  // A brand-new campaign has only queued members; showing three zeroes next to
  // it would be noise dressed as data.
  if (parts.length === 0) return <span className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">empty</span>;

  return (
    <span className="flex items-center gap-3 text-[var(--ui-t-label)] tabular-nums">
      {parts.map((p) => (
        <span key={p.key} className={p.tone}>
          {counts[p.key].toLocaleString()} {p.label}
        </span>
      ))}
    </span>
  );
}

export function CampaignRow({ campaign, onStart, onPause, onDelete, busy }) {
  const view = STATUS_VIEW[campaign.status] ?? STATUS_VIEW.draft;
  const running = isLive(campaign);

  return (
    <div className="flex items-center gap-3 px-[var(--ui-pad-lg)] py-3 border-b border-[var(--ui-border-hairline)] last:border-b-0">
      <Link to={`/hub/campaigns/${campaign._id}`} className="flex-1 min-w-0 group">
        <span className="block text-[var(--ui-t-body)] text-[var(--ui-text-primary)] truncate group-hover:underline">
          {campaign.name}
        </span>
        <span className="block text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] truncate">
          {campaign.note ? 'With a note' : 'No note'}
          {campaign.pausedReason === 'account' && ' · LinkedIn needs reconnecting'}
          {campaign.pausedReason === 'breaker' && ' · stopped after repeated failures'}
        </span>
      </Link>

      <CountPills counts={campaign.counts} />

      <Badge tone={view.tone} title={view.detail}>
        <span className="inline-flex items-center gap-1">
          {running && <Loader2 size={11} className="animate-spin" aria-hidden="true" />}
          {view.label}
        </span>
      </Badge>

      <div className="flex items-center gap-1 shrink-0">
        {running ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onPause(campaign)} title="Stop sending">
            <Pause size={13} />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || campaign.status === 'done'}
            onClick={() => onStart(campaign)}
            title={campaign.status === 'paused' ? 'Resume sending' : 'Start sending'}
          >
            <Play size={13} />
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDelete(campaign)} title="Remove this campaign">
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}
