import * as adminGateway from '../gateway/admin.js';
import { ADMIN_EVENTS } from '../constants/constants.js';

/**
 * Admin Controller
 *
 * Thin orchestration over the admin gateway for the whole admin console
 * (Users, Pricing/Plans, Payments, Transactions, Insights, and the modals
 * each page opens). Every method is a plain async function taking the
 * caller's `eventEmitter` first and reporting the outcome by emitting an
 * event instead of returning/throwing — try/catch and async/await live here
 * (and in the gateway) only.
 *
 * `call()` is the one shared shape: run the gateway function, treat a
 * `{ success: false }` envelope the same as a thrown network error, and emit
 * `res.data` (or the error) on the event pair named for that action.
 */
async function call(eventEmitter, fn, successEvent, failureEvent, fallbackMessage) {
  try {
    const res = await fn();
    if (!res?.success) throw new Error(res?.message || fallbackMessage);
    eventEmitter.emit(successEvent, res.data);
  } catch (error) {
    eventEmitter.emit(failureEvent, error);
  }
}

// ── Users ──────────────────────────────────────────────────────────────
function getAllUsers(eventEmitter, limit, skip) {
  return call(
    eventEmitter,
    () => adminGateway.getAllUsers(limit, skip),
    ADMIN_EVENTS.GET_ALL_USERS_SUCCESS,
    ADMIN_EVENTS.GET_ALL_USERS_FAILURE,
    'Failed to load users',
  );
}

function getUserCredits(eventEmitter, userId, limit, skip) {
  return call(
    eventEmitter,
    () => adminGateway.getUserCredits(userId, limit, skip),
    ADMIN_EVENTS.GET_USER_CREDITS_SUCCESS,
    ADMIN_EVENTS.GET_USER_CREDITS_FAILURE,
    'Failed to load credit history',
  );
}

function getUserDetails(eventEmitter, userId) {
  return call(
    eventEmitter,
    () => adminGateway.getUserDetails(userId),
    ADMIN_EVENTS.GET_USER_DETAILS_SUCCESS,
    ADMIN_EVENTS.GET_USER_DETAILS_FAILURE,
    'Failed to load user details',
  );
}

// ── Credits ────────────────────────────────────────────────────────────
function updateCredits(eventEmitter, userId, amount, action, reason) {
  return call(
    eventEmitter,
    () => adminGateway.updateCredits(userId, amount, action, reason),
    ADMIN_EVENTS.UPDATE_CREDITS_SUCCESS,
    ADMIN_EVENTS.UPDATE_CREDITS_FAILURE,
    "Couldn't update credits",
  );
}

// ── Analytics / Insights ──────────────────────────────────────────────
function getAnalyticsOverview(eventEmitter) {
  return call(
    eventEmitter,
    () => adminGateway.getAnalyticsOverview(),
    ADMIN_EVENTS.GET_ANALYTICS_OVERVIEW_SUCCESS,
    ADMIN_EVENTS.GET_ANALYTICS_OVERVIEW_FAILURE,
    'Failed to load analytics overview',
  );
}

function getUserUsageAnalytics(eventEmitter, limit, skip, search, sort) {
  return call(
    eventEmitter,
    () => adminGateway.getUserUsageAnalytics(limit, skip, search, sort),
    ADMIN_EVENTS.GET_USER_USAGE_ANALYTICS_SUCCESS,
    ADMIN_EVENTS.GET_USER_USAGE_ANALYTICS_FAILURE,
    'Failed to load usage analytics',
  );
}

function getUserDailyActivity(eventEmitter, userId, days) {
  return call(
    eventEmitter,
    () => adminGateway.getUserDailyActivity(userId, days),
    ADMIN_EVENTS.GET_USER_DAILY_ACTIVITY_SUCCESS,
    ADMIN_EVENTS.GET_USER_DAILY_ACTIVITY_FAILURE,
    'Failed to load daily activity',
  );
}

// ── Transactions ───────────────────────────────────────────────────────
function getTransactions(eventEmitter, limit, skip, type) {
  return call(
    eventEmitter,
    () => adminGateway.getTransactions(limit, skip, type),
    ADMIN_EVENTS.GET_TRANSACTIONS_SUCCESS,
    ADMIN_EVENTS.GET_TRANSACTIONS_FAILURE,
    'Failed to load transactions',
  );
}

