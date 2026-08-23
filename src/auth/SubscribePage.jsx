import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth';
import { useSubscription } from 'src/hooks/useSubscription';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/common/utils/apiError';
import { AuthShell, WelcomeAside } from './AuthShell.jsx';
import { TrustBadges, PhoneField, phoneIsValid, buildE164 } from './widgets.jsx';
import { DEFAULT_COUNTRY } from './countryCodes.js';
import { StarIcon } from './icons.jsx';
import subscriptionsController from 'src/core/controllers/subscriptionsController.js';
import { loadCashfreeSdk } from './cashfreeSdk.js';

const FEATURES = [
  'Unlimited LinkedIn lead capture',
  'Automated outreach & follow-ups',
  'Priority support',
];

/**
 * Mandatory paywall. Every account lands here immediately after signup —
 * SubscribeGate also routes here from anywhere under /onboarding or
 * /dashboard whenever access isn't 'active'. Nothing past this page is
 * reachable without paying. There's no autopay: every payment, renewals
 * included, is a deliberate action taken here.
 *
 * Gates run in order before the pay button appears:
 *
 *   1. Comped accounts never see a price at all — they already have access
 *      and the gate should have let them through. Handled defensively.
 *   2. Phone gate. Cashfree's Create Order API requires customer_phone.
 *      Accounts created before signup collected it had no way to add one.
 *   3. Pricing must have actually loaded. This page never invents a price:
 *      a failed pricing call shows an error and a retry rather than a
 *      plausible-looking amount beside a live pay button.
 */
