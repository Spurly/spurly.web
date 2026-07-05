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
