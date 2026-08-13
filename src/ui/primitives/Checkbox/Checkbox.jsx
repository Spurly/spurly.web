import { useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';

/**
 * Checkbox with a real <input> underneath for keyboard and screen readers, and
 * a drawn box on top so it can be styled consistently across browsers.
 * `accentColor` (what the old one used) can't be sized or given a radius.
 */
export function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  className = '',
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  const active = checked || indeterminate;

  return (
    <label
      className={[
        'inline-flex items-center gap-2 select-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative grid place-items-center shrink-0" style={{ width: 15, height: 15 }}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer absolute inset-0 opacity-0 cursor-[inherit] m-0"
          {...rest}
        />
        <span
          aria-hidden="true"
          className={[
            'w-full h-full grid place-items-center rounded-[var(--ui-radius-xs)] border',
            'transition-[background-color,border-color] duration-[var(--ui-dur-fast)] ease-[cubic-bezier(0.2,0,0.1,1)]',
            active
              ? 'bg-[var(--ui-accent)] border-[var(--ui-accent)] text-white'
              : 'bg-[var(--ui-surface-card)] border-[var(--ui-border-strong)]',
            'peer-focus-visible:shadow-[var(--ui-focus-ring)]',
          ].join(' ')}
        >
          {indeterminate && !checked ? (
            <Minus size={11} strokeWidth={3} />
          ) : checked ? (
            <Check size={11} strokeWidth={3} />
          ) : null}
        </span>
      </span>
      {label && <span className="text-[13px] text-[var(--ui-text-primary)]">{label}</span>}
    </label>
  );
}
