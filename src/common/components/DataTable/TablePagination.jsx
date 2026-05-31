/**
 * Server-side pagination footer.
 * Matches the existing CapturedLeads pagination styling.
 */
export function TablePagination({
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

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => page + i - 2).filter(
    (p) => p >= 1 && p <= totalPages
  );

  return (
    <div className="bg-white border-t border-spurly-border px-6 py-4 flex items-center justify-between">
      <p className="text-label text-spurly-text-secondary">
        {start}-{end} of {total} results
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition text-spurly-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ←
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-2 rounded-spurly transition text-label font-medium ${
              page === p
                ? 'bg-spurly-purple text-white'
                : 'hover:bg-spurly-surface-bg text-spurly-navy-light'
            }`}
          >
            {p}
          </button>
        ))}
        {totalPages > 5 && <span className="px-3 py-2 text-spurly-text-secondary">...</span>}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition text-spurly-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>

      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-label text-spurly-text-secondary">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            className="px-3 py-2 rounded-spurly border border-spurly-border text-label font-medium text-spurly-navy-light"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
