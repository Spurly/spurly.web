/**
 * A labelled form field: label + input + error message.
 *
 * This is NOT `Input`. `Input` is the bare control (forwardRef, sizes,
 * adornments); `Field` composes a label and error around one. They lived side
 * by side under the same name in two component directories, which is what made
 * the duplication look like duplication — they are different components.
 */
export function Field({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  disabled = false,
  error,
  leadingIcon = null,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-[var(--text-primary)] tracking-[-0.006em]">
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] grid place-items-center">
            {leadingIcon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full h-8 ${leadingIcon ? 'pl-9' : 'pl-3'} pr-3 bg-[var(--ui-surface-card)] border rounded-[var(--ui-radius-sm)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] tracking-[-0.006em] focus:outline-none transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
            error
              ? 'border-[var(--red)] focus:shadow-[0_0_0_3px_var(--ui-danger-tint)]'
              : 'border-[var(--border-default)] focus:border-[var(--ui-accent)] focus:shadow-[var(--ui-focus-ring)]'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[12px] text-[var(--red)] tracking-[-0.006em]">{error}</p>
      )}
    </div>
  );
}
