import sidebarSummaryGateway from '../gateway/sidebarSummary.js';
import { SIDEBAR_SUMMARY_EVENTS } from '../constants/constants.js';

/**
 * Sidebar Summary Controller
 *
 * try/catch and async/await live here (and in the gateway) only — same
 * event-emitter shape as core/notifications: the hook subscribes and never
 * touches the raw gateway response.
 */

/** Emits LOAD_SUCCESS with the summary object, or LOAD_FAILURE with a
 * message. Non-fatal by design — a failed poll should not blank out
 * numbers that were already on screen. */
async function load(eventEmitter) {
  try {
    const res = await sidebarSummaryGateway.get();
    if (!res?.success) throw new Error(res?.message || 'Failed to load summary');
    eventEmitter.emit(SIDEBAR_SUMMARY_EVENTS.LOAD_SUCCESS, res.data);
  } catch (error) {
    eventEmitter.emit(SIDEBAR_SUMMARY_EVENTS.LOAD_FAILURE, error?.message || 'Failed to load summary');
  }
}

/** Same shape as `load`, against the heavier /summary/dashboard endpoint.
 * Not polled — called once when the Dashboard page mounts. */
async function loadDashboard(eventEmitter) {
  try {
    const res = await sidebarSummaryGateway.getDashboard();
    if (!res?.success) throw new Error(res?.message || 'Failed to load dashboard summary');
    eventEmitter.emit(SIDEBAR_SUMMARY_EVENTS.DASHBOARD_LOAD_SUCCESS, res.data);
  } catch (error) {
    eventEmitter.emit(SIDEBAR_SUMMARY_EVENTS.DASHBOARD_LOAD_FAILURE, error?.message || 'Failed to load dashboard summary');
  }
}

const sidebarSummaryController = { load, loadDashboard };
export default sidebarSummaryController;
