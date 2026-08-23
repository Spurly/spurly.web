import apiGateway from 'src/core/gateway/apiGateway.js';
import {
  SubscriptionsApiResponse,
  PricingInfo,
  PromoValidation,
  SubscriptionCreateResult,
  SubscriptionSummary,
} from 'src/core/entities/Subscription.js';

/**
 * Subscriptions API Client
 * Handles all /subscriptions/* calls (the mandatory paywall and one-time
 * payment flow). Layer between the controller and the gateway — mirrors
 * authApi.js's shape and error handling exactly.
 */
class SubscriptionsApi {
  /**
   * What the logged-in user would pay right now.
   * GET /subscriptions/pricing
   * @param {string} [code] - preview a typed promo code. An unusable code
   *   comes back as promoRejectedReason rather than throwing, so the page
   *   still renders a price.
   * @returns {Promise<PricingInfo>}
   */
  async getPricing(code) {
    try {
      const response = await apiGateway.get('/subscriptions/pricing', {
        params: code ? { code } : undefined,
      });
      const wrapped = SubscriptionsApiResponse.fromResponse(response.data);
      if (!wrapped.success) {
        throw new Error(wrapped.message);
      }
      return PricingInfo.fromResponse(wrapped.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Check a code the customer just typed. Unlike getPricing, an unusable
   * code throws with a specific reason — they're waiting on an answer.
   * POST /subscriptions/promo/validate
   * @returns {Promise<PromoValidation>}
   */
  async validatePromo(code) {
    try {
      const response = await apiGateway.post('/subscriptions/promo/validate', { code });
      const wrapped = SubscriptionsApiResponse.fromResponse(response.data);
      if (!wrapped.success) {
        throw new Error(wrapped.message);
      }
      return PromoValidation.fromResponse(wrapped.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Create the payment order. Returns the Cashfree session id to hand to
   * the SDK.
   * POST /subscriptions
   * @param {string} [code] - promo code to apply. Revalidated server-side;
   *   an invalid one fails the request rather than silently charging full
   *   price, which would be a nasty surprise on the bank statement.
   * @returns {Promise<SubscriptionCreateResult>}
   */
  async createSubscription(code) {
    try {
      const response = await apiGateway.post('/subscriptions', code ? { code } : {});
      const wrapped = SubscriptionsApiResponse.fromResponse(response.data);
      if (!wrapped.success) {
        throw new Error(wrapped.message);
      }
      return SubscriptionCreateResult.fromResponse(wrapped.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Current subscription status — polled to decide whether to show the
   * paywall (initial gate, and again after returning from Cashfree checkout).
   * GET /subscriptions/me
   * @returns {Promise<SubscriptionSummary>}
   */
  async getMySubscription() {
    try {
      const response = await apiGateway.get('/subscriptions/me');
      const wrapped = SubscriptionsApiResponse.fromResponse(response.data);
      if (!wrapped.success) {
        throw new Error(wrapped.message);
      }
      return SubscriptionSummary.fromResponse(wrapped.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Handle and format errors
   * @private
   */
  _handleError(error) {
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
}

export default new SubscriptionsApi();
