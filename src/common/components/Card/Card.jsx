/**
 * Card Component
 * Soft layered cards matching Spurly brand
 */

export function Card({
  children,
  className = '',
  ...props
}) {
  return (
    <div
      className={`bg-white border border-spurly-border rounded-spurly-lg shadow-spurly p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header
 */
export function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

/**
 * Card Title
 */
export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-dashboard-title text-spurly-navy-light ${className}`}>{children}</h3>;
}

/**
 * Card Content
 */
export function CardContent({ children, className = '' }) {
  return <div className={`${className}`}>{children}</div>;
}
