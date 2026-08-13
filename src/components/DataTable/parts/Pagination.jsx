import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton, Button } from 'src/ui/primitives';

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

  return (
    <div className="flex items-center justify-between gap-4 px-3 h-11 shrink-0 border-t border-[var(--ui-border-hairline)]">
      <p className="text-[12px] text-[var(--ui-text-tertiary)] tabular-nums shrink-0">
        {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
      </p>

      <div className="flex items-center gap-0.5">
        <IconButton
          size="sm"
          label="Previous page"
          icon={<ChevronLeft size={15} />}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        />
        {buildPages(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="px-1 text-[12px] text-[var(--ui-text-tertiary)]" aria-hidden="true">
              …
            </span>
          ) : (
            <Button
              key={p}
              size="sm"
              variant={page === p ? 'accentSoft' : 'ghost'}
              onClick={() => onPageChange(p)}
              aria-current={page === p ? 'page' : undefined}
              className="min-w-7 tabular-nums px-1.5"
            >
              {p}
            </Button>
          ),
        )}
        <IconButton
          size="sm"
          label="Next page"
          icon={<ChevronRight size={15} />}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        />
      </div>

      {onPageSizeChange ? (
        <label className="flex items-center gap-1.5 shrink-0">
          <span className="text-[12px] text-[var(--ui-text-tertiary)]">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            className="h-7 pl-2 pr-6 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] text-[12px] text-[var(--ui-text-primary)] cursor-pointer hover:border-[var(--ui-border-strong)] focus:outline-none focus:border-[var(--ui-accent)] transition-colors"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span className="shrink-0" />
      )}
    </div>
  );
}
