import { useState } from 'react';
import { Ban } from 'lucide-react';
import { Button, Dialog } from 'src/core/primitives';
import { activeExitCount, exitError } from 'src/products/sequences/treeModel.js';
import { ExitRulesPanel } from './ExitRulesPanel.jsx';
import { sequencesStrings } from '../strings.js';

const t = sequencesStrings.exit;

/**
 * Stop rules live behind a button instead of taking up the top of the page: they are a once-per-sequence choice,
 * and the canvas is what people come here to work on. The rules are still per sequence (stored as the sequence's `exit`).
 */
export function StopRulesButton({ exit = {}, onChange, inbox = true, isOrg = false, readOnly = false }) {
  const [open, setOpen] = useState(false);
  const count = activeExitCount(exit, { inbox, isOrg });
  const invalid = !!exitError(exit);
  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        leadingIcon={<Ban size={13} aria-hidden="true" />}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {t.title}
        {count > 0 && (
          <span className="ml-1.5 inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] text-[length:var(--ui-t-meta)] ui-num" aria-label={`${count} on`}>
            {count}
          </span>
        )}
        {invalid && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[var(--ui-danger)]" aria-label="Needs attention" />}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t.title}
        description={t.dialogDescription}
        size="sm"
        footer={<Button onClick={() => setOpen(false)}>{t.done}</Button>}
      >
        <ExitRulesPanel bare exit={exit} onChange={onChange} inbox={inbox} isOrg={isOrg} readOnly={readOnly} />
      </Dialog>
    </>
  );
}

export default StopRulesButton;
