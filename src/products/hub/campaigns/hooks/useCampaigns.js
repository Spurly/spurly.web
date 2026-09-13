import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast, useConfirm } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import campaignController from '../controller/campaign.js';

const POLL_MS = 10000;

/** Only a running campaign has anything new to report. */
export const isLive = (c) => c?.status === 'running';

/**
 * All state for the campaigns list page: the list itself, polling while
 * anything is running, and the three row actions (start / pause / remove).
 *
 * `remove` owns its own confirmation dialog rather than leaving that to the
 * page, so a page just does `onDelete={remove}` and never has to know a
 * confirm step exists.
 */
export function useCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  const mountedRef = useRef(true);
  /**
   * Set on every mount, not only cleared on unmount.
   *
   * StrictMode mounts, unmounts and remounts in development. A cleanup-only
   * version leaves this false for the life of the real mount, so every "am I
   * still on screen?" guard fails, every response is discarded, and the page
   * sits on its loading state over requests that plainly succeeded. It is
   * invisible in production, where the double invoke does not happen — which
   * is exactly what makes it worth a comment.
   */
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => campaignController.listCampaigns()
    .then((next) => { if (mountedRef.current) setCampaigns(next); })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load your campaigns')); })
    .finally(() => { if (mountedRef.current) setLoading(false); }), [toast]);

  useEffect(() => { load(); }, [load]);

  /**
   * Poll only while something is running, and slowly.
   *
   * Sending is measured in a handful an hour; a fast timer against a page most
   * users leave open would be a lot of requests to watch a number that changes
   * every few minutes at best. The tick carries no abort signal deliberately —
   * see the same note on the leads page, where an aborted final tick left the
   * table empty over a finished import.
   */
  const anyLive = campaigns.some(isLive);
  useEffect(() => {
    if (!anyLive) return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [anyLive, load]);

  const act = async (fn, okMessage, failMessage) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMessage);
      await load();
    } catch (err) {
      toast.error(getToastError(err, failMessage));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const start = (campaign) => act(
    () => campaignController.startCampaign(campaign._id),
    'Started. Sending is paced through your working hours.',
    'Could not start that campaign',
  );

  const pause = (campaign) => act(
    () => campaignController.pauseCampaign(campaign._id),
    'Paused. Nobody else will be contacted.',
    'Could not pause that campaign',
  );

  const remove = async (campaign) => {
    const invited = campaign.counts?.invited ?? 0;
    const ok = await confirm({
      title: 'Remove this campaign?',
      // Says exactly what does NOT go away. Invitations already sent cannot be
      // taken back and still count against LinkedIn's weekly allowance, so a
      // vague "are you sure" would leave the user thinking deletion undoes them.
      body: invited
        ? `The ${invited.toLocaleString()} invitation(s) it already sent stay sent, and stay in your activity. Only the campaign and its queue are removed.`
        : 'Nothing has been sent from this campaign, so nothing is undone. The queue is removed.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    act(
      () => campaignController.deleteCampaign(campaign._id),
      'Campaign removed',
      'Could not remove that campaign',
    );
  };

  return { campaigns, loading, busy, start, pause, remove };
}
