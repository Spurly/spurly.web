import { useState } from 'react';
import { Button, Dialog } from 'src/core/primitives';
import { nodeError } from 'src/products/sequences/treeModel.js';
import { ConfigFields } from '../SequenceFlowBuilder.jsx';

/**
 * "Fix now": the person decides what kind of wait goes in front of the message: until the invitation is accepted (with the
 * longest it may wait), or a fixed number of days. Nothing is added until they confirm. Mounted only while open.
 */
export function FixWaitDialog({ where, saving, onClose, onConfirm }) {
  const [config, setConfig] = useState({ mode: 'until-accepted', days: 2, maxDays: 7 });
  const problem = nodeError({ type: 'wait', config });
  const step = { type: 'wait', config };
  const summary = config.mode === 'until-accepted'
    ? `Waits until they accept, for at most ${config.maxDays || '…'} day(s). If they have not accepted by then, they stop here.`
    : `Waits ${config.days || '…'} day(s), then sends the message, whether or not they accepted. Someone who has not accepted by then is held until they do.`;
  return (
    <Dialog
      open
      onClose={() => { if (!saving) onClose(); }}
      title="Add a wait before the message"
      description="Choose how long people wait after the connection request. It goes right before the message, in this branch only. People already past this point are not affected."
      size="md"
      closeOnBackdrop={!saving}
      closeOnEscape={!saving}
      footer={(
        <>
          <Button variant="ghost" size="sm" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={saving || !!problem} loading={saving} title={problem || undefined} onClick={() => onConfirm(where, config)}>Add wait</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-3">
        <ConfigFields step={step} onConfigChange={(patch) => setConfig((cur) => ({ ...cur, ...patch }))} disabled={saving} />
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.5]">{summary}</p>
        {problem && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{problem}</p>}
      </div>
    </Dialog>
  );
}

export default FixWaitDialog;
