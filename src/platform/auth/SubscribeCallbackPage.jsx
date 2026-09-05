import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from 'src/platform/billing/useSubscription';
import { AuthShell, WelcomeAside } from './AuthShell.jsx';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

/**
 * Return target after Cashfree's hosted one-time-Order checkout (the
 * `returnUrl` the backend registers when creating the order). Cashfree's
 * redirect tells us nothing authoritative about the outcome — the payment
 * is only actually confirmed once our webhook processes it and flips the
 * access status to 'active' — so this page just polls GET /subscriptions/me
 * until that happens (or a webhook-lag timeout).
 */
export default function SubscribeCallbackPage() {
  const navigate = useNavigate();
  const { status, refetch } = useSubscription();
  const [timedOut, setTimedOut] = useState(false);
  // Set in an effect, not during render: Date.now() in the render body is
  // re-evaluated on every render (only the first value is kept) and makes the
  // render impure, which is unsafe under concurrent rendering.
  const startedAt = useRef(null);

  useEffect(() => {
    if (startedAt.current === null) startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status?.isActive()) {
      navigate('/onboarding', { replace: true });
      return;
    }

    if (status?.isPastDue()) {
      // A failed or dropped payment lands here as past_due, not active — no
      // separate "declined" state to special-case, /subscribe already
      // renders the right copy for past_due.
      navigate('/subscribe', { replace: true });
      return;
    }

    if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
      setTimedOut(true);
      return;
    }

    const id = setTimeout(refetch, POLL_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [status, refetch, navigate]);

  return (
    <AuthShell aside={<WelcomeAside step={1} total={3} credits={100} />} bodyTop>
      <div className="sp-card">
        <div className="sp-card__head">
          <h2 className="sp-card__title">
            {timedOut ? "Still confirming your payment" : 'Confirming your payment…'}
          </h2>
          <p className="sp-card__sub">
            {timedOut
              ? "This is taking longer than expected. It's safe to wait a little longer, or check back — your payment isn't lost."
              : "Hang tight while we hear back from Cashfree. This only takes a few seconds."}
          </p>
        </div>

        {!timedOut && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <span
              className="sp-spinner"
              style={{ width: 32, height: 32, borderTopColor: 'var(--sp-primary)', borderColor: 'var(--sp-line)' }}
            />
          </div>
        )}

        {timedOut && (
          <button
            type="button"
            className="sp-btn sp-btn--primary"
            onClick={() => {
              setTimedOut(false);
              startedAt.current = Date.now();
              refetch();
            }}
          >
            Check again
          </button>
        )}

        <button
          type="button"
          className="sp-btn sp-btn--ghost"
          onClick={() => navigate('/subscribe', { replace: true })}
          style={{ marginTop: 8 }}
        >
          Back to subscribe
        </button>
      </div>
    </AuthShell>
  );
}
