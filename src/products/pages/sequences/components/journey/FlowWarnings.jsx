import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Tooltip } from 'src/core/primitives';
import { STEP_TYPE_MAP } from 'src/products/sequences/stepTypes.js';
import { splitLetter } from 'src/products/sequences/journeyModel.js';
import { FixWaitDialog } from './FixWaitDialog.jsx';

const WHY = 'This message goes out right after the connection request. LinkedIn only lets you message connections, so the engine holds it until the invitation is accepted (up to 7 days). Adding a wait makes that pause visible and lets you choose how long it lasts.';

/**
 * One line per message that follows a connection request directly, with a "Fix now" button. The explanation lives in the
 * tooltip. "Fix now" asks what kind of wait to add and only then edits the plan, and only while the sequence is paused
 * (nobody is mid-step then); everyone already on a step stays where they are.
 */
export function FlowWarnings({ lints, steps, splitIds, paused, saving, onInsert }) {
  const [open, setOpen] = useState(null);
  if (!lints.length) return null;
  return (
    <>
      <ul className="flex flex-col gap-1.5" aria-label="Flow suggestions">
        {lints.map((l) => {
          const step = steps.find((s) => s.id === l.stepId);
          const side = l.branch && splitIds.has(l.parentId) ? ` (${splitLetter(l.branch)} branch)` : '';
          const label = STEP_TYPE_MAP[step?.type]?.label ?? 'Send a message';
          return (
            <li key={l.stepId} className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--ui-radius-md)] bg-[var(--ui-warning-tint)] text-[length:var(--ui-t-label)] text-[var(--ui-warning-fg)]">
              <AlertTriangle size={14} aria-hidden="true" className="shrink-0" />
              <Tooltip content={WHY} placement="bottom">
                <span className="flex-1 min-w-0 cursor-help" tabIndex={0}>{label}{side} comes right after the connection request</span>
              </Tooltip>
              <Button size="sm" variant="secondary" disabled={!paused || saving} title={paused ? undefined : 'Pause the sequence to change its flow'} onClick={() => setOpen({ parentId: l.parentId, branch: l.branch, index: l.index })}>
                Fix now
              </Button>
            </li>
          );
        })}
      </ul>
      {open && (
        <FixWaitDialog
          where={open}
          saving={saving}
          onClose={() => setOpen(null)}
          onConfirm={(where, config) => { onInsert(where, config); setOpen(null); }}
        />
      )}
    </>
  );
}

export default FlowWarnings;