// ── Action costs (Pricing) ────────────────────────────────────────────
function getActionCosts(eventEmitter) {
  return call(
    eventEmitter,
    () => adminGateway.getActionCosts(),
    ADMIN_EVENTS.GET_ACTION_COSTS_SUCCESS,
    ADMIN_EVENTS.GET_ACTION_COSTS_FAILURE,
    'Failed to load action costs',
  );
}

function updateActionCost(eventEmitter, feature, cost) {
  return call(
    eventEmitter,
    () => adminGateway.updateActionCost(feature, cost),
    ADMIN_EVENTS.UPDATE_ACTION_COST_SUCCESS,
    ADMIN_EVENTS.UPDATE_ACTION_COST_FAILURE,
    "Couldn't update the cost",
  );
}

function updateActionBilling(eventEmitter, feature, billingEnabled) {
  return call(
    eventEmitter,
    () => adminGateway.updateActionBilling(feature, billingEnabled),
    ADMIN_EVENTS.UPDATE_ACTION_BILLING_SUCCESS,
    ADMIN_EVENTS.UPDATE_ACTION_BILLING_FAILURE,
    "Couldn't update billing",
  );
}

// ── Plans ──────────────────────────────────────────────────────────────
function getPlans(eventEmitter) {
  return call(
    eventEmitter,
    () => adminGateway.getPlans(),
    ADMIN_EVENTS.GET_PLANS_SUCCESS,
    ADMIN_EVENTS.GET_PLANS_FAILURE,
    'Failed to load plans',
  );
}

function createPlan(eventEmitter, plan) {
  return call(
    eventEmitter,
    () => adminGateway.createPlan(plan),
    ADMIN_EVENTS.CREATE_PLAN_SUCCESS,
    ADMIN_EVENTS.CREATE_PLAN_FAILURE,
    "Couldn't create the plan",
  );
}

function updatePlan(eventEmitter, planId, updates) {
  return call(
    eventEmitter,
    () => adminGateway.updatePlan(planId, updates),
    ADMIN_EVENTS.UPDATE_PLAN_SUCCESS,
    ADMIN_EVENTS.UPDATE_PLAN_FAILURE,
    "Couldn't update the plan",
  );
}

function assignUserPlan(eventEmitter, userId, planId) {
  return call(
    eventEmitter,
    () => adminGateway.assignUserPlan(userId, planId),
    ADMIN_EVENTS.ASSIGN_USER_PLAN_SUCCESS,
    ADMIN_EVENTS.ASSIGN_USER_PLAN_FAILURE,
    "Couldn't assign the plan",
  );
}

// ── Promo codes ────────────────────────────────────────────────────────
function getPromoCodes(eventEmitter) {
  return call(
    eventEmitter,
    () => adminGateway.getPromoCodes(),
    ADMIN_EVENTS.GET_PROMO_CODES_SUCCESS,
    ADMIN_EVENTS.GET_PROMO_CODES_FAILURE,
    'Failed to load promo codes',
  );
}

function createPromoCode(eventEmitter, promo) {
  return call(
    eventEmitter,
    () => adminGateway.createPromoCode(promo),
    ADMIN_EVENTS.CREATE_PROMO_CODE_SUCCESS,
    ADMIN_EVENTS.CREATE_PROMO_CODE_FAILURE,
    "Couldn't create the promo code",
  );
}

function updatePromoCode(eventEmitter, promoId, updates) {
  return call(
    eventEmitter,
    () => adminGateway.updatePromoCode(promoId, updates),
    ADMIN_EVENTS.UPDATE_PROMO_CODE_SUCCESS,
    ADMIN_EVENTS.UPDATE_PROMO_CODE_FAILURE,
    "Couldn't update the promo code",
  );
}

function deletePromoCode(eventEmitter, promoId) {
  return call(
    eventEmitter,
    () => adminGateway.deletePromoCode(promoId),
    ADMIN_EVENTS.DELETE_PROMO_CODE_SUCCESS,
    ADMIN_EVENTS.DELETE_PROMO_CODE_FAILURE,
    "Couldn't delete the promo code",
  );
}

// ── Billing exemptions ────────────────────────────────────────────────
function getBillingExemptions(eventEmitter) {
  return call(
    eventEmitter,
    () => adminGateway.getBillingExemptions(),
    ADMIN_EVENTS.GET_BILLING_EXEMPTIONS_SUCCESS,
    ADMIN_EVENTS.GET_BILLING_EXEMPTIONS_FAILURE,
    'Failed to load billing exemptions',
  );
}

