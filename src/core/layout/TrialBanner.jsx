import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Button } from 'src/core/primitives';
import { SubscriptionContext } from 'src/core/billing/hooks/SubscriptionContext.jsx';
import { trialDaysLeft } from 'src/core/billing/trialDaysLeft.js';

/**
 * "You're on the free trial" — shown on every dashboard page while the user is
 * using Spurly without a subscription. There is no card on file, so nothing is
 * charged until they choose to pay; the banner is the reminder that access
 * ends (and LinkedIn disconnects) when the trial does.
 *
 * Reads SubscriptionContext directly rather than via useSubscription(): the
 * layout renders where no provider exists (page tests), and the hook throws
 * there — correctly, for a gate. A banner is not a gate.
 *
 * Renders nothing for anyone who is not in the app trial (paying, comped,
 * locked out), so callers need no status logic.
 */
export function TrialBanner() {
  const subscription = useContext(SubscriptionContext);
  const navigate = useNavigate();
  const status = subscription?.status;
  if (!status?.appTrial || !status.trialEndsAt) return null;

  const days = trialDaysLeft(status.trialEndsAt);
  const when = days <= 0 ? 'ends today' : days === 1 ? '1 day left' : `${days} days left`;

  return (
    <div
      role="status"
      data-testid="trial-banner"
      className="shrink-0 mx-[var(--ui-shell-x)] mt-4 flex items-center gap-3 rounded-[var(--ui-radius-md)] px-3.5 py-2.5"
      style={{ background: 'var(--ui-accent-tint)' }}
    >
      <Clock size={16} className="shrink-0" style={{ color: 'var(--ui-accent)' }} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
        <span className="font-medium text-[var(--ui-text-primary)]">Free trial: {when}.</span>{' '}
        Add a payment method to keep going — you won’t be charged until the trial ends.
      </div>
      <Button size="sm" onClick={() => navigate('/subscribe')}>Add payment</Button>
    </div>
  );
}

export default TrialBanner;
