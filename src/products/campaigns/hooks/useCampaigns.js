import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast, useConfirm } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import campaignController from '../controller/campaign.js';
import { POLL_MS, CAMPAIGN_EVENTS } from '../constants/constants.js';

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
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(() => {
    campaignController.listCampaigns(eventEmitter);
  }, [eventEmitter]);

  const start = useCallback((campaign) => {
    setBusy(true);
    campaignController.startCampaign(eventEmitter, campaign._id);
  }, [eventEmitter]);

  const pause = useCallback((campaign) => {
    setBusy(true);
    campaignController.pauseCampaign(eventEmitter, campaign._id);
  }, [eventEmitter]);

  const remove = useCallback((campaign) => {
    const invited = campaign.counts?.invited ?? 0;
    confirm({
      title: 'Remove this campaign?',
      // Says exactly what does NOT go away. Invitations already sent cannot be
      // taken back and still count against LinkedIn's weekly allowance, so a
      // vague "are you sure" would leave the user thinking deletion undoes them.
      body: invited
        ? `The ${invited.toLocaleString()} invitation(s) it already sent stay sent, and stay in your activity. Only the campaign and its queue are removed.`
        : 'Nothing has been sent from this campaign, so nothing is undone. The queue is removed.',
      confirmLabel: 'Remove',
    }).then((ok) => {
      if (!ok) return;
      setBusy(true);
      campaignController.deleteCampaign(eventEmitter, campaign._id);
    });
  }, [confirm, eventEmitter]);

  useEffect(() => {
    function handleListSuccess(next) {
      setCampaigns(next);
      setLoading(false);
    }
    function handleListFailure(error) {
      toast.error(getToastError(error, 'Could not load your campaigns'));
      setLoading(false);
    }
    function handleStartSuccess() {
      toast.success('Started. Sending is paced through your working hours.');
      setBusy(false);
      load();
    }
    function handleStartFailure(error) {
      toast.error(getToastError(error, 'Could not start that campaign'));
      setBusy(false);
    }
    function handlePauseSuccess() {
      toast.success('Paused. Nobody else will be contacted.');
      setBusy(false);
      load();
    }
    function handlePauseFailure(error) {
      toast.error(getToastError(error, 'Could not pause that campaign'));
      setBusy(false);
    }
    function handleDeleteSuccess() {
      toast.success('Campaign removed');
      setBusy(false);
      load();
    }
    function handleDeleteFailure(error) {
      toast.error(getToastError(error, 'Could not remove that campaign'));
      setBusy(false);
    }

    eventEmitter.on(CAMPAIGN_EVENTS.LIST_CAMPAIGNS_SUCCESS, handleListSuccess);
    eventEmitter.on(CAMPAIGN_EVENTS.LIST_CAMPAIGNS_FAILURE, handleListFailure);
    eventEmitter.on(CAMPAIGN_EVENTS.START_CAMPAIGN_SUCCESS, handleStartSuccess);
    eventEmitter.on(CAMPAIGN_EVENTS.START_CAMPAIGN_FAILURE, handleStartFailure);
    eventEmitter.on(CAMPAIGN_EVENTS.PAUSE_CAMPAIGN_SUCCESS, handlePauseSuccess);
    eventEmitter.on(CAMPAIGN_EVENTS.PAUSE_CAMPAIGN_FAILURE, handlePauseFailure);
    eventEmitter.on(CAMPAIGN_EVENTS.DELETE_CAMPAIGN_SUCCESS, handleDeleteSuccess);
    eventEmitter.on(CAMPAIGN_EVENTS.DELETE_CAMPAIGN_FAILURE, handleDeleteFailure);

    return () => {
      eventEmitter.off(CAMPAIGN_EVENTS.LIST_CAMPAIGNS_SUCCESS, handleListSuccess);
      eventEmitter.off(CAMPAIGN_EVENTS.LIST_CAMPAIGNS_FAILURE, handleListFailure);
      eventEmitter.off(CAMPAIGN_EVENTS.START_CAMPAIGN_SUCCESS, handleStartSuccess);
      eventEmitter.off(CAMPAIGN_EVENTS.START_CAMPAIGN_FAILURE, handleStartFailure);
      eventEmitter.off(CAMPAIGN_EVENTS.PAUSE_CAMPAIGN_SUCCESS, handlePauseSuccess);
      eventEmitter.off(CAMPAIGN_EVENTS.PAUSE_CAMPAIGN_FAILURE, handlePauseFailure);
      eventEmitter.off(CAMPAIGN_EVENTS.DELETE_CAMPAIGN_SUCCESS, handleDeleteSuccess);
      eventEmitter.off(CAMPAIGN_EVENTS.DELETE_CAMPAIGN_FAILURE, handleDeleteFailure);
    };
  }, [eventEmitter, load, toast]);

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

  return { campaigns, loading, busy, start, pause, remove };
}
