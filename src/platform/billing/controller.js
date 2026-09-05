import subscriptionsApi from 'src/platform/billing/api.js';

/**
 * Subscriptions Controller
 * Orchestrates the paywall / one-time payment flow. Thin on purpose —
 * there's no local state to reconcile here (unlike auth's token +
 * localStorage bookkeeping), so each method is a direct pass-through to the
 * API layer. Kept as its own controller rather than folded into
 * authController because billing is deliberately unrelated to
 * auth/onboarding — see SubscriptionContext for the app-wide status cache.
 */
class SubscriptionsController {
  /**
   * @param {string} [code] - optional promo code to preview
   * @returns {Promise<import('src/platform/billing/Subscription.js').PricingInfo>}
   */
  async getPricing(code) {
    return subscriptionsApi.getPricing(code);
  }

  /**
   * @param {string} code
   * @returns {Promise<import('src/platform/billing/Subscription.js').PromoValidation>}
   */
  async validatePromo(code) {
    return subscriptionsApi.validatePromo(code);
  }

  /**
   * @param {string} [code] - optional promo code to apply
   * @returns {Promise<import('src/platform/billing/Subscription.js').SubscriptionCreateResult>}
   */
  async createSubscription(code) {
    return subscriptionsApi.createSubscription(code);
  }

  /**
   * @returns {Promise<import('src/platform/billing/Subscription.js').SubscriptionSummary>}
   */
  async getMySubscription() {
    return subscriptionsApi.getMySubscription();
  }
}

export default new SubscriptionsController();
