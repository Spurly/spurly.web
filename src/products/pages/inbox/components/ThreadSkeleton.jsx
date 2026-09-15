import { Skeleton } from 'src/core/primitives';

/**
 * Placeholder for one open conversation.
 *
 * Header, a handful of bubbles alternating sides, and the composer's band —
 * the three parts a reader is waiting for. Bubble widths vary and do not
 * alternate on a fixed rhythm, because a perfectly regular zig-zag reads as
 * a pattern rather than as messages.
 */

const BUBBLES = [
  { mine: false, width: '52%', lines: 2 },
  { mine: true, width: '38%', lines: 1 },
  { mine: false, width: '64%', lines: 3 },
  { mine: true, width: '45%', lines: 1 },
  { mine: false, width: '34%', lines: 1 },
];

export function ThreadSkeleton({ label = 'Loading conversation' }) {
  return (
    <div className="flex flex-col h-full min-h-0" role="status" aria-busy="true" aria-label={label}>
      <header
        className="flex items-center gap-2 shrink-0 border-b border-[var(--ui-border-hairline)] px-4"
        style={{ height: 'var(--ui-band)' }}
      >
        <Skeleton width={22} height={22} radius="var(--ui-radius-pill)" />
        <Skeleton width={160} height={10} />
      </header>

      <div className="flex-1 min-h-0 overflow-hidden px-4 py-4 flex flex-col gap-3">
        {BUBBLES.map((bubble, i) => (
          <div key={i} className={`flex ${bubble.mine ? 'justify-end' : 'justify-start'}`}>
            <div
              className="rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-sunken)] px-3 py-2 flex flex-col gap-2"
              style={{ width: bubble.width, maxWidth: 'min(68ch, 78%)' }}
            >
              {Array.from({ length: bubble.lines }, (_, line) => (
                <Skeleton
                  key={line}
                  width={line === bubble.lines - 1 ? '70%' : '100%'}
                  height={9}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-[var(--ui-border-hairline)] p-3 flex items-end gap-2">
        <Skeleton width="100%" height={56} radius="var(--ui-radius-sm)" />
        <Skeleton width={46} height={38} radius="var(--ui-radius-md)" />
      </div>
    </div>
  );
}

export default ThreadSkeleton;
