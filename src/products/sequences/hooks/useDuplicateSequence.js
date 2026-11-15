import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import sequenceController from '../controller/sequence.js';
import { SEQUENCE_EVENTS } from '../constants/constants.js';

/** "Edit flow" on a running or paused sequence: its plan is locked, so this makes a draft copy and opens it. */
export function useDuplicateSequence(id) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const navigate = useNavigate();
  const toast = useToast();
  const mountedRef = useRef(true);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    function onDone(copy) {
      if (!mountedRef.current) return;
      setDuplicating(false);
      toast.success('Made a copy you can edit. The original keeps running as it is.');
      navigate(`/hub/sequences/${copy._id || copy.id}`);
    }
    function onFail(error) {
      if (!mountedRef.current) return;
      setDuplicating(false);
      toast.error(getToastError(error, 'Could not copy the sequence'));
    }
    eventEmitter.on(SEQUENCE_EVENTS.DUPLICATE_SUCCESS, onDone);
    eventEmitter.on(SEQUENCE_EVENTS.DUPLICATE_FAILURE, onFail);
    return () => {
      mountedRef.current = false;
      eventEmitter.off(SEQUENCE_EVENTS.DUPLICATE_SUCCESS, onDone);
      eventEmitter.off(SEQUENCE_EVENTS.DUPLICATE_FAILURE, onFail);
    };
  }, [eventEmitter, navigate, toast]);

  const duplicate = useCallback(() => {
    setDuplicating(true);
    sequenceController.duplicateSequence(eventEmitter, id);
  }, [eventEmitter, id]);

  return { duplicate, duplicating };
}
