/**
 * Subscription Entities
 * Wrap responses from the /subscriptions/* endpoints (paywall + billing —
 * unrelated to the admin-managed Plan/credit-tier model used elsewhere).
 */

/** GET /subscriptions/pricing */
function createPricingInfo(data) {
  const pricing = {
    region: data?.region || 'IN',
    currency: data?.currency || 'INR',
    baseAmount: data?.baseAmount ?? 0,
    firstCycleAmount: data?.firstCycleAmount ?? (data?.baseAmount ?? 0),
    appliedPromoCode: data?.appliedPromoCode || null,
    promoDescription: data?.promoDescription || null,
    // Set when a code was supplied but couldn't be used — the page can
    // explain why while still rendering a valid full price.
    promoRejectedReason: data?.promoRejectedReason || null,
    isFirstTime: !!data?.isFirstTime,
    // Comped account (internal, founder, special client). Nothing to pay.
    exempt: !!data?.exempt,
    exemptUntil: data?.exemptUntil || null,
  };

  /** Whether the price actually differs from the sticker price. */
  pricing.hasDiscount = () => {
    return !!pricing.appliedPromoCode && pricing.firstCycleAmount < pricing.baseAmount;
  };

  /** What this saves, in whole currency units. */
  pricing.savings = () => {
    return Math.max(0, pricing.baseAmount - pricing.firstCycleAmount);
  };

  return pricing;
}

export const PricingInfo = {
  fromResponse(data) {
    return createPricingInfo(data || {});
  },
};

/** POST /subscriptions/promo/validate */
function createPromoValidation(data) {
  return {
    code: data?.code || null,
    description: data?.description || null,
    currency: data?.currency || 'INR',
    baseAmount: data?.baseAmount ?? 0,
    firstCycleAmount: data?.firstCycleAmount ?? (data?.baseAmount ?? 0),
    savings: data?.savings ?? 0,
  };
}

export const PromoValidation = {
  fromResponse(data) {
    return createPromoValidation(data || {});
  },
};

/** POST /subscriptions */
function createSubscriptionCreateResult(data) {
  return {
    subscriptionId: data?.subscriptionId || null,
    cashfreeSubscriptionId: data?.cashfreeSubscriptionId || null,
    subscriptionSessionId: data?.subscriptionSessionId || null,
    firstCycleAmount: data?.firstCycleAmount ?? null,
    baseAmount: data?.baseAmount ?? null,
    appliedPromoCode: data?.appliedPromoCode || null,
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
    currentCycleEnd: data?.currentCycleEnd || null,
    lastChargeStatus: data?.lastChargeStatus || null,
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
