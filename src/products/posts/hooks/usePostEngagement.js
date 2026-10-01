import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from 'src/core/primitives';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import hubPostsController from '../controller/posts.js';
import { POSTS_EVENTS as E } from '../constants/constants.js';
import { errorText } from 'src/products/invitations/hooks/useInvitationsPage.js';

const empty = { items: [], cursor: null, total: null, loading: false, loaded: false };

/**
 * Comments and reactions on one post (read live from LinkedIn). Opened on
 * demand: each list is a vendor read, so nothing loads until the person asks.
 */
export function usePostEngagement(socialId) {
  const em = useMemo(() => new EventEmitter(), []);
  const toast = useToast();
  const [comments, setComments] = useState(empty);
  const [reactions, setReactions] = useState(empty);

  useEffect(() => {
    const merge = (setter) => ({ data, append }) => setter((prev) => ({
      items: append ? [...prev.items, ...(data.items ?? [])] : (data.items ?? []),
      cursor: data.cursor ?? null,
      total: data.total ?? null,
      loading: false,
      loaded: true,
    }));
    const fail = (setter, label) => (e) => { setter((prev) => ({ ...prev, loading: false })); toast.error(errorText(e.error, label)); };
    const handlers = {
      [E.COMMENTS_SUCCESS]: merge(setComments),
      [E.COMMENTS_FAILURE]: fail(setComments, 'Could not read the comments'),
      [E.REACTIONS_SUCCESS]: merge(setReactions),
      [E.REACTIONS_FAILURE]: fail(setReactions, 'Could not read the reactions'),
    };
    Object.entries(handlers).forEach(([event, fn]) => em.on(event, fn));
    return () => Object.entries(handlers).forEach(([event, fn]) => em.off(event, fn));
  }, [em, toast]);

  const loadComments = useCallback((cursor) => {
    setComments((prev) => ({ ...prev, loading: true }));
    hubPostsController.listComments(em, { socialId, cursor });
  }, [em, socialId]);

  const loadReactions = useCallback((cursor) => {
    setReactions((prev) => ({ ...prev, loading: true }));
    hubPostsController.listReactions(em, { socialId, cursor });
  }, [em, socialId]);

  return { comments, reactions, loadComments, loadReactions };
}
