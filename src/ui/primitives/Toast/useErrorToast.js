import { useEffect, useRef } from 'react';
import { useToast } from './useToast';
import { getToastError } from 'src/common/utils/apiError';

/**
 * Toast a data hook's load failure, in the app's own words.
 *
 * Data hooks own an `error` string that pages render inline next to an empty
 * table. That inline block is the right home for the server's full text — it
 * persists, and an empty table with no explanation reads as "you have no data"
 * rather than "we couldn't fetch it". The toast is the other half: one short,
 * fixed sentence naming the list that failed.
 *
 *   const { campaigns, error } = useCampaigns();
 *   useErrorToast(error, "Couldn't load campaigns");
 *
 * `label` is not optional in practice. Passing the raw error through was the
 * original bug: the toast became a place for server diagnostics to surface,
 * which is what `getToastError` now guards against.
 *
 * Fires only when the message changes, so a 4s poll that keeps failing doesn't
 * bury the screen — and re-arms once the error clears, so a real second failure
 * after a recovery is still reported.
 */
export function useErrorToast(error, label) {
  const toast = useToast();
  const lastRef = useRef(null);

  useEffect(() => {
    if (!error) {
      lastRef.current = null;
      return;
    }
    if (lastRef.current === error) return;

    lastRef.current = error;
    toast.error(getToastError(error, label));
  }, [error, label, toast]);
}
