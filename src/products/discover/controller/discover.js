import hubDiscoverGateway from '../gateway/discover.js';
import { DISCOVER_EVENTS } from '../constants/constants.js';

/**
 * The one thing the Discover page may call. try/catch lives here and only here.
 * Every search event carries `ctx` back untouched ({ category, seq, append }),
 * so the page can drop an answer that a newer search has already replaced.
 */

async function search(eventEmitter, { category, keywords, url, filters, cursor }, ctx = {}) {
  try {
    const data = await hubDiscoverGateway.search(category, { keywords, url, filters, cursor });
    eventEmitter.emit(DISCOVER_EVENTS.SEARCH_SUCCESS, { ctx: { ...ctx, category }, data });
  } catch (error) {
    eventEmitter.emit(DISCOVER_EVENTS.SEARCH_FAILURE, { ctx: { ...ctx, category }, error });
  }
}

async function getUsage(eventEmitter) {
  try {
    const data = await hubDiscoverGateway.getUsage();
    eventEmitter.emit(DISCOVER_EVENTS.USAGE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(DISCOVER_EVENTS.USAGE_FAILURE, error);
  }
}

async function importAuthors(eventEmitter, { authors, name, keywords }) {
  try {
    const data = await hubDiscoverGateway.importAuthors({ authors, name, keywords });
    eventEmitter.emit(DISCOVER_EVENTS.IMPORT_AUTHORS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(DISCOVER_EVENTS.IMPORT_AUTHORS_FAILURE, error);
  }
}

const hubDiscoverController = { search, getUsage, importAuthors };
export default hubDiscoverController;
