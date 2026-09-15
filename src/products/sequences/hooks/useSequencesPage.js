import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast, useConfirm } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import sequenceController from '../controller/sequence.js';
import { POLL_MS, SEQUENCE_EVENTS } from '../constants/constants.js';

/** Only a running sequence has anything left to poll for. */
export const isLive = (s) => s?.status === 'running';

/**
 * List-page state: the sequences list, plus start/pause/remove for a row.
 * Moved out of the page component unchanged — every effect and error-toast
 * path below is the same as when it lived there.
 */
export function useSequencesPage() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(() => {
    sequenceController.listSequences(eventEmitter);
  }, [eventEmitter]);

  useEffect(() => {
    function handleListSuccess(next) {
      setSequences(next);
      setLoading(false);
    }
    function handleListFailure(error) {
      toast.error(getToastError(error, 'Could not load your sequences'));
      setLoading(false);
    }
    function handleStartSuccess() {
      toast.success('Started. Steps run on their own schedule.');
      setBusy(false);
      load();
    }
    function handleStartFailure(error) {
      toast.error(getToastError(error, 'Could not start that sequence'));
      setBusy(false);
    }
    function handlePauseSuccess() {
      toast.success('Paused. Enrollment progress is kept.');
      setBusy(false);
      load();
    }
    function handlePauseFailure(error) {
      toast.error(getToastError(error, 'Could not pause that sequence'));
      setBusy(false);
    }
    function handleDeleteSuccess() {
      toast.success('Sequence removed');
      setBusy(false);
      load();
    }
    function handleDeleteFailure(error) {
      toast.error(getToastError(error, 'Could not remove that sequence'));
      setBusy(false);
    }

    eventEmitter.on(SEQUENCE_EVENTS.LIST_SEQUENCES_SUCCESS, handleListSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.LIST_SEQUENCES_FAILURE, handleListFailure);
    eventEmitter.on(SEQUENCE_EVENTS.START_SEQUENCE_SUCCESS, handleStartSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.START_SEQUENCE_FAILURE, handleStartFailure);
    eventEmitter.on(SEQUENCE_EVENTS.PAUSE_SEQUENCE_SUCCESS, handlePauseSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.PAUSE_SEQUENCE_FAILURE, handlePauseFailure);
    eventEmitter.on(SEQUENCE_EVENTS.DELETE_SEQUENCE_SUCCESS, handleDeleteSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.DELETE_SEQUENCE_FAILURE, handleDeleteFailure);

    return () => {
      eventEmitter.off(SEQUENCE_EVENTS.LIST_SEQUENCES_SUCCESS, handleListSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.LIST_SEQUENCES_FAILURE, handleListFailure);
      eventEmitter.off(SEQUENCE_EVENTS.START_SEQUENCE_SUCCESS, handleStartSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.START_SEQUENCE_FAILURE, handleStartFailure);
      eventEmitter.off(SEQUENCE_EVENTS.PAUSE_SEQUENCE_SUCCESS, handlePauseSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.PAUSE_SEQUENCE_FAILURE, handlePauseFailure);
      eventEmitter.off(SEQUENCE_EVENTS.DELETE_SEQUENCE_SUCCESS, handleDeleteSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.DELETE_SEQUENCE_FAILURE, handleDeleteFailure);
    };
  }, [eventEmitter, load, toast]);

  useEffect(() => { load(); }, [load]);

  const anyLive = sequences.some(isLive);
  useEffect(() => {
    if (!anyLive) return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [anyLive, load]);

  const start = useCallback((sequence) => {
    setBusy(true);
    sequenceController.startSequence(eventEmitter, sequence._id);
  }, [eventEmitter]);

  const pause = useCallback((sequence) => {
    setBusy(true);
    sequenceController.pauseSequence(eventEmitter, sequence._id);
  }, [eventEmitter]);

  const remove = useCallback((sequence) => {
    confirm({
      title: 'Remove this sequence?',
      body: 'Actions it already took for enrolled leads are not undone — only the sequence and its enrollment records are removed.',
      confirmLabel: 'Remove',
    }).then((ok) => {
      if (!ok) return;
      setBusy(true);
      sequenceController.deleteSequence(eventEmitter, sequence._id);
    });
  }, [confirm, eventEmitter]);

  return { sequences, loading, busy, start, pause, remove };
}
