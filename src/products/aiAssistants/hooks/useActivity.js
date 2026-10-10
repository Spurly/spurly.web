import { useCallback, useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import controller from '../controller/aiAssistantsController.js';
import { AI_EVENTS as E } from '../constants/constants.js';

/** The last few things assistants did on this account (names and outcomes only). */
export function useActivity() {
  const emitter = useMemo(() => new EventEmitter(), []);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onList = ({ calls: list }) => {
      setCalls(list);
      setLoading(false);
    };
    const onFail = (err) => {
      setError(err);
      setLoading(false);
    };
    emitter.on(E.ACTIVITY_SUCCESS, onList);
    emitter.on(E.ACTIVITY_FAILURE, onFail);
    controller.loadActivity(emitter);
    return () => {
      emitter.off(E.ACTIVITY_SUCCESS, onList);
      emitter.off(E.ACTIVITY_FAILURE, onFail);
    };
  }, [emitter]);

  const refresh = useCallback(() => {
    setLoading(true);
    controller.loadActivity(emitter);
  }, [emitter]);
  return { calls, loading, error, refresh };
}
