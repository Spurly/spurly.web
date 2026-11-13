import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { Button, Checkbox, FilterPills, Input } from 'src/core/primitives';
import { ChevronDownIcon } from 'src/core/icons';
import {
  LEAD_SENIORITY_OPTIONS, LEAD_FUNCTION_OPTIONS, LAST_ACTIVITY_WINDOWS, EMPTY_LEAD_FILTERS, countLeadFilters,
} from 'src/products/leads/constants/constants.js';
import { leadsStrings } from '../strings.js';

const t = leadsStrings.filterMenu;
const TEXT_DEBOUNCE_MS = 350;
const ACTIVITY_PILLS = LAST_ACTIVITY_WINDOWS.map((o) => ({ id: o.value, label: o.label }));

const section = 'flex flex-col gap-2 px-3 py-3 border-b border-[var(--ui-border-hairline)] last:border-b-0';
const sectionLabel = 'text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)]';

/** Hands `local` to `commit` once it has stopped changing for a beat, and only when it differs from what is already applied. */
function useDebouncedCommit(local, applied, commit) {
  useEffect(() => {
    if (local === applied) return undefined;
    const id = setTimeout(() => commit(local), TEXT_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Two-column checkbox grid; `value` is the picked keys. */
function CheckGrid({ options, value, onToggle, label }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-2 gap-x-2 gap-y-0.5 -mx-1.5">
      {options.map((o) => (
        <Checkbox
          key={o.value}
          checked={value.includes(o.value)}
          onChange={() => onToggle(o.value)}
          label={o.label}
          className="min-h-[30px] px-1.5 rounded-[var(--ui-radius-xs)] hover:bg-[var(--ui-surface-hover)]"
        />
      ))}
    </div>
  );
}

/**
 * The Leads table's "Filters ▾" control, beside Degree / Activity / Company: the column filters that are not a plain dropdown.
 *   Title          free text. Synonym-aware on the server: "CTO" also finds "Chief Technical Officer".
 *   Seniority      Founder / C-level / VP / Director / Manager / Senior / Entry (any of the picked).
 *   Function       Engineering, Sales, HR … (any of the picked); reads English and German titles.
 *   Location       free text contains.
 *   Last activity  a date window over the same events the column shows.
 *
 * Like the other toolbar filters it applies the moment you change it (typing waits a beat). `value` is the page's
 * `leadFilters` object (see EMPTY_LEAD_FILTERS) and `onChange` is its state setter, so it is called with an updater function.
 */
export function LeadFilterMenu({ value = EMPTY_LEAD_FILTERS, onChange }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(value.title);
  const [location, setLocation] = useState(value.location);
  const ref = useRef(null);
  const titleRef = useRef(null);
  const active = countLeadFilters(value);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    const focus = setTimeout(() => titleRef.current?.focus(), 0);
    return () => {
      clearTimeout(focus);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const patch = (next) => onChange((prev) => ({ ...prev, ...next }));
  useDebouncedCommit(title, value.title, (text) => patch({ title: text }));
  useDebouncedCommit(location, value.location, (text) => patch({ location: text }));

  const toggle = (key) => (v) => onChange((prev) => ({
    ...prev,
    [key]: prev[key].includes(v) ? prev[key].filter((x) => x !== v) : [...prev[key], v],
  }));
  const clearAll = () => {
    setTitle('');
    setLocation('');
    onChange(EMPTY_LEAD_FILTERS);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <Button
        size="sm"
        variant="secondary"
        aria-label={t.title}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        leadingIcon={<SlidersHorizontal size={13} strokeWidth={2} />}
        trailingIcon={<ChevronDownIcon size={12} strokeWidth={2.2} />}
      >
        <span className="text-[var(--ui-text-quaternary)] font-normal">{t.button}</span>
        <span className="max-w-[160px] truncate">{active > 0 ? active : 'All'}</span>
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label={t.title}
          className="absolute right-0 top-[calc(100%+6px)] z-[var(--ui-z-popover)] w-[340px] max-h-[min(78vh,640px)] overflow-y-auto rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-popover)] sp-pop"
        >
          <div className={section}>
            <div className="flex items-center justify-between">
              <span className={sectionLabel}>{t.titleLabel}</span>
              {active > 0 && (
                <Button size="sm" variant="ghost" onClick={clearAll}>{t.clear}</Button>
              )}
            </div>
            <Input
              ref={titleRef}
              size="sm"
              fullWidth
              leadingIcon={<Search size={13} />}
              value={title}
              placeholder={t.titlePlaceholder}
              aria-label={t.titleLabel}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-[1.45]">{t.titleHint}</p>
          </div>

          <div className={section}>
            <span className={sectionLabel}>{t.seniorityLabel}</span>
            <CheckGrid label={t.seniorityLabel} options={LEAD_SENIORITY_OPTIONS} value={value.seniority} onToggle={toggle('seniority')} />
          </div>

          <div className={section}>
            <span className={sectionLabel}>{t.functionLabel}</span>
            <CheckGrid label={t.functionLabel} options={LEAD_FUNCTION_OPTIONS} value={value.jobFunction} onToggle={toggle('jobFunction')} />
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-[1.45]">{t.groupHint}</p>
          </div>

          <div className={section}>
            <span className={sectionLabel}>{t.locationLabel}</span>
            <Input
              size="sm"
              fullWidth
              leadingIcon={<MapPin size={13} />}
              value={location}
              placeholder={t.locationPlaceholder}
              aria-label={t.locationLabel}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className={section}>
            <span className={sectionLabel}>{t.activityLabel}</span>
            <FilterPills
              size="sm"
              ariaLabel={t.activityLabel}
              options={ACTIVITY_PILLS}
              value={value.lastActivity}
              onChange={(lastActivity) => patch({ lastActivity })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
