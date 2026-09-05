import { Tooltip } from 'src/ui/primitives';

/**
 * An outbound link rendered as an icon. `stopPropagation` matters: these sit in
 * clickable rows, and without it opening the profile also opens the drawer.
 */
export function LinkCell({ href, icon, label = 'Open link' }) {
  if (!href) return <span className="text-[var(--ui-text-tertiary)]">—</span>;

  return (
    <Tooltip content={label}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={label}
        className="inline-grid place-items-center w-6 h-6 rounded-[var(--ui-radius-xs)] text-[var(--ui-text-tertiary)] hover:text-[var(--ui-accent-fg)] hover:bg-[var(--ui-surface-hover)] transition-colors"
      >
        {icon}
      </a>
    </Tooltip>
  );
}
