import { DataTable } from 'src/core/DataTable';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Skeleton } from 'src/core/primitives';

/**
 * The loading state for the hub detail pages (one campaign, one sequence).
 *
 * Both are the same page in outline — a back link, one SectionCard holding
 * the thing you edit, then a table of who is in it — so the placeholder is
 * one component, given the section title and the table's columns by the page
 * that renders it.
 *
 * The table is the REAL DataTable in its loading state rather than a
 * hand-drawn imitation: it already skeletons its own rows, and it draws the
 * actual column headers at their actual widths, so the header row is true
 * information while the body is a placeholder — and when the data lands not
 * one column moves.
 *
 * The back link is a real link, not a grey bar. It works the moment the page
 * paints, which matters most on the slow load that put the reader here.
 */

/* Uneven so the block reads as a paragraph rather than a stack of bars. */
const BODY_WIDTHS = ['92%', '78%', '86%', '54%'];

export function DetailPageSkeleton({
  sectionTitle,
  bodyRows = 4,
  columns = [],
  label = 'Loading',
}) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label={label}>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-4 pt-4 pb-3.5 flex flex-col gap-3">
            <Skeleton width={84} height={8} />
            <Skeleton width={56} height={20} />
            <Skeleton width="100%" height={3} />
          </div>
        ))}
      </div>

      {sectionTitle && (
        <SectionCard title={sectionTitle}>
          <div className="flex flex-col gap-3">
            {Array.from({ length: bodyRows }, (_, i) => (
              <Skeleton key={i} width={BODY_WIDTHS[i % BODY_WIDTHS.length]} height={10} />
            ))}
          </div>
        </SectionCard>
      )}

      <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] overflow-hidden">
        <DataTable columns={columns} data={[]} loading stickyHeader={false} />
      </div>
    </div>
  );
}

export function DetailActionsSkeleton() {
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <Skeleton width={56} height={24} radius="var(--ui-radius-xs)" />
      <Skeleton width={96} height={32} radius="var(--ui-radius-sm)" />
    </span>
  );
}

/** The subtitle is a live count line, so it gets a bar of about its width. */
export function DetailSubtitleSkeleton() {
  return <Skeleton width={180} height={9} />;
}

export default DetailPageSkeleton;
