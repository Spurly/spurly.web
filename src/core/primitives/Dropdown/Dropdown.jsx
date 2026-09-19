import { useEffect, useState, useRef } from 'react';

/**
 * Reusable custom dropdown select component.
 *
 * Props:
 * - id         — HTML id for the trigger button
 * - icon       — optional leading icon (ReactNode)
 * - value      — currently selected value
 * - onChange   — called with the selected value string
 * - placeholder— placeholder text when nothing is selected
 * - options    — array of [value, label] tuples
 * - error      — boolean, shows error border state
 * - variant    — 'auth' (plain CSS) | 'dashboard' (Tailwind). Default: 'auth'
 * - size       — 'md' (form field, 44px) | 'sm' (table toolbar, 32px, matches
 *                Button/Input size="sm"). 'dashboard' variant only.
 * - disabled   — boolean, closes and blocks opening the menu
 * - title      — native title tooltip on the trigger
 * - ariaLabel  — accessible name for the trigger, when there's no visible label
 * - className  — additional class on the wrapper
 */
export function Dropdown({
  id,
  icon,
  value,
  onChange,
  placeholder = 'Select one',
  options = [],
  error = false,
  variant = 'auth',
  size = 'md',
  disabled = false,
  title,
  ariaLabel,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const selectedLabel = options.find(([v]) => v === value)?.[1];

  function pick(val) {
    onChange(val);
    setOpen(false);
  }

  // Auth variant — uses .sp-dropdown classes from auth.css
  if (variant === 'auth') {
    return (
      <div
        className={`sp-dropdown${open ? ' is-open' : ''}${error ? ' is-error' : ''} ${className}`}
        ref={wrapRef}
      >
        <button
          type="button"
          id={id}
          disabled={disabled}
          title={title}
          aria-label={ariaLabel}
          className={`sp-dropdown__trigger${value ? '' : ' placeholder'}${icon ? ' has-left' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {icon && <span className="sp-dropdown__icon">{icon}</span>}
          <span className="sp-dropdown__value">{selectedLabel || placeholder}</span>
          <span className="sp-dropdown__chevron">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
        </button>
        {open && (
          <ul className="sp-dropdown__menu" role="listbox">
            {options.map(([val, label]) => (
              <li
                key={val}
                className={`sp-dropdown__item${val === value ? ' is-selected' : ''}`}
                role="option"
                aria-selected={val === value}
                onClick={() => pick(val)}
              >
                {label}
                {val === value && (
                  <svg className="sp-dropdown__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Dashboard variant — Tailwind classes matching the app's dashboard design system
  const isSm = size === 'sm';

  return (
    <div className={`relative ${isSm ? 'inline-flex' : 'w-full'} ${className}`} ref={wrapRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        className={[
          isSm ? 'h-[var(--ui-ctl-h)] max-w-[220px]' : 'w-full h-[var(--ui-ctl-h-lg)]',
          icon ? (isSm ? 'pl-8' : 'pl-10') : (isSm ? 'pl-3' : 'pl-4'),
          isSm ? 'pr-7' : 'pr-10',
          'bg-[var(--ui-surface-card)] border text-left tracking-[-0.006em] focus:outline-none transition-colors flex items-center',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          isSm
            ? 'rounded-[var(--ui-radius-sm)] text-[length:var(--ui-t-label)]'
            : 'rounded-[var(--ui-radius-btn)] text-[length:var(--ui-t-body)]',
          error
            ? 'border-[var(--ui-danger)] focus:shadow-[0_0_0_3px_rgba(255,69,58,0.18)]'
            : open
              ? 'border-[var(--ui-accent)] shadow-[var(--ui-focus-ring)]'
              : 'border-[var(--ui-border)] hover:border-[var(--ui-accent-border)] hover:shadow-[var(--ui-hover-ring)]',
          value
            ? (isSm ? 'text-[var(--ui-text-body)]' : 'text-[var(--ui-text-primary)]')
            : (isSm ? 'text-[var(--ui-text-body)]' : 'text-[var(--ui-text-quaternary)]'),
        ].join(' ')}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {icon && (
          <span
            className={`absolute ${isSm ? 'left-2.5' : 'left-3'} top-1/2 -translate-y-1/2 grid place-items-center transition-colors ${open ? 'text-[var(--ui-accent-fg)]' : 'text-[var(--ui-text-tertiary)]'}`}
          >
            {icon}
          </span>
        )}
        <span className="flex-1 truncate">{selectedLabel || placeholder}</span>
        <span
          className={`absolute ${isSm ? 'right-2' : 'right-3'} top-1/2 -translate-y-1/2 grid place-items-center transition-transform ${open ? 'rotate-180 text-[var(--ui-accent-fg)]' : 'text-[var(--ui-text-tertiary)]'}`}
        >
          <svg width={isSm ? 14 : 16} height={isSm ? 14 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </button>
      {open && (
        <ul
          className={[
            'absolute top-[calc(100%+6px)] z-50 bg-[var(--ui-surface-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-popover)] overflow-y-auto sp-pop',
            isSm
              /* right-0, not left-0: this trigger typically sits at the
                 right edge of a toolbar, and a 200px menu growing rightward
                 from there runs off the viewport with nothing to clip it
                 back into view. Anchoring to the trigger's right edge and
                 growing leftward keeps it on-screen. */
              ? 'right-0 min-w-[200px] max-w-[280px] rounded-[var(--ui-radius-md)] p-1 max-h-[280px]'
              : 'left-0 right-0 rounded-[var(--ui-radius-md)] p-1.5 max-h-[240px]',
          ].join(' ')}
          role="listbox"
        >
          {options.map(([val, label]) => (
            <li
              key={val}
              className={[
                'flex items-center justify-between gap-2 rounded-[var(--ui-radius-sm)] cursor-pointer transition-colors truncate',
                isSm ? 'px-2 h-8 text-[length:var(--ui-t-control)]' : 'px-3 h-9 text-[length:var(--ui-t-body)]',
                val === value
                  /* Was var(--accent-subtle, rgba(79,70,229,0.08)). --accent-subtle
                     has never been defined, so every selected dropdown item was
                     rendering the fallback: indigo, from a palette this product
                     stopped using two redesigns ago. Now the standard stateful
                     selected treatment — accent tint, accent text. */
                  ? 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] font-medium'
                  : 'text-[var(--ui-text-body)] hover:bg-[var(--ui-surface-hover)]',
              ].join(' ')}
              role="option"
              aria-selected={val === value}
              onClick={() => pick(val)}
            >
              <span className="truncate">{label}</span>
              {val === value && (
                <svg className="shrink-0" width={isSm ? 13 : 16} height={isSm ? 13 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
