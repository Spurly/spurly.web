import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, CheckIcon } from 'src/core/icons';

const DEGREE_OPTIONS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
];

/**
 * The table's "Degree ▾" filter — multi-select on connectionDegree, same
 * popover shape as AudiencePicker.
 *
 * Server-side (GET /hub/leads?connectionDegree=1,2), not a re-filter of
 * whatever page is already in memory: the table is paginated, so filtering
 * only the loaded page would silently hide matches sitting on other pages.
 * `value` is a plain array of numbers (1/2/3); the caller (useLeadsPage)
 * joins it into the comma-separated string the server expects.
 */
export function DegreeFilter({ value = [], onChange, label = 'Filter by degree' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  const toggle = (val) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const summary =
    value.length === 0
      ? 'All'
      : DEGREE_OPTIONS.filter((o) => value.includes(o.value)).map((o) => o.label).join(', ');

  const row =
    'w-full flex items-center gap-2.5 min-h-[36px] px-2 py-1.5 rounded-[var(--ui-radius-xs)] text-left transition-colors duration-[140ms] hover:bg-[var(--ui-surface-hover)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]';

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
        <span className="text-[var(--ui-text-quaternary)]">Degree</span>
        <span className="max-w-[140px] truncate">{summary}</span>
        <ChevronDownIcon size={12} strokeWidth={2.2} className="text-[var(--ui-neutral-400)]" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute right-0 top-[calc(100%+6px)] z-[var(--ui-z-popover)] w-[180px] p-1.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-popover)] sp-pop"
        >
          {DEGREE_OPTIONS.map((opt) => {
            const selected = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => toggle(opt.value)}
                className={row}
              >
                <span className="flex-1 text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)]">
                  {opt.label} connections
                </span>
                {selected && <CheckIcon size={14} strokeWidth={2.4} className="text-[var(--ui-accent)] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
