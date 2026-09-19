/**
 * Empty state. An invitation, not an apology — headline names the space, hint
 * explains it, action is a verb. Used by the table and by page bodies.
 *
 * v3: the icon sits in a 52px accent-washed tile (Leads v2 empty state), the
 * headline is the 15px title step and the hint wraps at ~46ch so it reads as
 * one sentence rather than a banner.
 */
export function EmptyState({ icon = null, title, hint, action = null, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 ${
        compact ? 'py-10' : 'pt-[60px] pb-[68px]'
      }`}
    >
      {icon && (
        <span
          className="mb-3.5 grid place-items-center w-[52px] h-[52px] rounded-[var(--ui-radius-lg)] bg-[var(--ui-accent-wash)] border border-[var(--ui-accent-tint-strong)] text-[var(--ui-accent)]"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <p className="text-[length:var(--ui-t-title)] font-medium text-[var(--ui-text-primary)]">{title}</p>
      {hint && (
        <p className="mt-1.5 text-[length:var(--ui-t-control)] leading-[1.55] text-[var(--ui-text-secondary)] max-w-[46ch]">
          {hint}
        </p>
      )}
      {action && <div className="mt-[18px] flex items-center gap-2">{action}</div>}
    </div>
  );
}
