/**
 * The handoff's toggle: 34×20 track, 16px knob, accent when on. A real
 * checkbox underneath (role="switch"), so keyboard and screen readers get it
 * for free.
 */
export function Switch({ checked = false, onChange, disabled = false, label, className = '' }) {
  return (
    <label className={`relative inline-flex shrink-0 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}>
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={`w-[34px] h-5 rounded-full transition-colors duration-[var(--ui-dur-fast)] peer-focus-visible:shadow-[var(--ui-focus-ring)] ${
          checked ? 'bg-[var(--ui-accent)]' : 'bg-[var(--ui-border-strong)]'
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[var(--ui-surface-card)] shadow-[0_1px_2px_rgba(10,18,32,0.25)] transition-transform duration-[var(--ui-dur-base)] ease-[cubic-bezier(.32,.72,0,1)] ${
          checked ? 'translate-x-[14px]' : ''
        }`}
      />
    </label>
  );
}

/** A bordered row: title + one-line reason on the left, a Switch on the right. */
export function SwitchRow({ title, hint, checked, onChange, disabled, soon = null }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-primary)]">
          {title}
          {soon}
        </p>
        {hint && <p className="mt-0.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.45]">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} />
    </div>
  );
}
