export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-spurly-surface-bg text-spurly-navy-light',
    success: 'bg-spurly-success/10 text-spurly-success',
    warning: 'bg-spurly-warning/10 text-spurly-warning',
    error: 'bg-spurly-error/10 text-spurly-error',
    primary: 'bg-spurly-purple/10 text-spurly-purple',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-spurly text-label font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}
