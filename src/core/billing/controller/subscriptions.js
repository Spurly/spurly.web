import subscriptionsGateway from '../gateway/subscriptions.js';
import { loadRazorpaySdk } from '../gateway/razorpaySdk.js';
import { SUBSCRIPTION_EVENTS } from '../constants/constants.js';

/**
 * Subscriptions Controller
 * Orchestrates the paywall: pricing, Razorpay autopay checkout, cancel, and
 * status. The only layer (with the gateway) allowed async/await + try/catch —
 * pages subscribe to the events below.
 */

async function getPricing(eventEmitter) {
  try {
    const pricing = await subscriptionsGateway.getPricing();
    eventEmitter.emit(SUBSCRIPTION_EVENTS.GET_PRICING_SUCCESS, pricing);
  } catch (error) {
    eventEmitter.emit(SUBSCRIPTION_EVENTS.GET_PRICING_FAILURE, error);
  }
}

/**
 * Creates the Razorpay subscription, opens Razorpay Checkout on this page
 * (modal, no redirect), and verifies the handler's signature server-side.
 *
 * Emits exactly one of:
 *   CHECKOUT_SUCCESS(summary)  — verified; summary is the fresh /me payload
 *   CHECKOUT_DISMISSED         — user closed the modal
 *   CHECKOUT_FAILURE(error)    — couldn't start, payment failed, or verify failed
 *
 * A payment.failed inside the modal is reported but the modal stays open —
 * Razorpay lets the user retry with another method, and a later success
 * still emits CHECKOUT_SUCCESS.
 *
 * @param {object} [opts]
 * @param {string} [opts.description] - line shown in the modal header
 */
async function startCheckout(eventEmitter, opts = {}) {
  try {
    const created = await subscriptionsGateway.createSubscription();
    if (!created.keyId || !created.subscriptionId) {
      throw new Error('Payment could not be started. Please try again.');
    }
    const Razorpay = await loadRazorpaySdk();
    // Razorpay wants a literal colour; read the app's accent token so the
    // modal matches light and dark themes without a hardcoded value.
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--ui-accent').trim();

    const checkout = new Razorpay({
      key: created.keyId,
      subscription_id: created.subscriptionId,
      name: 'Spurly',
      description: opts.description || 'Monthly subscription',
      prefill: created.prefill,
      ...(accent ? { theme: { color: accent } } : {}),
      handler: async (response) => {
        try {
          const summary = await subscriptionsGateway.verifyPayment(response);
          eventEmitter.emit(SUBSCRIPTION_EVENTS.CHECKOUT_SUCCESS, summary);
        } catch (error) {
          eventEmitter.emit(SUBSCRIPTION_EVENTS.CHECKOUT_FAILURE, error);
        }
      },
      modal: {
        ondismiss: () => eventEmitter.emit(SUBSCRIPTION_EVENTS.CHECKOUT_DISMISSED),
      },
    });

    checkout.on('payment.failed', (resp) => {
      const message =
        resp?.error?.description || 'Payment failed. Try another card or UPI app.';
      eventEmitter.emit(SUBSCRIPTION_EVENTS.CHECKOUT_FAILURE, { message, recoverable: true });
    });

    checkout.open();
  } catch (error) {
    eventEmitter.emit(SUBSCRIPTION_EVENTS.CHECKOUT_FAILURE, error);
  }
}

/** Stop autopay; access runs to the end of the paid period (or trial end). */
async function cancelSubscription(eventEmitter) {
  try {
    const summary = await subscriptionsGateway.cancelSubscription();
    eventEmitter.emit(SUBSCRIPTION_EVENTS.CANCEL_SUCCESS, summary);
  } catch (error) {
    eventEmitter.emit(SUBSCRIPTION_EVENTS.CANCEL_FAILURE, error);
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
  startCheckout,
  cancelSubscription,
  getMySubscription,
};

export default subscriptionsController;
