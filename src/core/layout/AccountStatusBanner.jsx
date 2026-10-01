import { Link2Off } from 'lucide-react';
import { Button } from 'src/core/primitives';

/**
 * The LinkedIn connection needs the user, on every page of the app (plan M7
 * row 2). The settings card already explains this, but only to someone who
 * goes there; the sidebar summary the shell already polls says when, and this
 * is what they see.
 *
 * Copy per vendor status. There is no separate "checkpoint" status: LinkedIn
 * asking for a code or a confirmation arrives as CREDENTIALS, and the
 * reconnect flow is where it is completed, so one button covers both.
 *
 * Rendered nothing when `attention` is null (healthy, setting up, never
 * connected, or disconnected on purpose; the server decides, see
 * unipileAccount/attention.js), so callers need no status logic of their own.
 */
export const ACCOUNT_BANNER_COPY = {
  CREDENTIALS: {
    title: 'LinkedIn needs you to reconnect',
    body: 'LinkedIn ended the session or asked for a check. Nothing will send until you reconnect.',
  },
  STOPPED: {
    title: 'Your LinkedIn connection stopped',
    body: 'It stopped unexpectedly. Reconnect to resume sending.',
  },
  DELETED: {
    title: 'Your LinkedIn account was disconnected',
    body: 'It was removed on LinkedIn’s side. Your leads and campaigns are kept; reconnect to send again.',
  },
};

const HINT = {
  cookies: 'This happens when you sign out of the browser you connected from.',
  credentials: 'This happens when the session is revoked in LinkedIn’s settings.',
};

export function AccountStatusBanner({ attention, onReconnect }) {
  if (!attention || attention.kind !== 'reconnect') return null;

  const copy = ACCOUNT_BANNER_COPY[attention.status] ?? ACCOUNT_BANNER_COPY.STOPPED;
  const hint = HINT[attention.connectionMethod];

  return (
    <div
      role="alert"
      data-testid="account-status-banner"
      className="shrink-0 mx-[var(--ui-shell-x)] mt-4 flex items-center gap-3 rounded-[var(--ui-radius-md)] px-3.5 py-2.5"
      style={{ background: 'var(--ui-warning-tint)' }}
    >
      <Link2Off size={16} className="shrink-0" style={{ color: 'var(--ui-warning)' }} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
        <span className="font-medium text-[var(--ui-text-primary)]">{copy.title}.</span>{' '}
        {copy.body}
        {hint ? ` ${hint}` : ''}
      </div>
      <Button size="sm" onClick={onReconnect}>Reconnect</Button>
    </div>
  );
}

export default AccountStatusBanner;
