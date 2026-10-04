/** Centered note shown over a chart whose range holds no activity yet. */
export function ChartEmpty({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-center text-center px-6 ${className}`}>
      <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] max-w-[320px] leading-[1.5]">{children}</p>
    </div>
  );
}
