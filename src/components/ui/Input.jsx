/**
 * Input Component
 * Text input matching Spurly brand
 */

export function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  disabled = false,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-label font-medium text-spurly-navy-light">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-spurly-surface-bg border border-spurly-border rounded-spurly text-spurly-navy-light placeholder-spurly-text-secondary focus:outline-none focus:border-spurly-purple focus:ring-2 focus:ring-spurly-purple/20 transition disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-spurly-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-label text-spurly-error">{error}</p>}
    </div>
  );
}
