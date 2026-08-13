import { relativeTime, absoluteTime } from 'src/common/utils/outreach';

/**
 * Relative time with the exact timestamp on hover. Relative is what people scan
 * ("3d"); absolute is what they need when it matters.
 */
export function DateCell({ value }) {
  if (!value) return <span className="text-[var(--ui-text-tertiary)]">—</span>;

  const rel = relativeTime(value);

  return (
    <span className="text-[var(--ui-text-secondary)] tabular-nums" title={absoluteTime(value)}>
      {rel === 'just now' ? 'Just now' : `${rel} ago`}
    </span>
  );
}
