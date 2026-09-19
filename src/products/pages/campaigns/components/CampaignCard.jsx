import { Badge, Menu, Meter, SoonTag } from 'src/core/primitives';
import { relativeTime } from 'src/shared/utils/outreach';
import { isLive } from 'src/products/campaigns/hooks/useCampaigns.js';
import { CAMPAIGN_STATUS_VIEW as STATUS_VIEW } from './statusView.js';

const SPINE = {
  running: 'var(--ui-accent)',
  paused: 'var(--ui-warning-dot)',
  done: 'var(--ui-success-dot)',
  draft: 'var(--ui-border-strong)',
};
const METER_TONE = { running: 'accent', paused: 'warning', done: 'success', draft: 'accent' };

const PAUSED_REASON = {
  manual: 'Paused by you',
  account: 'Paused — LinkedIn needs reconnecting',
  breaker: 'Paused after repeated failures',
  'budget-spent': 'Paused — this week’s invitation allowance is used up',
  entitlement: 'Paused — your plan no longer includes campaigns',
};

function Reading({ label, value, tone = 'primary', soon = false }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="ui-micro !text-[var(--ui-text-secondary)] truncate">{label}</span>
        {soon && <SoonTag />}
      </div>
      <div
        className={`ui-num !font-normal text-[length:var(--ui-t-section)] mt-1 ${
          soon
            ? 'text-[var(--ui-text-disabled)]'
            : tone === 'success'
              ? 'text-[var(--ui-success-fg)]'
              : 'text-[var(--ui-text-primary)]'
        }`}
      >
        {soon ? '—' : value}
      </div>
    </div>
  );
}

/**
 * One campaign as the handoff's card (Campaigns): status pill + when, name,
 * "N leads · what it sends", the one meter (people handled / enrolled — a
 * real ceiling), then three readings. A left spine in the status colour.
 *
 * Replies are drawn but not built: the inbox has no campaign linkage yet
 * (UI_REDESIGN_DEFERRED_FEATURES.md), so REPLIED is a SOON reading. The
 * insight box only ever states a fact the record carries (why it paused,
 * how many failed) — never a prediction.
 */
export function CampaignCard({ campaign, onOpen, onStart, onPause, onDelete, busy }) {
  const c = campaign.counts || {};
  const total = c.total ?? 0;
  const handled = Math.max(0, total - (c.pending ?? 0));
  const accepted = c.connected ?? 0;
  const reached = (c.invited ?? 0) + (c.connected ?? 0) + (c.messaged ?? 0);
  const acceptRate = reached > 0 && campaign.type !== 'message' ? ((c.connected ?? 0) / reached) * 100 : null;
  const view = STATUS_VIEW[campaign.status] ?? STATUS_VIEW.draft;
  const running = isLive(campaign);

  const when =
    campaign.status === 'done'
      ? campaign.completedAt && `ended ${relativeTime(campaign.completedAt)} ago`
      : campaign.status === 'paused'
        ? campaign.pausedAt && `paused ${relativeTime(campaign.pausedAt)} ago`
        : campaign.lastRunAt
          ? `sent ${relativeTime(campaign.lastRunAt)} ago`
          : `created ${relativeTime(campaign.createdAt)} ago`;

  const note =
    campaign.status === 'paused' && PAUSED_REASON[campaign.pausedReason]
      ? {
          tone: 'warning',
          text: `${PAUSED_REASON[campaign.pausedReason]} after ${handled.toLocaleString()} ${handled === 1 ? 'send' : 'sends'}. Nothing has gone out since.`,
        }
      : (c.failed ?? 0) > 0
        ? { tone: 'danger', text: `${c.failed.toLocaleString()} ${c.failed === 1 ? 'send' : 'sends'} failed. Open the campaign to retry.` }
        : campaign.status === 'draft'
          ? { tone: 'neutral', text: 'Nothing sends until you start it.' }
          : null;

  const noteStyle = {
    warning: 'bg-[var(--ui-warning-tint)] text-[var(--ui-warning-fg)]',
    danger: 'bg-[var(--ui-danger-tint)] text-[var(--ui-danger-fg)]',
    neutral: 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-secondary)]',
  };

  const menuItems = [
    running
      ? { label: 'Pause sending', onSelect: () => onPause(campaign), disabled: busy }
      : {
          label: campaign.status === 'paused' ? 'Resume sending' : 'Start sending',
          onSelect: () => onStart(campaign),
          disabled: busy || campaign.status === 'done',
        },
    { label: 'Open', onSelect: () => onOpen(campaign) },
    { label: 'Remove campaign', onSelect: () => onDelete(campaign), danger: true, disabled: busy },
  ];

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={campaign.name || 'Untitled campaign'}
      onClick={() => onOpen(campaign)}
      onKeyDown={(e) => (e.key === 'Enter' ? onOpen(campaign) : null)}
      className="group relative flex flex-col px-[18px] pt-3.5 pb-[18px] rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] cursor-pointer transition-[border-color,box-shadow] duration-[var(--ui-dur-fast)] hover:border-[var(--ui-accent-border)] hover:shadow-[var(--ui-hover-ring)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] overflow-hidden"
      style={{ boxShadow: `inset 2px 0 0 ${SPINE[campaign.status] ?? SPINE.draft}` }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Badge tone={view.tone} dot pulse={running} size="sm">
          {view.label}
        </Badge>
        {when && (
          <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] truncate">
            {when}
          </span>
        )}
        <Menu items={menuItems} className="ml-auto" label={`Actions for ${campaign.name}`} />
      </div>

      <h3 className="mt-2.5 text-[length:var(--ui-t-title)] font-semibold tracking-[var(--ui-track-tight)] text-[var(--ui-text-primary)] truncate">
        {campaign.name || 'Untitled campaign'}
      </h3>
      <p className="mt-0.5 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">
        {total.toLocaleString()} {total === 1 ? 'lead' : 'leads'} · {campaign.type === 'message' ? 'Message to connections' : 'Connection requests'}
      </p>

      <div className="flex items-center gap-2.5 mt-4">
        <Meter value={handled} max={total || 1} tone={METER_TONE[campaign.status]} label="Handled" className="flex-1" />
        <span className="ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-text-body)] shrink-0">
          {handled.toLocaleString()}/{total.toLocaleString()}
        </span>
      </div>

      <div className="h-px bg-[var(--ui-neutral-150)] my-3.5" />

      <div className="grid grid-cols-3 gap-3">
        {campaign.type === 'message' ? (
          <Reading label="Messaged" value={(c.messaged ?? 0).toLocaleString()} />
        ) : (
          <Reading label="Accepted" value={accepted.toLocaleString()} />
        )}
        {campaign.type === 'message' ? (
          <Reading label="Failed" value={(c.failed ?? 0).toLocaleString()} />
        ) : (
          <Reading label="Accept rate" value={acceptRate == null ? '—' : `${acceptRate.toFixed(1)}%`} tone="success" />
        )}
        <Reading label="Replied" soon />
      </div>

      {note && (
        <p className={`mt-3.5 px-3 py-2.5 rounded-[var(--ui-radius-sm)] text-[length:var(--ui-t-label)] leading-[1.5] ${noteStyle[note.tone]}`}>
          {note.text}
        </p>
      )}
    </article>
  );
}
