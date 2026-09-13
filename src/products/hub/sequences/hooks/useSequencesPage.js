import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast, useConfirm } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import sequenceController from '../controller/sequence.js';
import { POLL_MS } from '../constants.js';

/** Only a running sequence has anything left to poll for. */
export const isLive = (s) => s?.status === 'running';

/**
 * List-page state: the sequences list, plus start/pause/remove for a row.
 * Moved out of the page component unchanged — every effect and error-toast
 * path below is the same as when it lived there.
 */
export function useSequencesPage() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => sequenceController.listSequences()
    .then((next) => { if (mountedRef.current) setSequences(next); })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load your sequences')); })
    .finally(() => { if (mountedRef.current) setLoading(false); }), [toast]);

  useEffect(() => { load(); }, [load]);

  const anyLive = sequences.some(isLive);
  useEffect(() => {
    if (!anyLive) return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [anyLive, load]);

  const act = async (fn, sequence, okMessage, failMessage) => {
    setBusy(true);
    try {
      await fn(sequence._id);
      toast.success(okMessage);
      await load();
    } catch (err) {
      toast.error(getToastError(err, failMessage));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const start = (sequence) => act(
    (id) => sequenceController.startSequence(id),
    sequence,
    'Started. Steps run on their own schedule.',
    'Could not start that sequence',
  );

  const pause = (sequence) => act(
    (id) => sequenceController.pauseSequence(id),
    sequence,
    'Paused. Enrollment progress is kept.',
    'Could not pause that sequence',
  );

  const remove = async (sequence) => {
    const ok = await confirm({
      title: 'Remove this sequence?',
      body: 'Actions it already took for enrolled leads are not undone — only the sequence and its enrollment records are removed.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    act((id) => sequenceController.deleteSequence(id), sequence, 'Sequence removed', 'Could not remove that sequence');
  };

  return { sequences, loading, busy, start, pause, remove };
}
