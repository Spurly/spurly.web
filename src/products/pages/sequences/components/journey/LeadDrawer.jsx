import { Avatar, Badge, Button, IconButton } from 'src/core/primitives';
import { FactList } from 'src/core/layout';
import { CloseIcon } from 'src/core/icons';
import { relativeTime } from 'src/shared/utils/outreach';
import { STEP_TYPE_MAP } from 'src/products/sequences/stepTypes.js';
import { dueText } from 'src/products/sequences/journeyModel.js';

const STATUS_TONE = { active: 'success', waiting: 'accent', failed: 'danger', completed: 'success', stopped: 'neutral' };
const OUTCOME_DOT = { done: 'bg-[var(--ui-success-dot)]', skipped: 'bg-[var(--ui-neutral-400)]', failed: 'bg-[var(--ui-danger-dot)]', waiting: 'bg-[var(--ui-accent-dot)]', stopped: 'bg-[var(--ui-neutral-400)]' };
const INVITATION = { none: 'No invitation sent', pending: 'Invitation pending', accepted: 'Connected' };

/**
 * Everything about one lead in this sequence: where they are and why, what happens next, what went wrong and how to
 * fix it, who is sending to them (org), and the full timeline. Read-only except Retry.
 */
export function LeadDrawer({ detail, loading, retrying, onRetry, onClose }) {
  const header = (
    <div className="flex items-center justify-between h-12 px-4 border-b border-[var(--ui-neutral-150)]">
      <span className="ui-micro !text-[var(--ui-text-secondary)]">Lead</span>
      <IconButton size="sm" variant="ghost" label="Close" icon={<CloseIcon size={14} strokeWidth={2.2} />} onClick={onClose} className="!w-7 !h-7" />
    </div>
  );
  if (!detail) {
    return (
      <div className="flex flex-col">
        {header}
        <p className="p-4 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">{loading ? 'Loading…' : 'Could not load this lead.'}</p>
      </div>
    );
  }
  const { enrollment: e, lead, connection, history, sender, excluded, reply } = detail;
  const step = e.current ? STEP_TYPE_MAP[e.current.type] : null;
  const canRetry = e.status === 'failed' && e.failure?.retryable && !e.unsafeToRetry && !e.failure?.unsafeToRetry;
  const meta = [lead.title, lead.company].filter(Boolean).join(' · ');
  return (
    <div className="flex flex-col">
      {header}
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={lead.photo || null} name={lead.name} size={44} />
          <div className="min-w-0">
            <a href={lead.profileUrl} target="_blank" rel="noreferrer" className="block truncate text-[length:var(--ui-t-section)] font-semibold tracking-[var(--ui-track-tight)] text-[var(--ui-text-primary)] hover:underline">{lead.name}</a>
            {(meta || lead.headline) && <p className="truncate text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">{meta || lead.headline}</p>}
            {lead.location && <p className="truncate text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">{lead.location}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={STATUS_TONE[e.status] ?? 'neutral'} dot>{e.status}</Badge>
            {step && <span className="text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">at {step.label}</span>}
          </div>
          {e.waitText && <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-body)] leading-[1.5]">{e.waitText}.</p>}
          {e.stopReason && <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-body)]">Stopped: {e.stopReason.replace(/-/g, ' ')}.</p>}
          {e.nextActionAt && <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">Next check {dueText(e.nextActionAt)}</p>}
        </div>

        {e.status === 'failed' && e.failure && (
          <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-danger-border)] bg-[var(--ui-danger-tint)] p-3 flex flex-col gap-2">
            <p className="text-[length:var(--ui-t-control)] font-medium text-[var(--ui-danger-fg)]">{e.failure.friendly}</p>
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-body)] leading-[1.5]">{e.failure.action}</p>
            {e.failure.raw && (
              <details className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
                <summary className="cursor-pointer">What LinkedIn said</summary>
                <p className="mt-1 break-words">{e.failure.raw}</p>
              </details>
            )}
            {e.unsafeToRetry && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-body)]">This step may already have gone out, so it is not retried automatically. Check LinkedIn first.</p>}
            {canRetry && <Button size="sm" variant="secondary" disabled={retrying} loading={retrying} onClick={() => onRetry(e.id)}>Retry this lead</Button>}
          </div>
        )}

        <div>
          <p className="ui-micro !text-[var(--ui-text-secondary)] mb-2">Connection</p>
          <FactList
            items={[
              { label: 'Degree', value: connection.degree ? `${connection.degree}${['st', 'nd', 'rd'][connection.degree - 1] || 'th'}` : 'Unknown' },
              { label: 'Invitation', value: INVITATION[connection.invitation] ?? connection.invitation },
              ...(reply ? [{ label: 'Reply', value: reply.replied ? 'They replied' : 'No reply yet' }] : []),
            ]}
          />
        </div>

        {sender && (
          <div>
            <p className="ui-micro !text-[var(--ui-text-secondary)] mb-2">Sending account</p>
            <FactList items={[{ label: 'Sends from', value: sender.name || 'An account of this organisation' }, ...(sender.reason ? [{ label: 'Chosen because', value: sender.reason.replace(/-/g, ' ') }] : [])]} />
            {excluded?.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
                {excluded.map((x) => <li key={x.orgAccountId}>{x.name || 'Another account'} did not take them: {x.reason.replace(/-/g, ' ')}</li>)}
              </ul>
            )}
          </div>
        )}

        <div>
          <p className="ui-micro !text-[var(--ui-text-secondary)] mb-2">Timeline</p>
          {history.length === 0 ? (
            <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-quaternary)]">Nothing has happened yet.</p>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {history.map((h, i) => (
                <li key={`${h.stepId || h.position}:${i}`} className="flex gap-2.5">
                  <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${OUTCOME_DOT[h.outcome] ?? OUTCOME_DOT.skipped}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)]">
                      {STEP_TYPE_MAP[h.type]?.label ?? h.type} <span className="text-[var(--ui-text-secondary)]">· {h.outcome}{h.branch ? ` · ${h.branch === 'yes' ? 'Yes' : 'No'}` : ''}</span>
                    </p>
                    {h.detail && <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)] break-words">{h.detail}</p>}
                    <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)]">{relativeTime(h.at)}{relativeTime(h.at) === 'just now' ? '' : ' ago'}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeadDrawer;
