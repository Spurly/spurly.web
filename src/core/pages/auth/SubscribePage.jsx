import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import PartnerEndedPage from 'src/core/pages/partner/PartnerEndedPage.jsx';
import { ENDED_REASONS } from 'src/core/partner/constants/constants.js';
import { postAuthDestination } from './postAuthDestination.js';

const FEATURES = [
  'Unlimited LinkedIn lead capture',
  'Automated outreach & follow-ups',
  'Priority support',
];

const CONFIRM_POLL_MS = 2000;
const CONFIRM_POLLS = 10;
// Mirrors the backend's PROMO_CODE_MAX_LENGTH: nothing longer can be a code.
const PROMO_CODE_MAX_LENGTH = 40;

const longDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '';

/**
 * Mandatory paywall. Every account lands here after signup, and SubscribeGate
 * routes here from anywhere under /onboarding or /dashboard whenever access
 * isn't 'active'.
 *
 * Razorpay autopay: launch offer ₹1,499 or $14.99 a month by region (regular ₹2,499 / $24.99), charged at
 * checkout. There is no free trial for new accounts; the trial copy below
 * only serves accounts created before it was removed. Checkout is Razorpay's modal on this page — no redirect —
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
  const onTrial = Boolean(status?.isAppTrial());
  const trialEnded = Boolean(status?.isTrialEnded());

  // Promo code: a hidden-until-asked box. The server decides whether the code
  // is valid and the account eligible; this page only relays its answer.
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoError, setPromoError] = useState('');
  // The code was accepted; we leave for the app as soon as the app-wide
  // status (what the gates read) shows the trial as active.
  const [trialStarted, setTrialStarted] = useState(false);
  const promoInputRef = useRef(null);

  // Already active (paid in another tab, comped)? Nothing to do here. A user
  // on the FREE TRIAL is active too but may be here on purpose (the "Add
  // payment" banner), so they stay until they have actually paid.
  const settled = (s) => Boolean(s?.isActive() && !s.isAppTrial());
  useEffect(() => {
    // A promo trial is active but not "settled"; once the code was accepted
    // AND the status shows it, go — the gates would bounce us back otherwise.
    if (settled(status) || (trialStarted && status?.isActive())) {
      navigate(postAuthDestination(user), { replace: true });
    }
  }, [status, user, navigate, trialStarted]);

  useEffect(() => {
    if (promoOpen) promoInputRef.current?.focus();
  }, [promoOpen]);

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
      if (settled(summary)) return; // the effect above navigates
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
        : onTrial
          ? `Free until ${longDate(pricing.firstChargeAt || status.trialEndsAt)}, then ${formatMoney(pricing.amount, pricing.currency)}/month`
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

  function onApplyPromo(event) {
    event.preventDefault();
    if (promoApplying || phase !== 'idle') return;
    const code = promoCode.trim();
    if (!code) {
      setPromoError('Enter a promo code.');
      return;
    }
    setPromoApplying(true);
    setPromoError('');
    const emitter = new EventEmitter();
    subscriptionsController.redeemPromoCode(emitter, code);
    emitter.once(SUBSCRIPTION_EVENTS.PROMO_REDEEM_SUCCESS, () => {
      toast.success('Promo code applied — your free trial has started');
      // The gates read SubscriptionContext, so let it learn about the trial
      // before we leave (the effect above navigates once it is active).
      const refreshed = refetch();
      refreshed.once(SUBSCRIPTION_EVENTS.GET_MY_SUBSCRIPTION_SUCCESS, (summary) => {
        if (summary?.isActive()) {
          setTrialStarted(true);
          return;
        }
        setPromoApplying(false);
        setPromoError('Your promo code was applied, but your account has not updated yet. Reload the page to continue.');
      });
      refreshed.once(SUBSCRIPTION_EVENTS.GET_MY_SUBSCRIPTION_FAILURE, () => {
        setPromoApplying(false);
        setPromoError('Your promo code was applied, but we could not refresh your account. Reload the page to continue.');
      });
    });
    emitter.once(SUBSCRIPTION_EVENTS.PROMO_REDEEM_FAILURE, (err) => {
      setPromoApplying(false);
      setPromoError(getToastError(err, "Couldn't apply that promo code"));
    });
  }

  const isPastDue = status?.isPastDue();
  const loading = statusLoading || pricingLoading;
  const price = pricing ? formatMoney(pricing.amount, pricing.currency) : '';

  function headline() {
    if (isPastDue) return 'Your payment failed — update it to continue';
    if (onTrial) return 'Add payment to keep going after your trial';
    if (trialEnded) return 'Your free trial has ended';
    if (pricing?.trialEligible) return `Start your ${pricing.trialDays}-day free trial`;
    return 'Subscribe to Spurly';
  }

  function subhead() {
    if (isPastDue) {
      return "We couldn't charge your last renewal, so your account is on hold. Subscribe again with a working card or UPI to continue.";
    }
    if (onTrial) {
      return `You're on the free trial until ${longDate(status.trialEndsAt)}. Add a payment method now and nothing is charged today — your first payment of ${price} is on that date.`;
    }
    if (trialEnded) {
      return 'Subscribe to pick up right where you left off. Your leads, campaigns and conversations are all still here — after you pay, we\'ll ask you to reconnect your LinkedIn account.';
    }
    if (pricing?.trialEligible) {
      return `Nothing is charged today. Set up autopay now and you'll be billed ${price}/month after ${pricing.trialDays} days — cancel any time before that and you pay nothing.`;
    }
    return 'Activate your account to start capturing leads and automating outreach.';
  }

  function legal() {
    if (onTrial && pricing.firstChargeAt) {
      return `Free until ${longDate(pricing.firstChargeAt)}, then ${price} every month, charged automatically. Cancel any time from Settings → Billing.`;
    }
    if (pricing.firstChargeAt) {
      return `You still have access until ${longDate(pricing.firstChargeAt)}. Autopay resumes then at ${price}/month. Cancel any time from Settings → Billing.`;
    }
    if (pricing.trialEligible) {
      return `Free for ${pricing.trialDays} days, then ${price} every month, charged automatically. Cancel any time from Settings → Billing — you keep access until the end of what you've paid for.`;
    }
    return `${price} every month, charged automatically. Cancel any time from Settings → Billing — you keep access until the end of the month you've paid for.`;
  }

  const busy = phase !== 'idle';
  // Only an account that has never had a trial or a subscription can redeem
  // (the server enforces it); these are just the screens where offering the
  // box would be pointless.
  const showPromo = Boolean(pricing) && !onTrial && !trialEnded && !isPastDue && !pricing.exempt && !pricing.firstChargeAt;

  // A managed account never sees a paywall: its access is handled elsewhere.
  if (user?.isManaged) return <PartnerEndedPage reason={ENDED_REASONS.ACCESS} />;

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
              {onTrial && <div className="sp-price__then">Free until {longDate(status.trialEndsAt)}</div>}
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
              <button type="button" className="sp-btn sp-btn--primary" onClick={onSubscribe} disabled={busy || promoApplying}>
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
                ) : onTrial ? (
                  `Add payment · ${price}/month from ${longDate(pricing.firstChargeAt || status.trialEndsAt)}`
                ) : (
                  `Subscribe · ${price}/month`
                )}
              </button>
            )}

            {onTrial && (
              <Link
                to={postAuthDestination(user)}
                replace
                className="sp-btn sp-btn--ghost"
                style={{ marginTop: 8, textAlign: 'center' }}
              >
                Maybe later
              </Link>
            )}

            {showPromo && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                {!promoOpen ? (
                  <button type="button" className="sp-link" onClick={() => setPromoOpen(true)} disabled={busy}>
                    Have a promo code?
                  </button>
                ) : (
                  <form className="sp-promo" onSubmit={onApplyPromo} noValidate style={{ textAlign: 'left' }}>
                    <div className="sp-promo__row">
                      <input
                        ref={promoInputRef}
                        className={`sp-input${promoError ? ' is-error' : ''}`}
                        type="text"
                        name="promo-code"
                        aria-label="Promo code"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          if (promoError) setPromoError('');
                        }}
                        maxLength={PROMO_CODE_MAX_LENGTH}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        disabled={promoApplying || busy}
                      />
                      <button
                        type="submit"
                        className="sp-btn sp-btn--ghost"
                        disabled={promoApplying || busy || !promoCode.trim()}
                      >
                        {promoApplying ? (
                          <>
                            <span className="sp-spin" /> Applying…
                          </>
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                    {promoError && (
                      <div className="sp-field__err" role="alert">
                        {promoError}
                      </div>
                    )}
                  </form>
                )}
              </div>
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
