import hubProfileViewersGateway from '../gateway/profileViewers.js';
import { PROFILE_VIEWERS_EVENTS, EXPORT_PAGE_SIZE, EXPORT_MAX_ROWS } from '../constants/constants.js';
import { fetchAllPages } from 'src/shared/utils/fetchAllPages.js';

/** The one thing the Profile viewers page may call — never the gateway directly. */

async function getViewers(eventEmitter, params) {
  try {
    const data = await hubProfileViewersGateway.getViewers(params);
    eventEmitter.emit(PROFILE_VIEWERS_EVENTS.GET_VIEWERS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(PROFILE_VIEWERS_EVENTS.GET_VIEWERS_FAILURE, error);
  }
}

/** Bulk export: every stored viewer for the current connection-level filter, all pages (100 a request, a few at a time). Stored data: no LinkedIn call. */
async function exportViewers(eventEmitter, { degree } = {}) {
  try {
    const { rows, total, truncated } = await fetchAllPages(
      async (page) => {
        const data = await hubProfileViewersGateway.getViewers({ page, limit: EXPORT_PAGE_SIZE, degree });
        return { rows: data.viewers ?? [], total: data.total ?? 0 };
      },
      { pageSize: EXPORT_PAGE_SIZE, maxRows: EXPORT_MAX_ROWS, keyOf: (viewer) => viewer.providerId },
    );
    eventEmitter.emit(PROFILE_VIEWERS_EVENTS.EXPORT_VIEWERS_SUCCESS, { viewers: rows, total, truncated });
  } catch (error) {
    eventEmitter.emit(PROFILE_VIEWERS_EVENTS.EXPORT_VIEWERS_FAILURE, error);
  }
}

async function syncViewers(eventEmitter) {
  try {
    const data = await hubProfileViewersGateway.syncViewers();
    eventEmitter.emit(PROFILE_VIEWERS_EVENTS.SYNC_VIEWERS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(PROFILE_VIEWERS_EVENTS.SYNC_VIEWERS_FAILURE, error);
  }
}

const hubProfileViewersController = { getViewers, syncViewers, exportViewers };
export default hubProfileViewersController;
