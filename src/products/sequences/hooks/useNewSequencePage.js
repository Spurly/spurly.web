import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import sequenceController from '../controller/sequence.js';
import { SEQUENCE_EVENTS } from '../constants/constants.js';
import { makeStep, stepsError } from '../stepTypes.js';

/**
 * State for the new-sequence page: local-only until "Create sequence" is
 * pressed, matching the backend's own requirement that a sequence needs at
 * least one valid step to save at all.
 */
export function useNewSequencePage() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [name, setName] = useState('');
  const [steps, setSteps] = useState(() => [makeStep('connect')]);
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const validationError = stepsError(steps);
  // The steps must be valid before there's anything worth naming — but the
  // name itself is collected later, in the "name this sequence" dialog
  // shown when "Create sequence" is pressed, not up front on the page.
  const canCreate = !validationError && !creating;

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
    if (!trimmedName || validationError || creating) return;
    setCreating(true);
    sequenceController.createSequence(eventEmitter, { name: trimmedName, steps });
  }, [name, validationError, creating, eventEmitter, steps]);

  return { name, setName, steps, setSteps, creating, validationError, canCreate, create };
}
