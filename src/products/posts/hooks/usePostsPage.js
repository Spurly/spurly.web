import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast, useConfirm } from 'src/core/primitives';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import hubPostsController from '../controller/posts.js';
import { POSTS_EVENTS as E, DEFAULT_RULE, POST_MAX, POST_MEDIA } from '../constants/constants.js';
import { errorText, failureKind } from 'src/products/invitations/hooks/useInvitationsPage.js';

/**
 * State for the Posts page: compose (now / scheduled / with one image or video),
 * your posts, daily usage and the bulk-like rule (off by default). Nothing is
 * optimistic: a post appears in the list only after the server says so.
 *
 * A post that LinkedIn never confirmed is NOT offered a retry (the server marks
 * it failed + unsafe): publishing twice in public is worse than a missed post.
 */
export function usePostsPage() {
  const em = useMemo(() => new EventEmitter(), []);
  const toast = useToast();
  const confirm = useConfirm();

  const [tab, setTab] = useState('posts');
  const [own, setOwn] = useState({ posts: [], loading: true, failed: false });
  const [usage, setUsage] = useState({});
  const [needsAccount, setNeedsAccount] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [composerKey, setComposerKey] = useState(0); // bumped on success to reset the composer
  const [rule, setRule] = useState({ data: DEFAULT_RULE, audiences: [], loading: false, loaded: false, saving: false });
  const [cancelling, setCancelling] = useState(() => new Set());

  const loadOwn = useCallback(() => hubPostsController.listOwn(em), [em]);

  useEffect(() => {
    const flagAccount = (error) => { if (failureKind(error) === 'account') setNeedsAccount(true); };
    const handlers = {
      [E.OWN_SUCCESS]: ({ data }) => setOwn({ posts: data.posts ?? [], loading: false, failed: false }),
      [E.OWN_FAILURE]: ({ error }) => { setOwn((prev) => ({ ...prev, loading: false, failed: true })); flagAccount(error); },
      [E.USAGE_SUCCESS]: ({ data }) => { setUsage(data.usage ?? {}); if (data.connected === false) setNeedsAccount(true); },
      [E.USAGE_FAILURE]: () => {},
      [E.PUBLISH_SUCCESS]: ({ scheduled }) => {
        setPublishing(false);
        setComposerKey((k) => k + 1);
        toast.success(scheduled ? 'Scheduled' : 'Posted');
        hubPostsController.listOwn(em);
        hubPostsController.getUsage(em);
      },
      [E.PUBLISH_FAILURE]: ({ error, code }) => {
        setPublishing(false);
        flagAccount(error);
        toast.error(code === 'POST_UNCONFIRMED' || code === 'SEND_UNCONFIRMED'
          ? 'LinkedIn did not confirm that post. Check your profile before posting again: it may have gone out.'
          : errorText(error, 'Could not publish that post'));
        hubPostsController.listOwn(em);
      },
      [E.CANCEL_SUCCESS]: ({ postId }) => {
        setCancelling((prev) => { const n = new Set(prev); n.delete(postId); return n; });
        toast.success('Cancelled');
        hubPostsController.listOwn(em);
      },
      [E.CANCEL_FAILURE]: ({ postId, error }) => {
        setCancelling((prev) => { const n = new Set(prev); n.delete(postId); return n; });
        toast.error(errorText(error, 'Could not cancel that post'));
        hubPostsController.listOwn(em);
      },
      [E.AUDIENCES_SUCCESS]: ({ data }) => setRule((prev) => ({ ...prev, audiences: data ?? [] })),
      [E.AUDIENCES_FAILURE]: () => {},
      [E.RULE_SUCCESS]: ({ data }) => setRule((prev) => ({ ...prev, data, loading: false, loaded: true })),
      [E.RULE_FAILURE]: ({ error }) => { setRule((prev) => ({ ...prev, loading: false })); toast.error(errorText(error, 'Could not load your rule')); },
      [E.RULE_SAVE_SUCCESS]: ({ data }) => { setRule((prev) => ({ ...prev, data, saving: false })); toast.success('Saved'); },
      [E.RULE_SAVE_FAILURE]: ({ error }) => { setRule((prev) => ({ ...prev, saving: false })); toast.error(errorText(error, 'Could not save your rule')); },
    };
    Object.entries(handlers).forEach(([event, fn]) => em.on(event, fn));
    hubPostsController.listOwn(em);
    hubPostsController.getUsage(em);
    return () => Object.entries(handlers).forEach(([event, fn]) => em.off(event, fn));
  }, [em, toast]);

  const openTab = useCallback((next) => {
    setTab(next);
    if (next === 'rule' && !rule.loaded && !rule.loading) {
      setRule((prev) => ({ ...prev, loading: true }));
      hubPostsController.getRule(em);
      hubPostsController.listAudiences(em);
    }
  }, [em, rule.loaded, rule.loading]);

  /** `when` is an ISO string or empty. Client checks are for a fast answer; the server re-validates. */
  const publish = useCallback(({ text, when }) => {
    const body = String(text ?? '').trim();
    if (!body || publishing) return;
    if (body.length > POST_MAX) { toast.error(`A post is limited to ${POST_MAX} characters.`); return; }
    setPublishing(true);
    hubPostsController.publish(em, { text: body, scheduledFor: when || undefined });
  }, [em, publishing, toast]);

  const publishMedia = useCallback(({ text, kind, file }) => {
    const limit = POST_MEDIA[kind];
    if (!file || !limit || publishing) return;
    if (file.size > limit.maxMb * 1024 * 1024) { toast.error(`That file is over ${limit.maxMb} MB.`); return; }
    setPublishing(true);
    hubPostsController.publishMedia(em, { kind, file, text: String(text ?? '').trim() });
  }, [em, publishing, toast]);

  const cancel = useCallback(async (post) => {
    const ok = await confirm({ title: 'Cancel this scheduled post?', description: 'It will not be published.', confirmLabel: 'Cancel post' });
    if (!ok) return;
    setCancelling((prev) => new Set(prev).add(post._id));
    hubPostsController.cancel(em, post._id);
  }, [em, confirm]);

  const saveRule = useCallback((next) => {
    setRule((prev) => ({ ...prev, saving: true }));
    hubPostsController.saveRule(em, next);
  }, [em]);

  return { tab, openTab, own, usage, needsAccount, publishing, composerKey, rule, cancelling, publish, publishMedia, cancel, saveRule, refresh: loadOwn };
}
