/**
 * Subscription/billing module events, dispatched by the controller and
 * subscribed to by SubscriptionContext and the pages that trigger these
 * actions directly (SubscribePage, Settings → Billing).
 */
export const SUBSCRIPTION_EVENTS = {
  GET_PRICING_SUCCESS: 'SUBSCRIPTION_GET_PRICING_SUCCESS',
  GET_PRICING_FAILURE: 'SUBSCRIPTION_GET_PRICING_FAILURE',

  // Checkout lifecycle: create subscription → Razorpay modal → verify.
  CHECKOUT_SUCCESS: 'SUBSCRIPTION_CHECKOUT_SUCCESS',
  CHECKOUT_FAILURE: 'SUBSCRIPTION_CHECKOUT_FAILURE',
  // User closed the Razorpay modal without finishing. Not an error.
  CHECKOUT_DISMISSED: 'SUBSCRIPTION_CHECKOUT_DISMISSED',

  CANCEL_SUCCESS: 'SUBSCRIPTION_CANCEL_SUCCESS',
  CANCEL_FAILURE: 'SUBSCRIPTION_CANCEL_FAILURE',

  GET_MY_SUBSCRIPTION_SUCCESS: 'SUBSCRIPTION_GET_MY_SUBSCRIPTION_SUCCESS',
  GET_MY_SUBSCRIPTION_FAILURE: 'SUBSCRIPTION_GET_MY_SUBSCRIPTION_FAILURE',
};
