/**
 * Subscription Entities
 * Wrap responses from the /subscriptions/* endpoints (paywall + billing —
 * unrelated to the admin-managed Plan/credit-tier model used elsewhere).
 */

/** GET /subscriptions/pricing */
function createPricingInfo(data) {
  return {
    region: data?.region || 'IN',
    currency: data?.currency || 'INR',
    // Monthly price in major units (2499 / 24.99).
    amount: data?.amount ?? null,
    trialDays: data?.trialDays ?? 0,
    trialEligible: !!data?.trialEligible,
    // Set when resubscribing inside already-paid time: billing starts then.
    firstChargeAt: data?.firstChargeAt || null,
    // false for USD while international checkout is switched off server-side.
    checkoutAvailable: data?.checkoutAvailable !== false,
    // Comped account (internal, founder, special client). Nothing to pay.
    exempt: !!data?.exempt,
    exemptUntil: data?.exemptUntil || null,
  };
}

export const PricingInfo = {
  fromResponse(data) {
    return createPricingInfo(data || {});
  },
};

/** POST /subscriptions — everything Razorpay Checkout needs to open. */
function createSubscriptionCreateResult(data) {
  return {
    keyId: data?.keyId || null,
    subscriptionId: data?.subscriptionId || null,
    currency: data?.currency || 'INR',
    amount: data?.amount ?? null,
    trial: !!data?.trial,
    trialDays: data?.trialDays ?? 0,
    firstChargeAt: data?.firstChargeAt || null,
    prefill: {
      name: data?.prefill?.name || '',
      email: data?.prefill?.email || '',
      contact: data?.prefill?.contact || '',
    },
  };
}

export const SubscriptionCreateResult = {
  fromResponse(data) {
    return createSubscriptionCreateResult(data || {});
  },
};

/**
 * GET /subscriptions/me
 * `status` is the single source of truth for gating:
 * 'none' | 'pending_authorization' | 'active' | 'past_due'.
 */
function createSubscriptionSummary(data) {
  const summary = {
    status: data?.status || 'none',
    region: data?.region || null,
    currency: data?.currency || null,
    baseAmount: data?.baseAmount ?? null,
    amount: data?.amount ?? data?.baseAmount ?? null,
    currentCycleEnd: data?.currentCycleEnd || null,
    lastChargeStatus: data?.lastChargeStatus || null,
    // Razorpay subscription detail (absent for comped / never-subscribed).
    razorpayStatus: data?.razorpayStatus || null,
    trialing: !!data?.trialing,
    trialEndsAt: data?.trialEndsAt || null,
    nextChargeAt: data?.nextChargeAt || null,
    cancelled: !!data?.cancelled,
    accessUntil: data?.accessUntil || null,
    // Renewal failing while Razorpay retries — still has access.
    paymentIssue: !!data?.paymentIssue,
    // Trial ended, first invoice issued, money not moved yet.
    firstPaymentPending: !!data?.firstPaymentPending,
    canResubscribe: data?.canResubscribe !== false,
    // Comped accounts report status 'active' with no payment behind it.
    exempt: !!data?.exempt,
    exemptReason: data?.exemptReason || null,
    /**
     * Entitlements — what the plan INCLUDES, which is a different question
     * from whether it is paid up. They ride on this payload rather than an
     * endpoint of their own because the two are always read together: a UI
     * holding one without the other flashes a locked workspace at a paying
     * customer, or an unlocked one at somebody who never bought it.
     *
     * Absent means false. An older backend, a failed plan read, a truncated
     * response — none of those are evidence that someone owns hub, and the
     * API refuses the request regardless of what this says.
     */
    features: { hub: !!data?.features?.hub },
  };

  summary.isActive = () => summary.status === 'active';
  summary.isPastDue = () => summary.status === 'past_due';
  summary.isPendingAuthorization = () => summary.status === 'pending_authorization';
  /** Access granted without payment — worth showing differently in settings. */
  summary.isComped = () => summary.exempt === true;
  /** Has a live (non-cancelled) Razorpay subscription that can be cancelled. */
  summary.canCancel = () => summary.status === 'active' && !summary.exempt && !summary.cancelled && !!summary.razorpayStatus;

  return summary;
}

export const SubscriptionSummary = {
  fromResponse(data) {
    return createSubscriptionSummary(data || {});
  },
};

/** Generic { success, message, data, status } envelope, same shape as AuthResponse. */
function createSubscriptionsApiResponse(data) {
  return {
    success: data.success,
    message: data.message,
    data: data.data,
    status: data.status,
  };
}

export const SubscriptionsApiResponse = {
  fromResponse(data) {
    return createSubscriptionsApiResponse(data);
  },
};
