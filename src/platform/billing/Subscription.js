/**
 * Subscription Entities
 * Wrap responses from the /subscriptions/* endpoints (paywall + billing —
 * unrelated to the admin-managed Plan/credit-tier model used elsewhere).
 */

/** GET /subscriptions/pricing */
export class PricingInfo {
  constructor(data) {
    this.region = data?.region || 'IN';
    this.currency = data?.currency || 'INR';
    this.baseAmount = data?.baseAmount ?? 0;
    this.firstCycleAmount = data?.firstCycleAmount ?? this.baseAmount;
    this.appliedPromoCode = data?.appliedPromoCode || null;
    this.promoDescription = data?.promoDescription || null;
    // Set when a code was supplied but couldn't be used — the page can
    // explain why while still rendering a valid full price.
    this.promoRejectedReason = data?.promoRejectedReason || null;
    this.isFirstTime = !!data?.isFirstTime;
    // Comped account (internal, founder, special client). Nothing to pay.
    this.exempt = !!data?.exempt;
    this.exemptUntil = data?.exemptUntil || null;
  }

  static fromResponse(data) {
    return new PricingInfo(data || {});
  }

  /** Whether the price actually differs from the sticker price. */
  hasDiscount() {
    return !!this.appliedPromoCode && this.firstCycleAmount < this.baseAmount;
  }

  /** What this saves, in whole currency units. */
  savings() {
    return Math.max(0, this.baseAmount - this.firstCycleAmount);
  }
}

/** POST /subscriptions/promo/validate */
export class PromoValidation {
  constructor(data) {
    this.code = data?.code || null;
    this.description = data?.description || null;
    this.currency = data?.currency || 'INR';
    this.baseAmount = data?.baseAmount ?? 0;
    this.firstCycleAmount = data?.firstCycleAmount ?? this.baseAmount;
    this.savings = data?.savings ?? 0;
  }

  static fromResponse(data) {
    return new PromoValidation(data || {});
  }
}

/** POST /subscriptions */
export class SubscriptionCreateResult {
  constructor(data) {
    this.subscriptionId = data?.subscriptionId || null;
    this.cashfreeSubscriptionId = data?.cashfreeSubscriptionId || null;
    this.subscriptionSessionId = data?.subscriptionSessionId || null;
    this.firstCycleAmount = data?.firstCycleAmount ?? null;
    this.baseAmount = data?.baseAmount ?? null;
    this.appliedPromoCode = data?.appliedPromoCode || null;
  }

  static fromResponse(data) {
    return new SubscriptionCreateResult(data || {});
  }
}

/**
 * GET /subscriptions/me
 * `status` is the single source of truth for gating:
 * 'none' | 'pending_authorization' | 'active' | 'past_due'.
 */
export class SubscriptionSummary {
  constructor(data) {
    this.status = data?.status || 'none';
    this.region = data?.region || null;
    this.currency = data?.currency || null;
    this.baseAmount = data?.baseAmount ?? null;
    this.currentCycleEnd = data?.currentCycleEnd || null;
    this.lastChargeStatus = data?.lastChargeStatus || null;
    // Comped accounts report status 'active' with no payment behind it.
    this.exempt = !!data?.exempt;
    this.exemptReason = data?.exemptReason || null;
  }

  static fromResponse(data) {
    return new SubscriptionSummary(data || {});
  }

  isActive() {
    return this.status === 'active';
  }

  isPastDue() {
    return this.status === 'past_due';
  }

  isPendingAuthorization() {
    return this.status === 'pending_authorization';
  }

  /** Access granted without payment — worth showing differently in settings. */
  isComped() {
    return this.exempt === true;
  }
}

/** Generic { success, message, data, status } envelope, same shape as AuthResponse. */
export class SubscriptionsApiResponse {
  constructor(data) {
    this.success = data.success;
    this.message = data.message;
    this.data = data.data;
    this.status = data.status;
  }

  static fromResponse(data) {
    return new SubscriptionsApiResponse(data);
  }
}
