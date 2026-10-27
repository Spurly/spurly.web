import { useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import hubPostsController from '../controller/posts.js';
import { POSTS_EVENTS as E } from '../constants/constants.js';

/**
 * The picture (or video) attached to one of your posts. `variant` is 'preview' (small, for the
 * card) or 'file' (the real file, for the viewer). The file sits behind the login, so it is fetched
 * as a Blob and shown from an object URL that is released when the card goes away.
 *
 * status: 'loading' | 'ready' | 'failed' (a file that was deleted from Content Studio fails: the
 * card then shows a placeholder instead of a broken image).
 */
export function usePostMedia(assetId, variant = 'preview') {
  const em = useMemo(() => new EventEmitter(), []);
  const [state, setState] = useState({ url: '', status: 'loading', type: '', reason: '' });

  useEffect(() => {
    let objectUrl = '';
    const onSuccess = ({ assetId: id, variant: v, data }) => {
      if (id !== assetId || v !== variant) return;
      objectUrl = URL.createObjectURL(data);
      setState({ url: objectUrl, status: 'ready', type: data.type || '', reason: '' });
    };
    const onFailure = ({ assetId: id, variant: v, error }) => {
      if (id !== assetId || v !== variant) return;
      setState({ url: '', status: 'failed', type: '', reason: error?.message || '' });
    };
    em.on(E.MEDIA_SUCCESS, onSuccess);
    em.on(E.MEDIA_FAILURE, onFailure);
    hubPostsController.loadAsset(em, { assetId, variant });
    return () => {
      em.off(E.MEDIA_SUCCESS, onSuccess);
      em.off(E.MEDIA_FAILURE, onFailure);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [em, assetId, variant]);

  return state;
}
