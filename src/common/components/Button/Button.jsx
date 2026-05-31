/**
 * Button Component
 * Primary & Secondary variants matching Spurly brand
 */

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseStyles = 'px-4 py-3 rounded-spurly font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-gradient-to-r from-spurly-purple to-spurly-blue text-white hover:shadow-spurly-md active:scale-95',
    secondary: 'bg-spurly-surface-bg border border-spurly-border text-spurly-navy-light hover:bg-gray-100',
    ghost: 'text-spurly-purple hover:bg-spurly-surface-bg',
    danger: 'bg-spurly-error text-white hover:bg-red-600',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
