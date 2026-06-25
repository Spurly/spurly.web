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

  const navBtn =
    'w-8 h-8 grid place-items-center rounded-[9px] text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="glass-chrome border-t border-[var(--separator)] px-5 py-3 flex items-center justify-between">
      <p className="text-[12px] text-[var(--text-tertiary)] tabular-nums">
        {start}–{end} of {total}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${navBtn} text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]`}
        >
          ←
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${navBtn} ${
              page === p
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            {p}
          </button>
        ))}
        {totalPages > 5 && (
          <span className="px-2 text-[var(--text-tertiary)] text-[12px]">…</span>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`${navBtn} text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]`}
        >
          →
        </button>
      </div>

      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--text-tertiary)]">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            className="h-7 px-2 rounded-[8px] border border-[var(--border-hairline)] text-[12px] font-medium text-[var(--text-primary)] bg-[var(--surface-card)] focus:outline-none focus:border-[var(--accent)]"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
