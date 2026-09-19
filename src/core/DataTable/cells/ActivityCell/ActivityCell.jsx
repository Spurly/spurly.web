import { relativeTime, absoluteTime } from 'src/shared/utils/outreach';

/**
 * Two-line activity cell (Leads v2 "Last activity"): what happened, in the
 * sans, over WHEN in mono — "Invite sent" / "2d ago".
 */
export function ActivityCell({ label, at }) {
  if (!label) return <span className="text-[var(--ui-text-quaternary)]">—</span>;
  const rel = at ? relativeTime(at) : '';
  return (
    <span className="flex flex-col min-w-0" title={at ? absoluteTime(at) : undefined}>
      <span className="truncate text-[length:var(--ui-t-label)] leading-[1.3] text-[var(--ui-text-body)]">{label}</span>
      {rel && (
        <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] leading-[1.35] text-[var(--ui-neutral-400)]">
          {rel === 'just now' ? 'just now' : `${rel} ago`}
        </span>
      )}
    </span>
  );
}
