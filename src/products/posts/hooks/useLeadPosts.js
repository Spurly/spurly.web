import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from 'src/core/primitives';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import hubPostsController from '../controller/posts.js';
import { POSTS_EVENTS as E } from '../constants/constants.js';
import { errorText } from 'src/products/invitations/hooks/useInvitationsPage.js';

/**
 * A lead's recent posts (lead drawer), with like / comment / AI-draft. Posts load
 * only when asked: it is a LinkedIn read. Nothing is optimistic, and an AI draft
 * only fills the box: posting a comment is always the person's own click.
 */
export function useLeadPosts(leadId) {
  const em = useMemo(() => new EventEmitter(), []);
  const toast = useToast();
  const [posts, setPosts] = useState({ items: [], loading: false, loaded: false });
  const [liked, setLiked] = useState(() => new Set());
  const [commented, setCommented] = useState(() => new Set());
  const [busy, setBusy] = useState({}); // socialId -> 'like' | 'comment' | 'draft'
  const [drafts, setDrafts] = useState({}); // socialId -> text

  const setBusyFor = useCallback((socialId, value) => setBusy((prev) => {
    const next = { ...prev };
    if (value) next[socialId] = value; else delete next[socialId];
    return next;
  }), []);

  useEffect(() => {
    const handlers = {
      [E.LEAD_POSTS_SUCCESS]: ({ data }) => setPosts({ items: data.items ?? [], loading: false, loaded: true }),
      [E.LEAD_POSTS_FAILURE]: ({ error }) => { setPosts((prev) => ({ ...prev, loading: false })); toast.error(errorText(error, 'Could not read their posts from LinkedIn')); },
      [E.LIKE_SUCCESS]: ({ socialId }) => { setBusyFor(socialId, null); setLiked((prev) => new Set(prev).add(socialId)); toast.success('Liked'); },
      [E.LIKE_FAILURE]: ({ socialId, error }) => { setBusyFor(socialId, null); toast.error(errorText(error, 'Could not like that post')); },
      [E.COMMENT_SUCCESS]: ({ socialId }) => {
        setBusyFor(socialId, null);
        setCommented((prev) => new Set(prev).add(socialId));
        setDrafts((prev) => ({ ...prev, [socialId]: '' }));
        toast.success('Comment posted');
      },
      // A comment that LinkedIn never confirmed may have gone out: say so rather than invite a double post.
      [E.COMMENT_FAILURE]: ({ socialId, error, code }) => {
        setBusyFor(socialId, null);
        toast.error(code === 'SEND_UNCONFIRMED' || code === 'POST_UNCONFIRMED'
          ? 'LinkedIn did not confirm that comment. Check the post before commenting again.'
          : errorText(error, 'Could not post that comment'));
      },
      [E.DRAFT_SUCCESS]: ({ socialId, data }) => { setBusyFor(socialId, null); setDrafts((prev) => ({ ...prev, [socialId]: data?.text ?? '' })); },
      [E.DRAFT_FAILURE]: ({ socialId, error }) => { setBusyFor(socialId, null); toast.error(errorText(error, 'Could not draft a comment')); },
    };
    Object.entries(handlers).forEach(([event, fn]) => em.on(event, fn));
    return () => Object.entries(handlers).forEach(([event, fn]) => em.off(event, fn));
  }, [em, toast, setBusyFor]);

  const load = useCallback(() => {
    setPosts((prev) => ({ ...prev, loading: true }));
    hubPostsController.listLeadPosts(em, leadId);
  }, [em, leadId]);

  const like = useCallback((socialId, reactionType = 'like') => {
    setBusyFor(socialId, 'like');
    hubPostsController.likeLeadPost(em, leadId, { socialId, reactionType });
  }, [em, leadId, setBusyFor]);

  const comment = useCallback((socialId, text) => {
    const body = String(text ?? '').trim();
    if (!body) return;
    setBusyFor(socialId, 'comment');
    hubPostsController.commentOnLeadPost(em, leadId, { socialId, text: body });
  }, [em, leadId, setBusyFor]);

  const draft = useCallback((socialId, postText, instruction = '') => {
    setBusyFor(socialId, 'draft');
    hubPostsController.draftComment(em, leadId, { socialId, postText, instruction });
  }, [em, leadId, setBusyFor]);

  const setDraftText = useCallback((socialId, text) => setDrafts((prev) => ({ ...prev, [socialId]: text })), []);

  return { posts, load, like, comment, draft, liked, commented, busy, drafts, setDraftText };
}
