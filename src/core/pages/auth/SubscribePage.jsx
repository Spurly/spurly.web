import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/core/auth/hooks/useAuth';
import { useSubscription } from 'src/core/billing/hooks/useSubscription';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { formatMoney } from 'src/shared/utils/money.js';
import { SUBSCRIPTION_EVENTS } from 'src/core/billing/constants/constants.js';
import { AuthShell, WelcomeAside } from './components/AuthShell.jsx';
import { TrustBadges } from './components/widgets.jsx';
import { StarIcon } from './components/icons.jsx';
import subscriptionsController from 'src/core/billing/controller/subscriptions.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import { postAuthDestination } from './postAuthDestination.js';

const FEATURES = [
  'Unlimited LinkedIn lead capture',
  'Automated outreach & follow-ups',
  'Priority support',
];

const CONFIRM_POLL_MS = 2000;
const CONFIRM_POLLS = 10;

const longDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '';

/**
 * Mandatory paywall. Every account lands here after signup, and SubscribeGate
 * routes here from anywhere under /onboarding or /dashboard whenever access
 * isn't 'active'.
 *
 * Razorpay autopay: ₹2499 or $24.99 a month by region, with a 7-day free trial
 * once per account. Checkout is Razorpay's modal on this page — no redirect —
 * and the backend verifies the result before access flips.
 *
 * Never renders a price or a pay button without pricing from the server.
 */
