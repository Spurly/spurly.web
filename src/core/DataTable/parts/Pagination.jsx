import { ChevronLeftIcon, ChevronRightIcon } from 'src/core/icons';

/**
 * Builds a page window with ellipses, always including first and last, so the
 * control keeps a stable width instead of growing with the page count.
 */
function buildPages(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const withGaps = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) withGaps.push('gap-' + p);
    withGaps.push(p);
  });
  return withGaps;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  /* v3 (Leads v2): a 48px band, mono range on the left, 28px mono page
     buttons in the middle (current page on the accent tint), and a mono
     ROWS picker on the right. */
  const pageBtn =
    'min-w-7 h-7 px-[7px] rounded-[var(--ui-radius-sm)] font-[family-name:var(--ui-font-mono)] tabular-nums text-[length:var(--ui-t-meta)] ' +
    'transition-colors duration-[140ms] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]';
  const arrowBtn =
    'grid place-items-center w-7 h-7 rounded-[var(--ui-radius-sm)] text-[var(--ui-text-secondary)] transition-colors duration-[140ms] ' +
    'hover:bg-[var(--ui-surface-rail-hover)] hover:text-[var(--ui-text-primary)] ' +
    'disabled:text-[var(--ui-text-disabled)] disabled:cursor-not-allowed disabled:hover:bg-transparent ' +
    'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]';

  return (
    <div className="flex items-center justify-between gap-3 shrink-0 h-12 px-[var(--ui-card-x)] border-t border-[var(--ui-neutral-150)] bg-[var(--ui-surface-card)]">
      <p className="ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)] whitespace-nowrap shrink-0">
        {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
      </p>

      <div className="flex items-center gap-0.5" role="group" aria-label="Pagination">
        <button
          type="button"
          aria-label="Previous page"
          className={arrowBtn}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeftIcon size={15} strokeWidth={2} />
        </button>
        {buildPages(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="px-1 ui-num text-[length:var(--ui-t-meta)] text-[var(--ui-text-disabled)]" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={page === p ? 'page' : undefined}
              className={[
                pageBtn,
                page === p
                  ? 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] font-medium'
                  : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-rail-hover)] hover:text-[var(--ui-text-primary)]',
              ].join(' ')}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Next page"
          className={arrowBtn}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRightIcon size={15} strokeWidth={2} />
        </button>
      </div>

      {onPageSizeChange ? (
        <label className="flex items-center gap-[7px] shrink-0">
          <span className="ui-micro !text-[var(--ui-text-secondary)] !tracking-[var(--ui-track-meta)]">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            className="h-7 pl-[9px] pr-6 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-body)] cursor-pointer hover:border-[var(--ui-accent-border)] focus:outline-none focus:border-[var(--ui-accent)] transition-colors"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span className="shrink-0 w-px" />
      )}
    </div>
  );
}
