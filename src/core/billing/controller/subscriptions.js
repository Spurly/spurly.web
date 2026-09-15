import subscriptionsGateway from '../gateway/subscriptions.js';
import { loadCashfreeSdk } from 'src/core/auth/gateway/cashfreeSdk.js';
import { SUBSCRIPTION_EVENTS } from '../constants/constants.js';

/**
 * Subscriptions Controller
 * Orchestrates the paywall / one-time payment flow. Thin on purpose —
 * there's no local state to reconcile here (unlike auth's token +
 * localStorage bookkeeping), so most methods are a direct pass-through to
 * the API layer. Kept as its own controller rather than folded into
 * authController because billing is deliberately unrelated to
 * auth/onboarding — see SubscriptionContext for the app-wide status cache.
 *
 * @param {string} [code] - optional promo code to preview
 */
async function getPricing(eventEmitter, code) {
  try {
    const pricing = await subscriptionsGateway.getPricing(code);
    eventEmitter.emit(SUBSCRIPTION_EVENTS.GET_PRICING_SUCCESS, pricing);
  } catch (error) {
    eventEmitter.emit(SUBSCRIPTION_EVENTS.GET_PRICING_FAILURE, error);
  }
}

/**
 * @param {string} code
 */
async function validatePromo(eventEmitter, code) {
  try {
    const result = await subscriptionsGateway.validatePromo(code);
    eventEmitter.emit(SUBSCRIPTION_EVENTS.VALIDATE_PROMO_SUCCESS, result);
  } catch (error) {
    eventEmitter.emit(SUBSCRIPTION_EVENTS.VALIDATE_PROMO_FAILURE, error);
  }
}

/**
 * Creates the payment order and hands off to Cashfree's hosted checkout.
 * A successful checkout navigates the browser away before this resolves —
 * the SUCCESS event only ever fires for a redirectTarget other than '_self'
 * or a checkout call that resolves without navigating. FAILURE is the event
 * callers actually need to handle.
 * @param {string} [code] - optional promo code to apply
 */
async function startCheckout(eventEmitter, code) {
  try {
    const result = await subscriptionsGateway.createSubscription(code);
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
    eventEmitter.emit(SUBSCRIPTION_EVENTS.CREATE_SUBSCRIPTION_SUCCESS, result);
  } catch (error) {
    eventEmitter.emit(SUBSCRIPTION_EVENTS.CREATE_SUBSCRIPTION_FAILURE, error);
  }
}

async function getMySubscription(eventEmitter) {
  try {
    const summary = await subscriptionsGateway.getMySubscription();
    eventEmitter.emit(SUBSCRIPTION_EVENTS.GET_MY_SUBSCRIPTION_SUCCESS, summary);
  } catch (error) {
    eventEmitter.emit(SUBSCRIPTION_EVENTS.GET_MY_SUBSCRIPTION_FAILURE, error);
  }
}

const subscriptionsController = {
  getPricing,
  validatePromo,
  startCheckout,
  getMySubscription,
};

export default subscriptionsController;