export default function SubscribePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status, loading: statusLoading, refetch } = useSubscription();
  const toast = useToast();

  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState('');
  // idle → checkout (modal open) → confirming (verified, waiting for /me) → idle
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');

  // Already active (paid in another tab, trialing, comped)? Nothing to do here.
  useEffect(() => {
    if (status?.isActive()) {
      navigate(postAuthDestination(user), { replace: true });
    }
  }, [status, user, navigate]);

  const loadPricing = useCallback(() => {
    setPricingLoading(true);
    setPricingError('');
    const emitter = new EventEmitter();
    subscriptionsController.getPricing(emitter);
    emitter.once(SUBSCRIPTION_EVENTS.GET_PRICING_SUCCESS, (p) => {
      setPricing(p);
      setPricingLoading(false);
    });
    emitter.once(SUBSCRIPTION_EVENTS.GET_PRICING_FAILURE, (err) => {
      setPricing(null);
      setPricingError(getToastError(err, "Couldn't load pricing"));
      setPricingLoading(false);
    });
  }, []);

  useEffect(() => {
    // Indirection keeps react-hooks/set-state-in-effect quiet.
    function run() {
      loadPricing();
    }
    run();
  }, [loadPricing]);

  /**
   * After a verified checkout the backend already reports 'active' in the
   * verify response, but SubscriptionContext is the app-wide source the gates
   * read — refresh it (a few tries, in case Razorpay's read side lags).
   */
  function confirmAccess(attempt = 0) {
    const emitter = refetch();
    emitter.once(SUBSCRIPTION_EVENTS.GET_MY_SUBSCRIPTION_SUCCESS, (summary) => {
      if (summary?.isActive()) return; // the effect above navigates
      if (attempt + 1 >= CONFIRM_POLLS) {
        setPhase('idle');
        setError("Your payment went through but we're still confirming it. Refresh in a minute — you won't be charged twice.");
        return;
      }
      setTimeout(() => confirmAccess(attempt + 1), CONFIRM_POLL_MS);
    });
    emitter.once(SUBSCRIPTION_EVENTS.GET_MY_SUBSCRIPTION_FAILURE, () => {
      setTimeout(() => confirmAccess(attempt + 1), CONFIRM_POLL_MS);
    });
  }

  function onSubscribe() {
    if (!pricing) {
      setError('Pricing is still loading. Please try again in a moment.');
      return;
    }
    setPhase('checkout');
    setError('');
    const emitter = new EventEmitter();
    subscriptionsController.startCheckout(emitter, {
      description: pricing.trialEligible
        ? `${pricing.trialDays}-day free trial, then ${formatMoney(pricing.amount, pricing.currency)}/month`
        : `${formatMoney(pricing.amount, pricing.currency)}/month`,
    });
    emitter.on(SUBSCRIPTION_EVENTS.CHECKOUT_SUCCESS, () => {
      setPhase('confirming');
      confirmAccess();
    });
    emitter.on(SUBSCRIPTION_EVENTS.CHECKOUT_DISMISSED, () => {
      setPhase((p) => (p === 'confirming' ? p : 'idle'));
    });
    emitter.on(SUBSCRIPTION_EVENTS.CHECKOUT_FAILURE, (err) => {
      const msg = getToastError(err, "Couldn't start checkout");
      setError(msg);
      // A failed attempt inside the modal leaves it open for a retry.
      if (!err?.recoverable) {
        setPhase('idle');
        toast.error(msg);
      }
    });
  }

  const isPastDue = status?.isPastDue();
  const loading = statusLoading || pricingLoading;
  const price = pricing ? formatMoney(pricing.amount, pricing.currency) : '';

  function headline() {
    if (isPastDue) return 'Your payment failed — update it to continue';
    if (pricing?.trialEligible) return `Start your ${pricing.trialDays}-day free trial`;
    return 'Subscribe to Spurly';
  }

  function subhead() {
    if (isPastDue) {
      return "We couldn't charge your last renewal, so your account is on hold. Subscribe again with a working card or UPI to continue.";
    }
    if (pricing?.trialEligible) {
      return `Nothing is charged today. Set up autopay now and you'll be billed ${price}/month after ${pricing.trialDays} days — cancel any time before that and you pay nothing.`;
    }
    return 'Activate your account to start capturing leads and automating outreach.';
  }

  function legal() {
    if (pricing.firstChargeAt) {
      return `You still have access until ${longDate(pricing.firstChargeAt)}. Autopay resumes then at ${price}/month. Cancel any time from Settings → Billing.`;
    }
    if (pricing.trialEligible) {
      return `Free for ${pricing.trialDays} days, then ${price} every month, charged automatically. Cancel any time from Settings → Billing — you keep access until the end of what you've paid for.`;
    }
    return `${price} every month, charged automatically. Cancel any time from Settings → Billing — you keep access until the end of the month you've paid for.`;
  }

  const busy = phase !== 'idle';

  return (
    <AuthShell aside={<WelcomeAside step={1} total={3} credits={100} />} bodyTop>
      <div className="sp-card">
        <div className="sp-card__head">
          <h2 className="sp-card__title">{headline()}</h2>
          <p className="sp-card__sub">{subhead()}</p>
        </div>

        {error && (
          <div className="sp-notice sp-notice--error" role="alert" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="sp-form" style={{ alignItems: 'center', justifyItems: 'center', padding: '24px 0' }}>
            <span className="sp-spinner" style={{ borderTopColor: 'var(--sp-primary)', borderColor: 'var(--sp-line)' }} />
          </div>
        ) : !pricing ? (
          <>
            <div className="sp-notice sp-notice--error" role="alert" style={{ marginBottom: 16 }}>
              {pricingError || "Couldn't load pricing."}
            </div>
            <button type="button" className="sp-btn sp-btn--primary" onClick={loadPricing}>
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="sp-price">
              <div className="sp-price__row">
                <span className="sp-price__amount">{price}</span>
                <span className="sp-price__period">/ month</span>
              </div>
              {pricing.trialEligible && (
                <div className="sp-price__then">First {pricing.trialDays} days free</div>
              )}
            </div>

            <ul className="sp-price__features">
              {FEATURES.map((f) => (
                <li key={f}>
                  <StarIcon s={16} /> {f}
                </li>
              ))}
            </ul>

            {!pricing.checkoutAvailable ? (
              <div className="sp-notice sp-notice--info" role="status">
                International checkout opens soon. We'll email you as soon as you can subscribe.
              </div>
            ) : (
              <button type="button" className="sp-btn sp-btn--primary" onClick={onSubscribe} disabled={busy}>
                {phase === 'confirming' ? (
                  <>
                    <span className="sp-spin" /> Confirming…
                  </>
                ) : phase === 'checkout' ? (
                  <>
                    <span className="sp-spin" /> Opening secure checkout…
                  </>
                ) : pricing.trialEligible ? (
                  'Start free trial'
                ) : (
                  `Subscribe · ${price}/month`
                )}
              </button>
            )}

            <p className="sp-legal" style={{ marginTop: 16 }}>
              {legal()}
              {pricing.currency === 'USD' ? ' Pay by card.' : ' Pay by UPI AutoPay, card or bank mandate.'}
            </p>

            <TrustBadges />
          </>
        )}
      </div>
    </AuthShell>
  );
}
