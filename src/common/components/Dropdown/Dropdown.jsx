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
  return (
    <div className={`relative w-full ${className}`} ref={wrapRef}>
      <button
        type="button"
        id={id}
        className={`w-full h-11 ${icon ? 'pl-10' : 'pl-4'} pr-10 bg-[var(--surface-sunken)] border rounded-[12px] text-[14px] text-left tracking-[-0.006em] focus:outline-none transition-all flex items-center ${
          error
            ? 'border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(255,69,58,0.18)]'
            : open
              ? 'border-[var(--accent)] shadow-[0_0_0_3px_var(--focus-ring)]'
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
        } ${value ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {icon && (
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center transition-colors ${open ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
            {icon}
          </span>
        )}
        <span className="flex-1 truncate">{selectedLabel || placeholder}</span>
        <span className={`absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center transition-transform ${open ? 'rotate-180 text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </button>
      {open && (
        <ul className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[12px] p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] max-h-[240px] overflow-y-auto animate-[fadeSlideDown_0.15s_ease]" role="listbox">
          {options.map(([val, label]) => (
            <li
              key={val}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-[8px] text-[14px] cursor-pointer transition-colors ${
                val === value
                  ? 'bg-[var(--accent-subtle,rgba(79,70,229,0.08))] text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
              role="option"
              aria-selected={val === value}
              onClick={() => pick(val)}
            >
              {label}
              {val === value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
