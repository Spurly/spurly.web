import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import { setDraftDirty } from 'src/shared/orgAccount/draftGuard.js';
import { getKnownAccounts } from 'src/shared/orgAccount/activeAccount.js';
import campaignController from '../controller/campaign.js';
import sequenceController from 'src/products/sequences/controller/sequence.js';
import { CAMPAIGN_EVENTS } from '../constants/constants.js';
import { SEQUENCE_EVENTS } from 'src/products/sequences/constants/constants.js';
import { senderPoolReducer, initialPoolState, validatePool, POOL_ACTIONS } from '../senderPool/reducer.js';

/**
 * State for choosing several accounts to send from, and the read-only preview of who would send to whom.
 *
 *   kind 'campaign' → previewCampaign({ accountIds, type, leadIds, searchId })
 *   kind 'sequence' → previewSequence({ accountIds, steps?, sequenceId?, leadIds, searchId })
 *
 * The preview writes nothing. While accounts are ticked the draft is marked dirty (D60) so the "Acting as" switch asks
 * before it throws the choice away.
 */
export function useSenderPool({ kind = 'campaign', draftKey = 'sender-pool' } = {}) {
  const [state, dispatch] = useReducer(senderPoolReducer, initialPoolState);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const run = useRef(0);

  const accounts = useMemo(() => getKnownAccounts().accounts, []);
  const validation = useMemo(() => validatePool(state.selected), [state.selected]);

  useEffect(() => {
    setDraftDirty(draftKey, state.selected.length > 0);
    return () => setDraftDirty(draftKey, false);
  }, [draftKey, state.selected.length]);

  const toggle = useCallback((id) => {
    run.current += 1; // a changed selection makes any preview in flight stale
    setPreview(null);
    setError(null);
    setLoading(false);
    dispatch({ type: POOL_ACTIONS.TOGGLE, id });
  }, []);

  const reset = useCallback(() => {
    run.current += 1;
    setPreview(null);
    setError(null);
    setLoading(false);
    dispatch({ type: POOL_ACTIONS.CLEAR });
  }, []);

  const requestPreview = useCallback((params = {}) => {
    if (!validation.ok) return;
    const mine = ++run.current;
    const emitter = new EventEmitter();
    const [okEvent, failEvent, controller, call] = kind === 'sequence'
      ? [SEQUENCE_EVENTS.PREVIEW_SEQUENCE_SUCCESS, SEQUENCE_EVENTS.PREVIEW_SEQUENCE_FAILURE, sequenceController, 'previewSequence']
      : [CAMPAIGN_EVENTS.PREVIEW_CAMPAIGN_SUCCESS, CAMPAIGN_EVENTS.PREVIEW_CAMPAIGN_FAILURE, campaignController, 'previewCampaign'];
    setLoading(true);
    setError(null);
    emitter.once(okEvent, (data) => {
      if (run.current !== mine) return;
      setPreview(data);
      setLoading(false);
    });
    emitter.once(failEvent, (err) => {
      if (run.current !== mine) return;
      setError(err);
      setLoading(false);
    });
    controller[call](emitter, { ...params, accountIds: state.selected });
  }, [kind, state.selected, validation.ok]);

  return { accounts, selected: state.selected, toggle, reset, validation, preview, loading, error, requestPreview };
}
