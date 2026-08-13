import { Lock } from 'lucide-react';
import { Tooltip } from 'src/ui/primitives';

export function PhoneCell({ value, lockedHint = 'Upgrade to unlock phone numbers for your leads.' }) {
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
      href={`tel:${value}`}
      onClick={(e) => e.stopPropagation()}
      className="truncate text-[var(--ui-accent-fg)] hover:underline tabular-nums"
    >
      {value}
    </a>
  );
}
