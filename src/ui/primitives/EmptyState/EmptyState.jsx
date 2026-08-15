/**
 * Empty state. An invitation, not an apology — headline names the space, hint
 * explains it, action is a verb. Used by the table and by page bodies.
 */
export function EmptyState({ icon = null, title, hint, action = null, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-16'}`}>
      {icon && (
        <span
          className="mb-3 grid place-items-center w-9 h-9 rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-sunken)] text-[var(--ui-text-tertiary)]"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <p className="text-[14px] font-medium text-[var(--ui-text-primary)]">{title}</p>
      {hint && <p className="mt-1 text-[12px] text-[var(--ui-text-tertiary)] max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
