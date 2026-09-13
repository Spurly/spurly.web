import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DataTable } from 'src/platform/DataTable';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Skeleton } from 'src/ui/primitives';

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
  backTo,
  backLabel,
  sectionTitle,
  bodyRows = 4,
  columns = [],
  label = 'Loading',
}) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label={label}>
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] hover:underline"
      >
        <ArrowLeft size={13} aria-hidden="true" /> {backLabel}
      </Link>

      <SectionCard title={sectionTitle} noPadding>
        <div className="px-[var(--ui-pad-lg)] py-4 flex flex-col gap-3">
          {Array.from({ length: bodyRows }, (_, i) => (
            <Skeleton key={i} width={BODY_WIDTHS[i % BODY_WIDTHS.length]} height={10} />
          ))}
        </div>
      </SectionCard>

      <DataTable columns={columns} data={[]} loading />
    </div>
  );
}

/**
 * The header's own placeholder: the status badge and the start/pause control
 * that both detail pages put in `actions`, at their real sizes. Without it
 * the header band is empty on arrival and then sprouts two controls, which
 * is the one part of the page a reader is looking straight at.
 */
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
