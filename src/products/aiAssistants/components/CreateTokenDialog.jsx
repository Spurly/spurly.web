import { useState } from 'react';
import { Button, Dialog, Dropdown, Field } from 'src/core/primitives';
import { DEFAULT_SCOPES, EXPIRY_OPTIONS } from '../constants/constants.js';
import { ScopePicker } from './ScopePicker.jsx';

/** Name, permissions, expiry. The token itself is shown by TokenSecret after creation. */
export function CreateTokenDialog({ open, onClose, onCreate, creating }) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState(DEFAULT_SCOPES);
  const [expiry, setExpiry] = useState('90');

  const canSubmit = name.trim().length > 0 && scopes.length > 0 && !creating;
  const submit = () => {
    if (!canSubmit) return;
    onCreate({ name: name.trim(), scopes, expiresInDays: expiry });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create a token"
      description="For assistants that take a token instead of signing in, like Claude Code or Cursor."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit} loading={creating}>Create token</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name" placeholder="Claude Code on my laptop" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        <div className="flex flex-col gap-1.5">
          <span className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">Permissions</span>
          <ScopePicker value={scopes} onChange={setScopes} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">Expires</span>
          <Dropdown variant="dashboard" value={expiry} onChange={setExpiry} options={EXPIRY_OPTIONS} ariaLabel="Expires" />
        </div>
      </div>
    </Dialog>
  );
}
