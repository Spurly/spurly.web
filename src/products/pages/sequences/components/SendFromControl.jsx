import { useState } from 'react';
import { Button, Checkbox } from 'src/core/primitives';
import { sequencesStrings } from '../strings.js';

const t = sequencesStrings.new;

/**
 * "Send from": optionally choose several accounts for a new sequence. Only rendered for an organization member with
 * two or more accounts; a solo user and a single-account organization see nothing here.
 */
export function SendFromControl({ pool }) {
  const [open, setOpen] = useState(false);
  const { accounts, selected, toggle, validation } = pool;
  return (
    <div className="flex flex-col gap-1.5" data-testid="send-from">
      <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {selected.length > 0 ? `${t.sendFrom}: ${selected.length} accounts` : t.sendFromToggle}
      </Button>
      {open && (
        <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] p-3 space-y-1.5">
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.sendFromHint}</p>
          {accounts.map((a) => (
            <Checkbox key={a.id} checked={selected.includes(String(a.id))} onChange={() => toggle(a.id)} label={a.name || a.publicIdentifier || 'LinkedIn account'} />
          ))}
          {selected.length > 0 && !validation.ok && (
            <p role="status" className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.sendFromBlocked}</p>
          )}
        </div>
      )}
    </div>
  );
}
