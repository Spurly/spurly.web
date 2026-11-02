import { useEffect, useRef, useState } from 'react';
import { Search, X, Building2 } from 'lucide-react';
import { ChevronDownIcon, CheckIcon } from 'src/core/icons';
import { Button, Input } from 'src/core/primitives';
import { CompanyCell } from 'src/core/DataTable';
import { useCompanyOptions } from 'src/products/leads/hooks/useCompanyOptions.js';

/**
 * The Leads table's "Company ▾" filter — multi-select over every company in
 * the user's leads, with how many leads work at each.
 *
 * Async and paginated, never a fixed list: a lead book of thousands spans
 * thousands of companies. The popover searches on the server as you type and
 * loads the next page when the list is scrolled near its end (infinite
 * scroll). Picked companies stay pinned at the top even when the current
 * search would not return them, so a selection never silently disappears.
 *
 * `value` is an array of exact company names; useLeadsPage sends them to
 * GET /hub/leads as companies[]. Server-side for the same reason as every
 * other filter here: the table is paginated.
 */
export function CompanyFilter({ value = [], onChange, searchId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const { query, setQuery, items, hasMore, loading, error, loadMore } = useCompanyOptions({ enabled: open, searchId });

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // A short first page can leave nothing to scroll — keep loading until the
  // list overflows or the server says there is nothing more.
  useEffect(() => {
    const el = listRef.current;
    if (!open || !el || loading || !hasMore || items.length === 0) return;
    if (el.scrollHeight <= el.clientHeight + 4) loadMore();
  }, [open, items.length, loading, hasMore, loadMore]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) loadMore();
  };

  const toggle = (name) => onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name]);

  const selectedSet = new Set(value);
  const rest = items.filter((c) => !selectedSet.has(c.name));
  const pinned = value.map((name) => items.find((c) => c.name === name) || { name, count: null });

  const summary =
    value.length === 0 ? 'All' : value.length === 1 ? value[0] : `${value[0]} +${value.length - 1}`;

  const option = (c) => {
    const selected = selectedSet.has(c.name);
    return (
      <div
        key={c.name}
        role="option"
        aria-selected={selected}
        tabIndex={0}
        onClick={() => toggle(c.name)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle(c.name);
          }
        }}
        className="flex items-center gap-2 min-h-[36px] px-2 rounded-[var(--ui-radius-xs)] cursor-pointer select-none hover:bg-[var(--ui-surface-hover)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
      >
        <span
          aria-hidden="true"
          className={[
            'w-4 h-4 shrink-0 rounded-[4px] border-[1.5px] grid place-items-center',
            selected ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)] text-[var(--ui-accent-on)]' : 'border-[var(--ui-border)]',
          ].join(' ')}
        >
          {selected && <CheckIcon size={10} strokeWidth={3} />}
        </span>
        <span className="flex-1 min-w-0 pointer-events-none">
          <CompanyCell value={c.name} density="compact" />
        </span>
        {c.count != null && (
          <span className="shrink-0 ui-num text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">{c.count.toLocaleString()}</span>
        )}
      </div>
    );
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <Button
        size="sm"
        variant="secondary"
        role="combobox"
        aria-label="Filter by company"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        trailingIcon={<ChevronDownIcon size={12} strokeWidth={2.2} />}
      >
        <span className="text-[var(--ui-text-quaternary)] font-normal">Company</span>
        <span className="max-w-[160px] truncate">{summary}</span>
      </Button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[var(--ui-z-popover)] w-[300px] rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-popover)] sp-pop flex flex-col">
          <div className="p-2 border-b border-[var(--ui-border-hairline)]">
            <Input
              ref={searchRef}
              size="sm"
              fullWidth
              leadingIcon={<Search size={13} />}
              placeholder="Search companies"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search companies"
            />
          </div>

          <div
            ref={listRef}
            role="listbox"
            aria-multiselectable="true"
            aria-busy={loading}
            onScroll={onScroll}
            className="max-h-[320px] overflow-y-auto p-1.5"
          >
            {pinned.length > 0 && (
              <>
                {pinned.map(option)}
                {rest.length > 0 && <div className="my-1.5 h-px bg-[var(--ui-border-hairline)]" />}
              </>
            )}
            {rest.map(option)}

            {loading && (
              <div className="flex flex-col gap-1.5 px-2 py-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-3.5 rounded bg-[var(--ui-surface-sunken)] animate-pulse" style={{ width: `${70 - i * 12}%` }} />
                ))}
              </div>
            )}
            {!loading && error && (
              <div className="flex items-center justify-between gap-2 px-2 py-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                {error}
                <Button size="sm" variant="ghost" onClick={loadMore}>Retry</Button>
              </div>
            )}
            {!loading && !error && items.length === 0 && pinned.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 px-3 py-6 text-center">
                <Building2 size={18} className="text-[var(--ui-text-quaternary)]" />
                <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                  {query ? `No company matches “${query}”` : 'No companies on your leads yet'}
                </p>
              </div>
            )}
          </div>

          {value.length > 0 && (
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 border-t border-[var(--ui-border-hairline)]">
              <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">{value.length} selected</span>
              <Button size="sm" variant="ghost" leadingIcon={<X size={12} />} onClick={() => onChange([])}>
                Clear
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
