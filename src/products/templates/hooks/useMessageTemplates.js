import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import templatesController from '../controller/templates.js';
import { TEMPLATE_EVENTS } from '../constants/constants.js';
import { useErrorToast } from 'src/core/primitives';

/**
 * Loads the user's message templates for one type and exposes optimistic
 * mutations for the Templates page and the campaign picker.
 *
 * Every mutation fires `templatesController` and lets it report back over
 * `eventEmitter` — no async/await or try/catch here. `eventEmitter` is
 * returned so a caller (the page, the picker modal) can `.once()` its own
 * per-call follow-up (a toast, closing the editor, handing back the
 * created/duplicated record) without this hook needing to know about any
 * of that; this hook only owns keeping `templates` in sync.
 *
 * @param {Object} params
 * @param {'CONNECTION_REQUEST'|'DIRECT_MESSAGE'} params.type
 * @param {string} [params.search] - server-side search; debounce upstream
 * @param {boolean} [params.enabled=true] - skip fetching (e.g. a closed modal)
 */
export function useMessageTemplates({ type, search = '', enabled = true }) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  // Guards against a slow earlier list request landing after a newer one and
  // repainting the list with stale results when the type tab is switched
  // fast. Each call gets its own private emitter so an old request's
  // response can never reach a listener meant for a newer one.
  const requestRef = useRef(0);

  const load = useCallback(() => {
    if (!enabled) return;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    setLoading(true);
    setError(null);

    const requestEmitter = new EventEmitter();
    requestEmitter.once(TEMPLATE_EVENTS.LIST_SUCCESS, ({ templates: list }) => {
      if (requestRef.current !== requestId) return;
      setTemplates(list);
      setLoading(false);
    });
    requestEmitter.once(TEMPLATE_EVENTS.LIST_FAILURE, (err) => {
      if (requestRef.current !== requestId) return;
      setError(err?.message || 'Failed to load templates');
      setTemplates([]);
      setLoading(false);
    });
    templatesController.listTemplates(requestEmitter, { type, search });
  }, [enabled, type, search]);

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [load, enabled]);

  // Non-optimistic mutations only land in `templates` once the server has
  // confirmed them.
  useEffect(() => {
    function handleCreateSuccess(created) {
      setTemplates((list) => [created, ...list]);
    }
    function handleUpdateSuccess(updated) {
      setTemplates((list) => list.map((t) => (t._id === updated._id ? updated : t)));
    }
    function handleDuplicateSuccess(copy) {
      setTemplates((list) => [copy, ...list]);
    }

    eventEmitter.on(TEMPLATE_EVENTS.CREATE_SUCCESS, handleCreateSuccess);
    eventEmitter.on(TEMPLATE_EVENTS.UPDATE_SUCCESS, handleUpdateSuccess);
    eventEmitter.on(TEMPLATE_EVENTS.DUPLICATE_SUCCESS, handleDuplicateSuccess);

    return () => {
      eventEmitter.off(TEMPLATE_EVENTS.CREATE_SUCCESS, handleCreateSuccess);
      eventEmitter.off(TEMPLATE_EVENTS.UPDATE_SUCCESS, handleUpdateSuccess);
      eventEmitter.off(TEMPLATE_EVENTS.DUPLICATE_SUCCESS, handleDuplicateSuccess);
    };
  }, [eventEmitter]);

  const create = useCallback(
    (payload) => {
      templatesController.createTemplate(eventEmitter, payload);
    },
    [eventEmitter],
  );

  const update = useCallback(
    (templateId, payload) => {
      templatesController.updateTemplate(eventEmitter, templateId, payload);
    },
    [eventEmitter],
  );

  // Optimistic: the row disappears immediately and comes back if the
  // delete fails.
  const remove = useCallback(
    (templateId) => {
      let snapshot = [];
      setTemplates((list) => {
        snapshot = list;
        return list.filter((t) => t._id !== templateId);
      });
      eventEmitter.once(TEMPLATE_EVENTS.DELETE_FAILURE, () => {
        setTemplates(snapshot);
      });
      templatesController.deleteTemplate(eventEmitter, templateId);
    },
    [eventEmitter],
  );

  const duplicate = useCallback(
    (templateId, newName) => {
      templatesController.duplicateTemplate(eventEmitter, templateId, newName);
    },
    [eventEmitter],
  );

  // Optimistic — the star is cosmetic, so it flips immediately and rolls
  // back on failure without waiting on the request.
  const toggleFavorite = useCallback(
    (template) => {
      const { _id, isFavorite } = template;
      setTemplates((list) => list.map((t) => (t._id === _id ? { ...t, isFavorite: !isFavorite } : t)));
      eventEmitter.once(TEMPLATE_EVENTS.TOGGLE_FAVORITE_FAILURE, () => {
        setTemplates((list) => list.map((t) => (t._id === _id ? { ...t, isFavorite } : t)));
      });
      templatesController.toggleFavorite(eventEmitter, _id);
    },
    [eventEmitter],
  );

  /* Reported twice on purpose: the inline block the page renders (which
     persists next to the empty table) and one toast (which catches the eye
     if that block is off screen). The toast gets fixed copy — the server's
     text goes inline, where there's room for it. */
  useErrorToast(error, "Couldn't load your templates");

  return {
    templates,
    loading,
    error,
    eventEmitter,
    refresh: load,
    create,
    update,
    remove,
    duplicate,
    toggleFavorite,
  };
}
