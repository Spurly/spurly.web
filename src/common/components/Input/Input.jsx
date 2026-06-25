export function Input({
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
        <label className="text-[13px] font-semibold text-[var(--text-primary)] tracking-[-0.006em]">
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] grid place-items-center">
            {leadingIcon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full h-11 ${leadingIcon ? 'pl-10' : 'pl-4'} pr-4 bg-[var(--surface-sunken)] border rounded-[12px] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] tracking-[-0.006em] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? 'border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(255,69,58,0.18)]'
              : 'border-[var(--border-default)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]'
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
