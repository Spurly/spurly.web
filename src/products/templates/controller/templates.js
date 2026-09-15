import templatesGateway from '../gateway/templates.js';
import { TEMPLATE_EVENTS } from '../constants/constants.js';

/**
 * Message Templates Controller
 *
 * Thin orchestration over the templates gateway: unwraps the { success, data }
 * envelope and reports outcomes over the caller's `eventEmitter` instead of
 * returning/throwing — every method here is a plain async function, no
 * classes, with try/catch confined to this file (and the gateway).
 *
 * TEMPLATE_TYPES and TYPE_FOR_ACTION stay here rather than in constants.js —
 * they're inherently coupled to this controller's shape and are imported by
 * name from this exact path by the page and the picker modal.
 *
 * Failure events carry the raw error (not just its message) so callers can
 * run it through apiError.js's status-aware toast/inline copy, same as
 * before this controller reported over events.
 */

/** Template types, as stored on the backend. */
export const TEMPLATE_TYPES = {
  CONNECTION: 'CONNECTION_REQUEST',
  MESSAGE: 'DIRECT_MESSAGE',
};

/** Maps a campaign's `actionType` to the template type it needs. */
export const TYPE_FOR_ACTION = {
  connection: TEMPLATE_TYPES.CONNECTION,
  message: TEMPLATE_TYPES.MESSAGE,
};

function unwrap(res, fallbackMessage) {
  if (!res?.success) throw new Error(res?.message || fallbackMessage);
  return res.data;
}

/**
 * @param {Object} params
 * @param {'CONNECTION_REQUEST'|'DIRECT_MESSAGE'} [params.type]
 * @param {string} [params.search]
 * Emits LIST_SUCCESS with { templates, pagination }, or LIST_FAILURE.
 */
async function listTemplates(eventEmitter, { type, search, limit = 100, skip = 0 } = {}) {
  try {
    // The server treats an empty string as a filter, so only send set values.
    const params = { limit, skip };
    if (search) params.search = search;

    const data = type
      ? unwrap(await templatesGateway.listByType(type, params), 'Failed to load templates')
      : unwrap(await templatesGateway.list(params), 'Failed to load templates');

    eventEmitter.emit(TEMPLATE_EVENTS.LIST_SUCCESS, {
      templates: data?.templates || [],
      pagination: data?.pagination || {},
    });
  } catch (error) {
    eventEmitter.emit(TEMPLATE_EVENTS.LIST_FAILURE, error);
  }
}

/** Emits CREATE_SUCCESS with the created template, or CREATE_FAILURE. */
async function createTemplate(eventEmitter, payload) {
  try {
    const data = unwrap(await templatesGateway.create(payload), 'Failed to create template');
    eventEmitter.emit(TEMPLATE_EVENTS.CREATE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(TEMPLATE_EVENTS.CREATE_FAILURE, error);
  }
}

/** Emits UPDATE_SUCCESS with the updated template, or UPDATE_FAILURE. */
async function updateTemplate(eventEmitter, templateId, payload) {
  try {
    const data = unwrap(
      await templatesGateway.update(templateId, payload),
      'Failed to update template',
    );
    eventEmitter.emit(TEMPLATE_EVENTS.UPDATE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(TEMPLATE_EVENTS.UPDATE_FAILURE, error);
  }
}

/** Emits DELETE_SUCCESS with { templateId }, or DELETE_FAILURE. */
async function deleteTemplate(eventEmitter, templateId) {
  try {
    unwrap(await templatesGateway.remove(templateId), 'Failed to delete template');
    eventEmitter.emit(TEMPLATE_EVENTS.DELETE_SUCCESS, { templateId });
  } catch (error) {
    eventEmitter.emit(TEMPLATE_EVENTS.DELETE_FAILURE, error);
  }
}

/** Emits DUPLICATE_SUCCESS with the new copy, or DUPLICATE_FAILURE. */
async function duplicateTemplate(eventEmitter, templateId, newName) {
  try {
    const data = unwrap(
      await templatesGateway.duplicate(templateId, newName),
      'Failed to duplicate template',
    );
    eventEmitter.emit(TEMPLATE_EVENTS.DUPLICATE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(TEMPLATE_EVENTS.DUPLICATE_FAILURE, error);
  }
}

/** Emits TOGGLE_FAVORITE_SUCCESS with the updated template, or TOGGLE_FAVORITE_FAILURE. */
async function toggleFavorite(eventEmitter, templateId) {
  try {
    const data = unwrap(
      await templatesGateway.toggleFavorite(templateId),
      'Failed to update favorite',
    );
    eventEmitter.emit(TEMPLATE_EVENTS.TOGGLE_FAVORITE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(TEMPLATE_EVENTS.TOGGLE_FAVORITE_FAILURE, error);
  }
}

const templatesController = {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  toggleFavorite,
};
export default templatesController;
