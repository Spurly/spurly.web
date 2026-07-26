import { Send, UserCheck, MessageSquare, AlertCircle, SkipForward } from 'lucide-react';
import { useOutreachTimeline } from 'src/hooks/useOutreachTimeline';
import { absoluteTime, relativeTime, OUTREACH_TYPE_LABEL } from 'src/common/utils/outreach';

const EVENT_STYLE = {
  sent: { icon: Send, color: 'var(--brand-purple)', tint: 'var(--accent-tint)', verb: 'Sent' },
  accepted: { icon: UserCheck, color: 'var(--green)', tint: 'var(--green-tint)', verb: 'Accepted' },
  replied: { icon: MessageSquare, color: 'var(--green)', tint: 'var(--green-tint)', verb: 'Replied' },
  failed: { icon: AlertCircle, color: 'var(--red)', tint: 'var(--red-tint)', verb: 'Failed' },
  skipped: { icon: SkipForward, color: 'var(--text-tertiary)', tint: 'var(--surface-sunken)', verb: 'Skipped' },
};

function headline(event) {
  const type = OUTREACH_TYPE_LABEL[event.type] || event.type;
  switch (event.status) {
    case 'sent':
      return `${type} sent`;
    case 'accepted':
      return 'Connection accepted';
    case 'replied':
      return 'They replied';
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
    <div
      className="mt-1.5 px-2.5 py-2 rounded-[8px] text-[12px] leading-relaxed whitespace-pre-wrap"
      style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
    >
      {payload?.subject && (
        <div className="font-semibold text-[var(--text-primary)] mb-1">{payload.subject}</div>
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
      {/* Rail */}
      <div className="flex flex-col items-center shrink-0">
        <span
          className="w-7 h-7 rounded-full grid place-items-center"
          style={{ background: style.tint, color: style.color }}
        >
          <Icon size={13} />
        </span>
        {!isLast && <span className="w-px flex-1 my-1" style={{ background: 'var(--separator)' }} />}
      </div>

      {/* Content */}
      <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-4'}`}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            {headline(event)}
          </span>
          <span
            className="text-[11.5px] shrink-0 tabular-nums text-[var(--text-tertiary)]"
            title={absoluteTime(event.occurredAt)}
          >
            {relativeTime(event.occurredAt)}
          </span>
        </div>

        {event.campaignName && (
          <div className="text-[12px] text-[var(--text-tertiary)] mt-0.5 truncate">
            {event.campaignName}
          </div>
        )}

        {event.status === 'sent' && <SentCopy payload={event.payload} />}

        {event.error && (
          <div className="text-[12px] mt-1" style={{ color: 'var(--red)' }}>
            {event.error}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Full outreach history for one person: every send, failure, acceptance and
 * reply, with the exact note/message body that went out.
 *
 * This answers "what did I already say to them" — unanswerable from a status
 * column alone, and the reason outreach is stored as an event log rather than
 * a couple of date fields on the person.
 */
export function OutreachTimeline({ personId, profileUrl }) {
  const { events, loading, error } = useOutreachTimeline({ personId, profileUrl });

  return (
    <div className="mb-5">
      <h4 className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)] mb-2.5">
        Outreach activity
      </h4>

      {loading && <p className="text-[13px] text-[var(--text-tertiary)]">Loading activity…</p>}

      {!loading && error && (
        <p className="text-[13px]" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="text-[13px] text-[var(--text-tertiary)] italic">
          No outreach yet — this person hasn't been contacted.
        </p>
      )}

      {!loading && !error && events.length > 0 && (
        <ul className="flex flex-col">
          {events.map((event, i) => (
            <TimelineRow
              key={event._id || `${event.occurredAt}-${i}`}
              event={event}
              isLast={i === events.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
