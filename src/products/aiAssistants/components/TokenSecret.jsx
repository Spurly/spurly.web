import { useState } from 'react';
import { Button, Dialog } from 'src/core/primitives';

/** Shown once, right after creation. The plaintext token is not retrievable afterwards. */
export function TokenSecret({ secret, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(secret.secret).then(() => setCopied(true));
  };
  return (
    <Dialog
      open={Boolean(secret)}
      onClose={onClose}
      closeOnBackdrop={false}
      title="Copy your token now"
      description={`“${secret?.name}” is created. This is the only time you will see it.`}
      footer={<Button variant="primary" onClick={onClose}>Done</Button>}
    >
      <div className="flex flex-col gap-3">
        <code className="block break-all rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-sunken,var(--ui-surface-card))] p-3 text-[length:var(--ui-t-body)]" data-testid="token-secret">
          {secret?.secret}
        </code>
        <Button variant="secondary" onClick={copy}>{copied ? 'Copied' : 'Copy token'}</Button>
      </div>
    </Dialog>
  );
}