export default function SubscribePage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { status, loading: statusLoading, refetch } = useSubscription();
  const toast = useToast();

  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');

  const needsPhone = !user?.phone;
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Promo code the customer typed. `appliedCode` is the one the server has
  // confirmed — kept separate from the input so an in-progress edit can't be
  // mistaken for an applied discount.
  const [showPromo, setShowPromo] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedCode, setAppliedCode] = useState(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Already active (e.g. paid in another tab, or comped)? Nothing to do here.
  useEffect(() => {
    if (status?.isActive()) {
      navigate('/onboarding', { replace: true });
    }
  }, [status, navigate]);

  const loadPricing = useCallback(async (code) => {
    setPricingLoading(true);
    setPricingError('');
    try {
      const p = await subscriptionsController.getPricing(code);
      setPricing(p);
      return p;
    } catch (err) {
      // Leave `pricing` null — the render path refuses to show a price or a
      // pay button without one. A 401 never reaches here: apiGateway's
      // interceptor redirects to /login first, since a dead session isn't
      // something this page can fix.
      setPricing(null);
      setPricingError(getToastError(err, "Couldn't load pricing"));
      return null;
    } finally {
      setPricingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  async function onSavePhone(e) {
    e.preventDefault();
    setPhoneError('');
    if (!phoneIsValid(phoneCountry, phoneNumber)) {
      setPhoneError('Please enter a valid phone number.');
      return;
    }
    setSavingPhone(true);
    try {
      await updateProfile({ phone: buildE164(phoneCountry, phoneNumber) });
      toast.success('Phone number saved');
    } catch (err) {
      setPhoneError(getToastError(err, "Couldn't save your phone number"));
    } finally {
      setSavingPhone(false);
    }
  }

  async function onApplyPromo(e) {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setPromoChecking(true);
    setPromoError('');
    try {
      const result = await subscriptionsController.validatePromo(code);
      setAppliedCode(result.code);
      // Re-fetch pricing with the code so the displayed price comes from the
      // same source the charge will, rather than being patched together
      // client-side from the validation response.
      await loadPricing(result.code);
      toast.success(`${result.code} applied`);
    } catch (err) {
      setAppliedCode(null);
      setPromoError(getToastError(err, "Couldn't apply that code"));
    } finally {
      setPromoChecking(false);
    }
  }

  async function onRemovePromo() {
    setAppliedCode(null);
    setPromoInput('');
    setPromoError('');
    setShowPromo(false);
    await loadPricing();
  }

  async function onSubscribe() {
    // Defensive: the button isn't rendered without pricing, but never let a
    // pay action run against an unknown amount.
    if (!pricing) {
      setError('Pricing is still loading. Please try again in a moment.');
      return;
    }
    setSubscribing(true);
    setError('');
    try {
      const result = await subscriptionsController.createSubscription(appliedCode || undefined);
      if (!result.subscriptionSessionId) {
        throw new Error('Payment session could not be started. Please try again.');
      }
      const cashfree = await loadCashfreeSdk();
      // Navigates the browser to Cashfree's hosted checkout for this
      // one-time Order; on completion Cashfree redirects to
      // /subscribe/callback (the returnUrl the backend registered when
      // creating the order). Nothing after this call runs unless it throws.
      await cashfree.checkout({
        paymentSessionId: result.subscriptionSessionId,
        redirectTarget: '_self',
      });
    } catch (err) {
      const msg = getToastError(err, "Couldn't start checkout");
      setError(msg);
      toast.error(msg);
      setSubscribing(false);
    }
  }

  async function onRefreshStatus() {
    setError('');
    const summary = await refetch();
    if (summary?.isActive()) {
      navigate('/onboarding', { replace: true });
    } else {
      toast.info("Still not active — if you just paid, give it a few seconds and try again.");
    }
  }

  const isPastDue = status?.isPastDue();
  const loading = statusLoading || pricingLoading;

  function headline() {
    if (needsPhone) return 'One more thing before you subscribe';
    if (isPastDue) return 'Your access has ended — pay to continue';
    return 'Subscribe to Spurly';
  }

  function subhead() {
    if (needsPhone) {
      return "We need a phone number on file to process payment — this doesn't affect how you sign in.";
    }
    if (isPastDue) {
      return "Your last payment either didn't go through or your 30-day access window has ended, so your account is on hold until you pay again.";
    }
    return 'Activate your account to start capturing leads and automating outreach.';
  }

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

        {needsPhone ? (
          <form className="sp-form" onSubmit={onSavePhone}>
            {phoneError && (
              <div className="sp-notice sp-notice--error" role="alert">
                {phoneError}
              </div>
            )}

            <div className="sp-field">
              <label className="sp-label" htmlFor="sub-phone">Phone Number</label>
              <PhoneField
                id="sub-phone"
                country={phoneCountry}
                number={phoneNumber}
                onCountryChange={setPhoneCountry}
                onNumberChange={setPhoneNumber}
                error={!!phoneError}
              />
            </div>

            <button type="submit" className="sp-btn sp-btn--primary" disabled={savingPhone}>
              {savingPhone ? (
                <>
                  <span className="sp-spin" /> Saving…
                </>
              ) : (
                'Save and continue'
              )}
            </button>
          </form>
        ) : loading ? (
          <div
            className="sp-form"
            style={{ alignItems: 'center', justifyItems: 'center', padding: '24px 0' }}
          >
            <span
              className="sp-spinner"
              style={{ borderTopColor: 'var(--sp-primary)', borderColor: 'var(--sp-line)' }}
            />
          </div>
        ) : !pricing ? (
          /* Pricing failed to load — show why and offer a retry. Deliberately
             no price and no pay button: a checkout screen showing an amount we
             couldn't confirm is worse than an honest error. */
          <>
            <div className="sp-notice sp-notice--error" role="alert" style={{ marginBottom: 16 }}>
              {pricingError || "Couldn't load pricing."}
            </div>
            <button type="button" className="sp-btn sp-btn--primary" onClick={() => loadPricing()}>
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="sp-price">
              {pricing.hasDiscount() ? (
                <>
                  <div className="sp-price__row">
                    <span className="sp-price__was">₹{pricing.baseAmount}</span>
                    <span className="sp-price__amount">₹{pricing.firstCycleAmount}</span>
                    <span className="sp-price__period">
                      {pricing.isFirstTime ? 'first month' : '/ 30 days'}
                    </span>
                  </div>
                  <div className="sp-price__then">
                    {pricing.appliedPromoCode} applied — you save ₹{pricing.savings()}
                    {pricing.isFirstTime ? `, then ₹${pricing.baseAmount} for each 30-day period after` : ''}
                  </div>
                </>
              ) : (
                <div className="sp-price__row">
                  <span className="sp-price__amount">₹{pricing.baseAmount}</span>
                  <span className="sp-price__period">/ 30 days</span>
                </div>
              )}
            </div>

            <ul className="sp-price__features">
              {FEATURES.map((f) => (
                <li key={f}>
                  <StarIcon s={16} /> {f}
                </li>
              ))}
            </ul>

            {/* Promo entry. Collapsed by default: most people arrive without a
                code, and an empty box invites hunting for one that doesn't
                exist. The auto-applied intro price needs no input at all. */}
            <div className="sp-promo">
              {appliedCode ? (
                <div className="sp-promo__applied">
                  <span className="sp-promo__tag">{appliedCode}</span>
                  <button type="button" className="sp-promo__remove" onClick={onRemovePromo}>
                    Remove
                  </button>
                </div>
              ) : showPromo ? (
                <form className="sp-promo__form" onSubmit={onApplyPromo}>
                  <input
                    type="text"
                    className="sp-input sp-promo__input"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    autoComplete="off"
                    autoFocus
                    aria-label="Promo code"
                  />
                  <button
                    type="submit"
                    className="sp-btn sp-btn--ghost sp-promo__apply"
                    disabled={promoChecking || !promoInput.trim()}
                  >
                    {promoChecking ? 'Checking…' : 'Apply'}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className="sp-promo__toggle"
                  onClick={() => setShowPromo(true)}
                >
                  Have a promo code?
                </button>
              )}

              {promoError && (
                <p className="sp-promo__error" role="alert">
                  {promoError}
                </p>
              )}
            </div>

            <button
              type="button"
              className="sp-btn sp-btn--primary"
              onClick={onSubscribe}
              disabled={subscribing}
            >
              {subscribing ? (
                <>
                  <span className="sp-spin" /> Redirecting to payment…
                </>
              ) : isPastDue ? (
                'Pay now'
              ) : (
                'Subscribe & continue'
              )}
            </button>

            <button
              type="button"
              className="sp-btn sp-btn--ghost"
              onClick={onRefreshStatus}
              style={{ marginTop: 2 }}
            >
              Already paid? Refresh status
            </button>

            <p className="sp-legal" style={{ marginTop: 16 }}>
              Gives you 30 days of access from the moment payment completes.
              There's no autopay — we'll ask you to pay again when it ends.
            </p>

            <TrustBadges />
          </>
        )}
      </div>
    </AuthShell>
  );
}
