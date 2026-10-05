import { UserCog } from 'lucide-react';
import { Button } from 'src/core/primitives';
import {
  isImpersonating,
  getImpersonatingAdmin,
  exitImpersonation,
} from 'src/shared/utils/impersonation.js';

/**
 * Shown on every page while an admin is logged in as another user (see
 * src/shared/utils/impersonation.js for how the session got swapped).
 * Renders nothing otherwise. Same visual pattern as AccountStatusBanner.
 */
export function ImpersonationBanner() {
  if (!isImpersonating()) return null;

  const admin = getImpersonatingAdmin();

  return (
    <div
      role="alert"
      data-testid="impersonation-banner"
      className="shrink-0 mx-[var(--ui-shell-x)] mt-4 flex items-center gap-3 rounded-[var(--ui-radius-md)] px-3.5 py-2.5"
      style={{ background: 'var(--ui-warning-tint)' }}
    >
      <UserCog size={16} className="shrink-0" style={{ color: 'var(--ui-warning)' }} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
        <span className="font-medium text-[var(--ui-text-primary)]">You're logged in as this user.</span>{' '}
        {admin?.email ? `Signed in as admin ${admin.email}.` : 'Exit to return to your own account.'}
      </div>
      <Button size="sm" onClick={exitImpersonation}>Exit to admin</Button>
    </div>
  );
}
