import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, CheckIcon, TrashIcon } from 'src/core/icons';
import { Badge, IconButton } from 'src/core/primitives';
import { RotateCw } from 'lucide-react';
import { isBusy, describeSearch } from 'src/products/leads/hooks/audience.js';
import { StoppedShortNotice } from './AudienceList.jsx';

const STATUS_VIEW = {
  queued: { label: 'Queued', tone: 'neutral' },
  running: { label: 'Importing', tone: 'accent' },
  done: { label: 'Imported', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
};

/**
 * The table's list picker — the handoff's "List  EU logistics ▾" control.
 *
 * Choosing a list filters the table (same `activeSearchId` the old dropdown
 * drove). The popover is also where a saved audience is MANAGED now that the
 * bottom dock is gone: its import status, its count, re-run and remove — the
 * same `runSearch` / `deleteSearch` the dock's list used.
 */
export function AudiencePicker({ searches, activeSearchId, onChange, onRun, onDelete, label = 'Filter by list' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = searches.find((s) => s._id === activeSearchId) ?? null;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (id) => {
    onChange(id);
    setOpen(false);
  };
  const failed = searches.find((s) => s.error) ?? null;

  const row =
    'group w-full flex items-center gap-2.5 min-h-[40px] px-2 py-1.5 rounded-[var(--ui-radius-xs)] text-left transition-colors duration-[140ms] hover:bg-[var(--ui-surface-hover)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]';

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-[7px] h-[var(--ui-ctl-h)] px-2.5 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] text-[length:var(--ui-t-label)] text-[var(--ui-text-body)] whitespace-nowrap transition-[border-color,box-shadow] duration-[var(--ui-dur-fast)] hover:border-[var(--ui-accent-border)] hover:shadow-[var(--ui-hover-ring)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
      >
        <span className="text-[var(--ui-text-quaternary)]">List</span>
        <span className="max-w-[180px] truncate">{active ? active.name || 'Untitled audience' : 'All people'}</span>
        <ChevronDownIcon size={12} strokeWidth={2.2} className="text-[var(--ui-neutral-400)]" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-[var(--ui-z-popover)] w-[360px] max-h-[420px] overflow-y-auto p-1.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-popover)] sp-pop"
        >
          <button type="button" role="option" aria-selected={!activeSearchId} onClick={() => pick(null)} className={row}>
            <span className="flex-1 text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)]">All people</span>
            {!activeSearchId && <CheckIcon size={14} strokeWidth={2.4} className="text-[var(--ui-accent)]" />}
          </button>

          {searches.length > 0 && (
            <p className="ui-micro !text-[var(--ui-text-secondary)] mx-2 mt-2 mb-1">Saved audiences</p>
          )}
          {failed && (
            <div className="mx-0.5 mb-1 rounded-[var(--ui-radius-xs)] overflow-hidden">
              <StoppedShortNotice search={failed} />
            </div>
          )}
          {searches.map((s) => {
            const view = STATUS_VIEW[s.status] ?? STATUS_VIEW.queued;
            const selected = s._id === activeSearchId;
            return (
              <div key={s._id} className={`${row} !p-0 pr-1`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => pick(s._id)}
                  aria-label={s.name || 'Untitled audience'}
                  className="flex-1 min-w-0 flex items-center gap-2.5 px-2 py-1.5 text-left focus:outline-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)]">
                      {s.name || 'Untitled audience'}
                    </span>
                    <span className="block truncate font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)]">
                      {(s.importedCount ?? 0).toLocaleString()} leads · {describeSearch(s)}
                    </span>
                  </span>
                  <Badge tone={view.tone} dot pulse={isBusy(s)} size="sm">
                    {view.label}
                  </Badge>
                  {selected && <CheckIcon size={14} strokeWidth={2.4} className="text-[var(--ui-accent)] shrink-0" />}
                </button>
                <IconButton
                  size="sm"
                  variant="ghost"
                  label={s.status === 'done' ? 'Check for new people' : 'Resume this import'}
                  icon={<RotateCw size={13} />}
                  disabled={isBusy(s)}
                  onClick={() => onRun(s)}
                  className="!w-7 !h-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                />
                <IconButton
                  size="sm"
                  variant="ghost"
                  label="Remove this audience"
                  icon={<TrashIcon size={13} />}
                  onClick={() => onDelete(s)}
                  className="!w-7 !h-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:!text-[var(--ui-danger-fg)] hover:!bg-[var(--ui-danger-tint)]"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
