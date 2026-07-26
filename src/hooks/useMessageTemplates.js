import { useState, useEffect, useCallback, useRef } from 'react';
import messageTemplatesController from 'src/core/controllers/messageTemplatesController.js';

/**
 * Loads the user's message templates for one type and exposes optimistic
 * mutations for the Templates page and the campaign picker.
 *
 * @param {Object} params
 * @param {'CONNECTION_REQUEST'|'DIRECT_MESSAGE'} params.type
 * @param {string} [params.search] - server-side search; debounce upstream
 * @param {boolean} [params.enabled=true] - skip fetching (e.g. a closed modal)
 */
export function useMessageTemplates({ type, search = '', enabled = true }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  // Guards against a slow earlier request landing after a newer one and
  // repainting the list with stale results when the type tab is switched fast.
  const requestRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    setLoading(true);
    setError(null);
    try {
      const { templates: list } = await messageTemplatesController.listTemplates({
        type,
        search,
      });
      if (!mountedRef.current || requestRef.current !== requestId) return;
      setTemplates(list);
    } catch (err) {
      if (!mountedRef.current || requestRef.current !== requestId) return;
      setError(err.message || 'Failed to load templates');
      setTemplates([]);
    } finally {
      if (mountedRef.current && requestRef.current === requestId) setLoading(false);
    }
  }, [type, search, enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
  }, [refresh, enabled]);

  const create = useCallback(async (payload) => {
    const created = await messageTemplatesController.createTemplate(payload);
    setTemplates((list) => [created, ...list]);
    return created;
  }, []);

  const update = useCallback(async (templateId, payload) => {
    const updated = await messageTemplatesController.updateTemplate(templateId, payload);
    setTemplates((list) => list.map((t) => (t._id === templateId ? updated : t)));
    return updated;
  }, []);

  const remove = useCallback(async (templateId) => {
    // Optimistic: keep a copy so a failed delete can be put back.
    let snapshot = [];
    setTemplates((list) => {
      snapshot = list;
      return list.filter((t) => t._id !== templateId);
    });
    try {
      await messageTemplatesController.deleteTemplate(templateId);
    } catch (err) {
      setTemplates(snapshot);
      throw err;
    }
  }, []);

  const duplicate = useCallback(async (templateId, newName) => {
    const copy = await messageTemplatesController.duplicateTemplate(templateId, newName);
    setTemplates((list) => [copy, ...list]);
    return copy;
  }, []);

  const toggleFavorite = useCallback(async (template) => {
    // Optimistic — the star is cosmetic, so a failed toggle just rolls back.
    const { _id, isFavorite } = template;
    setTemplates((list) => list.map((t) => (t._id === _id ? { ...t, isFavorite: !isFavorite } : t)));
    try {
      await messageTemplatesController.toggleFavorite(_id);
    } catch (err) {
      setTemplates((list) => list.map((t) => (t._id === _id ? { ...t, isFavorite } : t)));
      throw err;
    }
  }, []);

  return { templates, loading, error, refresh, create, update, remove, duplicate, toggleFavorite };
}
