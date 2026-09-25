import apiGateway from 'src/shared/gateway/apiGateway.js';
import {
  SubscriptionsApiResponse,
  PricingInfo,
  SubscriptionCreateResult,
  SubscriptionSummary,
} from '../entities/Subscription.js';

/**
 * Subscriptions Gateway
 * Handles all /subscriptions/* calls (the mandatory paywall and the
 * Razorpay autopay subscription). Layer between the controller and the gateway — mirrors
 * authApi.js's shape and error handling exactly.
 */

/**
 * Handle and format errors
 */
function handleError(error) {
  if (error.status === 0) {
    return {
      status: 0,
      message: 'Cannot reach server - check your connection',
      code: 'NETWORK_ERROR',
    };
  }

  if (error.message) {
    return {
      status: error.status || 500,
      message: error.message,
      code: error.code || 'ERROR',
    };
  }

  return {
    status: 500,
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

async function unwrap(request) {
  const response = await request;
  const wrapped = SubscriptionsApiResponse.fromResponse(response.data);
  if (!wrapped.success) {
    throw new Error(wrapped.message);
  }
  return wrapped.data;
}

/**
 * Monthly price for this user's region + trial eligibility.
 * GET /subscriptions/pricing
 * @returns {Promise<PricingInfo>}
 */
async function getPricing() {
  try {
    return PricingInfo.fromResponse(await unwrap(apiGateway.get('/subscriptions/pricing')));
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Start a Razorpay subscription. Price, region and trial are decided
 * server-side; the result is what Razorpay Checkout needs to open.
 * POST /subscriptions
 * @returns {Promise<SubscriptionCreateResult>}
 */
async function createSubscription() {
  try {
    return SubscriptionCreateResult.fromResponse(await unwrap(apiGateway.post('/subscriptions', {})));
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Hand the checkout handler's three fields to the backend for signature
 * verification. Returns the fresh status summary.
 * POST /subscriptions/verify
 * @returns {Promise<SubscriptionSummary>}
 */
async function verifyPayment({ razorpay_payment_id, razorpay_subscription_id, razorpay_signature }) {
  try {
    const data = await unwrap(
      apiGateway.post('/subscriptions/verify', {
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
      })
    );
    return SubscriptionSummary.fromResponse(data);
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Stop autopay. Access continues to the end of the paid period.
 * POST /subscriptions/cancel
 * @returns {Promise<SubscriptionSummary>}
 */
async function cancelSubscription() {
  try {
    return SubscriptionSummary.fromResponse(await unwrap(apiGateway.post('/subscriptions/cancel', {})));
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Current subscription status — polled to decide whether to show the
 * paywall (initial gate, and again after Razorpay checkout).
 * GET /subscriptions/me
 * @returns {Promise<SubscriptionSummary>}
 */
async function getMySubscription() {
  try {
    const response = await apiGateway.get('/subscriptions/me');
    const wrapped = SubscriptionsApiResponse.fromResponse(response.data);
    if (!wrapped.success) {
      throw new Error(wrapped.message);
    }
    return SubscriptionSummary.fromResponse(wrapped.data);
  } catch (error) {
    throw handleError(error);
  }
}

const subscriptionsGateway = {
  getPricing,
  createSubscription,
  verifyPayment,
  cancelSubscription,
  getMySubscription,
};

export default subscriptionsGateway;