function grantBillingExemption(eventEmitter, payload) {
  return call(
    eventEmitter,
    () => adminGateway.grantBillingExemption(payload),
    ADMIN_EVENTS.GRANT_BILLING_EXEMPTION_SUCCESS,
    ADMIN_EVENTS.GRANT_BILLING_EXEMPTION_FAILURE,
    "Couldn't grant the exemption",
  );
}

function revokeBillingExemption(eventEmitter, email) {
  return call(
    eventEmitter,
    () => adminGateway.revokeBillingExemption(email),
    ADMIN_EVENTS.REVOKE_BILLING_EXEMPTION_SUCCESS,
    ADMIN_EVENTS.REVOKE_BILLING_EXEMPTION_FAILURE,
    "Couldn't revoke the exemption",
  );
}

// ── Hub entitlement ────────────────────────────────────────────────────
function getHubAccounts(eventEmitter) {
  return call(
    eventEmitter,
    () => adminGateway.getHubAccounts(),
    ADMIN_EVENTS.GET_HUB_ACCOUNTS_SUCCESS,
    ADMIN_EVENTS.GET_HUB_ACCOUNTS_FAILURE,
    'Failed to load hub accounts',
  );
}

function grantHubAccess(eventEmitter, payload) {
  return call(
    eventEmitter,
    () => adminGateway.grantHubAccess(payload),
    ADMIN_EVENTS.GRANT_HUB_ACCESS_SUCCESS,
    ADMIN_EVENTS.GRANT_HUB_ACCESS_FAILURE,
    "Couldn't grant hub access",
  );
}

function revokeHubAccess(eventEmitter, payload) {
  return call(
    eventEmitter,
    () => adminGateway.revokeHubAccess(payload),
    ADMIN_EVENTS.REVOKE_HUB_ACCESS_SUCCESS,
    ADMIN_EVENTS.REVOKE_HUB_ACCESS_FAILURE,
    "Couldn't revoke hub access",
  );
}

function getUnownedHubAccounts(eventEmitter) {
  return call(
    eventEmitter,
    () => adminGateway.getUnownedHubAccounts(),
    ADMIN_EVENTS.GET_UNOWNED_HUB_ACCOUNTS_SUCCESS,
    ADMIN_EVENTS.GET_UNOWNED_HUB_ACCOUNTS_FAILURE,
    'Failed to load unowned hub accounts',
  );
}

function bindHubAccount(eventEmitter, payload) {
  return call(
    eventEmitter,
    () => adminGateway.bindHubAccount(payload),
    ADMIN_EVENTS.BIND_HUB_ACCOUNT_SUCCESS,
    ADMIN_EVENTS.BIND_HUB_ACCOUNT_FAILURE,
    "Couldn't bind that account",
  );
}

// ── Payments (read-only) ───────────────────────────────────────────────
function getPayments(eventEmitter, params) {
  return call(
    eventEmitter,
    () => adminGateway.getPayments(params),
    ADMIN_EVENTS.GET_PAYMENTS_SUCCESS,
    ADMIN_EVENTS.GET_PAYMENTS_FAILURE,
    'Failed to load payments',
  );
}

function getUserPayments(eventEmitter, userId) {
  return call(
    eventEmitter,
    () => adminGateway.getUserPayments(userId),
    ADMIN_EVENTS.GET_USER_PAYMENTS_SUCCESS,
    ADMIN_EVENTS.GET_USER_PAYMENTS_FAILURE,
    "Couldn't load payment history",
  );
}

const adminController = {
  getAllUsers,
  getUserCredits,
  getUserDetails,
  updateCredits,
  getAnalyticsOverview,
  getUserUsageAnalytics,
  getUserDailyActivity,
  getTransactions,
  getActionCosts,
  updateActionCost,
  updateActionBilling,
  getPlans,
  createPlan,
  updatePlan,
  assignUserPlan,
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getBillingExemptions,
  grantBillingExemption,
  revokeBillingExemption,
  getHubAccounts,
  grantHubAccess,
  revokeHubAccess,
  getUnownedHubAccounts,
  bindHubAccount,
  getPayments,
  getUserPayments,
};

export default adminController;
