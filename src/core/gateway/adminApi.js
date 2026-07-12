import apiGateway from 'src/core/gateway/apiGateway.js';

/**
 * Admin API Client
 * Thin wrapper over the shared apiGateway for the admin console.
 *
 * These endpoints are protected server-side by authMiddleware + adminMiddleware
 * (the backend returns 403 for non-admins), so the frontend gating in
 * AdminRoute / DashboardLayout is purely UX. All calls reuse the same JWT
 * (`authToken`) and `/api` base the rest of the web app uses — there is no
 * separate admin login.
 *
 * Every function returns the raw backend payload: { success, data, message, status }.
 */

/**
 * Users Management
 */
export async function getAllUsers(limit = 20, skip = 0) {
  const res = await apiGateway.get(`/admin/users?limit=${limit}&skip=${skip}`);
  return res.data;
}

export async function getUserCredits(userId, limit = 50, skip = 0) {
  const res = await apiGateway.get(`/admin/users/${userId}/credits?limit=${limit}&skip=${skip}`);
  return res.data;
}

/**
 * Full user record — every field stored for the user in the users collection
 * (excluding sensitive select:false fields). Used by the admin user-details view.
 * Returns { success, data: { user }, message, status }.
 */
export async function getUserDetails(userId) {
  const res = await apiGateway.get(`/admin/users/${userId}/details`);
  return res.data;
}

/**
 * Credits Management
 * action: 'add' | 'deduct'. Amount is always positive; direction is the action.
 */
export async function updateCredits(userId, amount, action, reason) {
  const res = await apiGateway.post(`/admin/users/${userId}/credits`, {
    amount,
    action,
    reason,
  });
  return res.data;
}

/**
 * Analytics / Insights (Admin)
 * Founder-facing extension usage insights. All admin-gated server-side.
 */
export async function getAnalyticsOverview() {
  const res = await apiGateway.get('/admin/analytics/overview');
  return res.data;
}

export async function getUserUsageAnalytics(limit = 25, skip = 0, search = '', sort = 'lastActive') {
  let url = `/admin/analytics/users?limit=${limit}&skip=${skip}&sort=${sort}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const res = await apiGateway.get(url);
  return res.data;
}

export async function getUserDailyActivity(userId, days = 30) {
  const res = await apiGateway.get(`/admin/analytics/users/${userId}/daily?days=${days}`);
  return res.data;
}

/**
 * Transactions
 */
export async function getTransactions(limit = 50, skip = 0, type = null) {
  let url = `/admin/credits/transactions?limit=${limit}&skip=${skip}`;
  if (type) url += `&type=${type}`;
  const res = await apiGateway.get(url);
  return res.data;
}

/**
 * Action Costs (Pricing)
 */
export async function getActionCosts() {
  const res = await apiGateway.get('/admin/credits/costs');
  return res.data;
}

export async function updateActionCost(feature, cost) {
  const res = await apiGateway.put(`/admin/credits/costs/${feature}`, { cost });
  return res.data;
}

/**
 * Toggle whether an action charges credits. billingEnabled=false makes the
 * action free for all users (no deduction); true restores normal charging.
 */
export async function updateActionBilling(feature, billingEnabled) {
  const res = await apiGateway.put(`/admin/credits/costs/${feature}`, { billingEnabled });
  return res.data;
}

/**
 * Plans Management
 * Admin-only CRUD for subscription plans + per-user plan assignment.
 * Backend enforces auth + admin; these mirror the admin/credits endpoints.
 */

/** List all plans. */
export async function getPlans() {
  const res = await apiGateway.get('/admin/plans');
  return res.data;
}

/**
 * Create a new plan.
 * @param {{ name: string, displayName: string, isActive?: boolean, isDefault?: boolean,
 *   limits: { captureCardsPerDay: number, sendConnectionsPerDay: number, sendMessagesPerDay: number } }} plan
 */
export async function createPlan(plan) {
  const res = await apiGateway.post('/admin/plans', plan);
  return res.data;
}

/**
 * Update an existing plan. Pass any subset of
 * { displayName, isActive, isDefault, limits }.
 */
export async function updatePlan(planId, updates) {
  const res = await apiGateway.put(`/admin/plans/${planId}`, updates);
  return res.data;
}

/** Assign a plan to a user. */
export async function assignUserPlan(userId, planId) {
  const res = await apiGateway.post(`/admin/users/${userId}/plan`, { planId });
  return res.data;
}
