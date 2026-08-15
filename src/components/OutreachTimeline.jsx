import { Send, AlertCircle, SkipForward } from 'lucide-react';
import { useOutreachTimeline } from 'src/hooks/useOutreachTimeline';
import { absoluteTime, relativeTime, OUTREACH_TYPE_LABEL } from 'src/common/utils/outreach';

/**
 * The timeline is a log of what YOU did — sent, failed, skipped. It never
 * claims anything about how the other person responded, because nothing in the
 * product observes that.
 */
const EVENT_STYLE = {
  sent: { icon: Send, color: 'var(--ui-accent-fg)', tint: 'var(--ui-accent-tint)' },
  failed: { icon: AlertCircle, color: 'var(--ui-danger-fg)', tint: 'var(--ui-danger-tint)' },
  skipped: {
    icon: SkipForward,
    color: 'var(--ui-text-tertiary)',
    tint: 'var(--ui-surface-sunken)',
  },
};

function headline(event) {
  const type = OUTREACH_TYPE_LABEL[event.type] || event.type;
  switch (event.status) {
    case 'sent':
      return `${type} sent`;
    case 'failed':
      return `${type} failed`;
    case 'skipped':
      return `${type} skipped`;
    default:
      return type;
  }
}

/** The exact copy that went out, when we have it. */
function SentCopy({ payload }) {
  const body = payload?.body || payload?.note;
  if (!body) return null;

  return (
    <div className="mt-1.5 px-2.5 py-2 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)] text-[12px] leading-relaxed text-[var(--ui-text-secondary)] whitespace-pre-wrap">
      {payload?.subject && (
        <div className="font-medium text-[var(--ui-text-primary)] mb-1">{payload.subject}</div>
      )}
      {body}
    </div>
  );
}

function TimelineRow({ event, isLast }) {
  const style = EVENT_STYLE[event.status] || EVENT_STYLE.skipped;
  const Icon = style.icon;

  return (
    <li className="flex gap-2.5">
      <div className="flex flex-col items-center shrink-0">
        <span
          className="grid place-items-center w-6 h-6 rounded-full shrink-0"
          style={{ background: style.tint, color: style.color }}
          aria-hidden="true"
        >
          <Icon size={12} />
        </span>
        {!isLast && <span className="w-px flex-1 my-1 bg-[var(--ui-border)]" aria-hidden="true" />}
      </div>

      <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-3'}`}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-medium text-[var(--ui-text-primary)]">
            {headline(event)}
          </span>
          <span
            className="text-[11px] shrink-0 tabular-nums text-[var(--ui-text-tertiary)]"
            title={absoluteTime(event.occurredAt)}
          >
            {relativeTime(event.occurredAt)}
          </span>
        </div>

        {event.campaignName && (
          <div className="text-[12px] text-[var(--ui-text-tertiary)] mt-0.5 truncate">
            {event.campaignName}
          </div>
        )}

        {event.status === 'sent' && <SentCopy payload={event.payload} />}

        {event.error && (
          <div className="text-[12px] mt-1 text-[var(--ui-danger-fg)]">{event.error}</div>
        )}
      </div>
    </li>
  );
}

/**
 * Full outreach history for one person: every send and failure, with the exact
 * note or message body that went out.
 *
 * Answers "what did I already say to them" — unanswerable from a status column
 * alone, and the reason outreach is stored as an event log rather than a couple
 * of date fields on the person.
 *
 * Renders no heading of its own. The caller owns the section title; when this
 * component also drew one the drawer showed "Outreach activity" twice.
 */
export function OutreachTimeline({ personId, profileUrl }) {
  const { events, loading, error } = useOutreachTimeline({ personId, profileUrl });

  if (loading) {
    return <p className="text-[13px] text-[var(--ui-text-tertiary)]">Loading activity…</p>;
  }

  if (error) {
    return <p className="text-[13px] text-[var(--ui-danger-fg)]">{error}</p>;
  }

  if (events.length === 0) {
    return (
      <p className="text-[13px] text-[var(--ui-text-tertiary)]">
        Not contacted yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {events.map((event, i) => (
        <TimelineRow
          key={event._id || `${event.occurredAt}-${i}`}
          event={event}
          isLast={i === events.length - 1}
        />
      ))}
    </ul>
  );
}
