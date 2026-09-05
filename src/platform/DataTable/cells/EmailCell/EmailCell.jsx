import { Lock } from 'lucide-react';
import { Tooltip } from 'src/ui/primitives';

export function EmailCell({ value, lockedHint = 'Upgrade to unlock email addresses for your leads.' }) {
  if (!value) {
    return (
      <Tooltip content={lockedHint}>
        <span className="inline-flex items-center gap-1 text-[var(--ui-text-tertiary)] cursor-default">
          <Lock size={11} aria-hidden="true" />
          Locked
        </span>
      </Tooltip>
    );
  }

  return (
    <a
      href={`mailto:${value}`}
      onClick={(e) => e.stopPropagation()}
      className="truncate text-[var(--ui-accent-fg)] hover:underline"
    >
      {value}
    </a>
  );
}
