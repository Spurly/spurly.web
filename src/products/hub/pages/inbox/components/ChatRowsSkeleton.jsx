import { Skeleton } from 'src/ui/primitives';

/**
 * Placeholder for the conversation rail while the first page of chats loads.
 *
 * Shaped like ChatRow — a 26px avatar, a name line with a timestamp to its
 * right, a preview line under it — because the rail is a fixed 320px column
 * whose rows are the page's only structure until data arrives. A centred
 * "Loading…" leaves that column looking broken rather than busy.
 */

const NAME_WIDTHS = ['62%', '48%', '70%', '40%', '56%', '66%'];
const PREVIEW_WIDTHS = ['88%', '64%', '95%', '72%', '80%', '58%'];

export function ChatRowsSkeleton({ rows = 7, label = 'Loading conversations' }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex gap-2.5 px-3 py-2.5 border-b border-[var(--ui-border-hairline)]"
        >
          <Skeleton width={26} height={26} radius="var(--ui-radius-pill)" />

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton width={NAME_WIDTHS[i % NAME_WIDTHS.length]} height={10} />
              {/* The timestamp column is right-aligned in a real row; holding
                  its width here keeps the name line from re-flowing. */}
              <Skeleton width={30} height={8} className="ml-auto shrink-0" />
            </div>
            <Skeleton width={PREVIEW_WIDTHS[i % PREVIEW_WIDTHS.length]} height={9} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatRowsSkeleton;
