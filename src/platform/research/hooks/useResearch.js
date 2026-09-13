import { useCallback, useEffect, useState } from 'react';
import researchController from '../controller/research.js';
import { useToast } from 'src/ui/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';

/**
 * Live web research about a lead and their employer.
 *
 * Read and run are kept separate on purpose — see ResearchPanel for why.
 * `get` is the free read on open (never throws: a failed or missing cached
 * briefing just means nothing to show yet); `run` is the deliberate,
 * quota-spending act, and does throw so the panel can surface what went
 * wrong.
 */
export function useResearch(personId) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    researchController
      .get(personId)
      .then((result) => {
        if (alive) setData(result);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [personId]);

  const run = useCallback(
    async (refresh = false) => {
      setRunning(true);
      setError(null);

      try {
        const result = await researchController.run(personId, refresh);
        setData(result);
        toast.success(
          refresh ? 'Research refreshed' : 'Research complete',
          result?.foundCount === 0
            ? { description: 'Nothing solid turned up for this lead.' }
            : undefined,
        );
      } catch (err) {
        /* The split that matters. Research failures are frequently operator
           diagnostics — token budgets, model names, plan tiers — so the toast
           says only what the user tried to do, and the full server text stays
           in the panel below, where there's room and it's actually useful. */
        setError(getApiErrorMessage(err, 'Research failed. Try again.'));
        toast.error(getToastError(err, "Couldn't research this lead"));
      } finally {
        setRunning(false);
      }
    },
    [personId, toast],
  );

  return { data, loading, running, error, run };
}
