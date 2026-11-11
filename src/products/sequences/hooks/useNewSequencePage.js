import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import sequenceController from '../controller/sequence.js';
import { SEQUENCE_EVENTS } from '../constants/constants.js';
import { makeNode, treeError, cleanExit, exitError } from '../treeModel.js';
import { useOrgState } from 'src/core/org/hooks/useOrgState.js';
import { setDraftDirty } from 'src/shared/orgAccount/draftGuard.js';
import { useSenderPool } from 'src/products/campaigns/hooks/useSenderPool.js';
import { getKnownAccounts } from 'src/shared/orgAccount/activeAccount.js';

/**
 * State for the new-sequence page: local-only until "Create sequence" is
 * pressed, matching the backend's own requirement that a sequence needs at
 * least one valid step to save at all.
 */
export function useNewSequencePage() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [name, setName] = useState('');
  const orgState = useOrgState();
  // D50/L1: an organization whose inbox is off has no reply data, so reply conditions are not offered or accepted.
  const inbox = !orgState.isMember || orgState.features.inbox === true;
  const [steps, setStepsState] = useState(() => [makeNode('connect', [])]);
  const [touched, setTouched] = useState(false);
  const [exit, setExitState] = useState({});
  const setExit = useCallback((next) => { setTouched(true); setExitState(next); }, []);
  const setSteps = useCallback((next) => { setTouched(true); setStepsState(next); }, []);
  const [creating, setCreating] = useState(false);
  // Optional: send this sequence from several accounts (an org with two or more). Nothing ticked = the acting account, as before.
  const pool = useSenderPool({ kind: 'sequence', draftKey: 'new-sequence-pool' });
  const canPool = orgState.isMember && getKnownAccounts().accounts.length >= 2;
  const poolBlocked = pool.selected.length > 0 && !pool.validation.ok;
  const toast = useToast();
  const navigate = useNavigate();

  // D60: while the draft has been edited (and not yet created), the account switch asks before discarding it.
  useEffect(() => {
    setDraftDirty('new-sequence', touched && !creating);
    return () => setDraftDirty('new-sequence', false);
  }, [touched, creating]);

  const validationError = treeError(steps, { inbox }) || exitError(exit);
  // The steps must be valid before there's anything worth naming — but the
  // name itself is collected later, in the "name this sequence" dialog
  // shown when "Create sequence" is pressed, not up front on the page.
  const canCreate = !validationError && !creating && !poolBlocked;

  useEffect(() => {
    function handleCreateSuccess(sequence) {
      setCreating(false);
      if (!sequence?._id) {
        toast.error('Could not create that sequence');
        return;
      }
      toast.success('Sequence created. Enroll leads from the leads page, then start it here.');
      navigate(`/hub/sequences/${sequence._id}`);
    }
    function handleCreateFailure(error) {
      setCreating(false);
      toast.error(getToastError(error, 'Could not create that sequence'));
    }

    eventEmitter.on(SEQUENCE_EVENTS.CREATE_SEQUENCE_SUCCESS, handleCreateSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.CREATE_SEQUENCE_FAILURE, handleCreateFailure);

    return () => {
      eventEmitter.off(SEQUENCE_EVENTS.CREATE_SEQUENCE_SUCCESS, handleCreateSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.CREATE_SEQUENCE_FAILURE, handleCreateFailure);
    };
  }, [eventEmitter, navigate, toast]);

  const create = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName || validationError || creating || poolBlocked) return;
    setCreating(true);
    sequenceController.createSequence(eventEmitter, {
      name: trimmedName, steps, exit: cleanExit(exit),
      ...(pool.selected.length >= 2 ? { accountIds: pool.selected } : {}),
    });
  }, [name, validationError, creating, eventEmitter, steps, exit, pool.selected, poolBlocked]);

  return { name, setName, steps, setSteps, creating, validationError, canCreate, create, inbox, exit, setExit, isOrg: orgState.isMember, pool, canPool, poolBlocked };
}
