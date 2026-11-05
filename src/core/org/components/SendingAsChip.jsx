import { useSendingAs } from '../hooks/useSendingAs.js';
import { ORG_COPY } from '../constants/constants.js';

/**
 * "Sending as <account>": shown on every create flow that sends from a LinkedIn account (campaign and sequence
 * creation). It cannot be removed or edited here; the account is changed with "Acting as" in the sidebar. For a member
 * with several accounts and none in effect it says what to do instead. Solo users see nothing.
 */
export function SendingAsChip({ className = '' }) {
  const sending = useSendingAs();
  if (!sending.isOrg || (!sending.name && !sending.needsPick)) return null;
  return (
    <span
      data-testid="sending-as"
      className={`inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--ui-border-hairline)] px-2.5 py-1 text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)] ${className}`}
    >
      {sending.needsPick ? ORG_COPY.sendingAs.pick : (
        <>
          {ORG_COPY.sendingAs.label}
          <strong className="truncate font-medium text-[var(--ui-text-primary)]">{sending.name}</strong>
        </>
      )}
    </span>
  );
}
