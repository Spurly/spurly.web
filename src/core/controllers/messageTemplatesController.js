import messageTemplatesApi from 'src/core/gateway/messageTemplatesApi.js';

/**
 * Message Templates Controller
 *
 * Thin orchestration over the templates API: unwraps the { success, data }
 * envelope and throws a readable Error so hooks and pages can rely on the
 * payload rather than re-checking `success` everywhere.
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

class MessageTemplatesController {
  /**
   * @param {Object} params
   * @param {'CONNECTION_REQUEST'|'DIRECT_MESSAGE'} [params.type]
   * @param {string} [params.search]
   * @returns {Promise<{ templates: Array, pagination: Object }>}
   */
  async listTemplates({ type, search, limit = 100, skip = 0 } = {}) {
    // The server treats an empty string as a filter, so only send set values.
    const params = { limit, skip };
    if (search) params.search = search;

    const data = type
      ? unwrap(await messageTemplatesApi.listByType(type, params), 'Failed to load templates')
      : unwrap(await messageTemplatesApi.list(params), 'Failed to load templates');

    return { templates: data?.templates || [], pagination: data?.pagination || {} };
  }

  async createTemplate(payload) {
    const data = unwrap(await messageTemplatesApi.create(payload), 'Failed to create template');
    return data;
  }

  async updateTemplate(templateId, payload) {
    const data = unwrap(
      await messageTemplatesApi.update(templateId, payload),
      'Failed to update template',
    );
    return data;
  }

  async deleteTemplate(templateId) {
    unwrap(await messageTemplatesApi.remove(templateId), 'Failed to delete template');
    return true;
  }

  async duplicateTemplate(templateId, newName) {
    const data = unwrap(
      await messageTemplatesApi.duplicate(templateId, newName),
      'Failed to duplicate template',
    );
    return data;
  }

  async toggleFavorite(templateId) {
    const data = unwrap(
      await messageTemplatesApi.toggleFavorite(templateId),
      'Failed to update favorite',
    );
    return data;
  }
}

export default new MessageTemplatesController();
