import { useCallback, useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import controller from '../controller/aiAssistantsController.js';
import { AI_EVENTS as E } from '../constants/constants.js';

/** Apps the user connected through the sign-in flow (Claude.ai and friends). */
export function useConnectedApps() {
  const emitter = useMemo(() => new EventEmitter(), []);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onList = ({ apps: list }) => {
      setApps(list);
      setLoading(false);
    };
    const onFail = (err) => {
      setError(err);
      setLoading(false);
    };
    const onGone = ({ id }) => setApps((list) => list.filter((a) => a.id !== id));
    emitter.on(E.APPS_SUCCESS, onList);
    emitter.on(E.APPS_FAILURE, onFail);
    emitter.on(E.DISCONNECT_SUCCESS, onGone);
    controller.loadConnectedApps(emitter);
    return () => {
      emitter.off(E.APPS_SUCCESS, onList);
      emitter.off(E.APPS_FAILURE, onFail);
      emitter.off(E.DISCONNECT_SUCCESS, onGone);
    };
  }, [emitter]);

  const disconnect = useCallback((id) => controller.disconnectApp(emitter, id), [emitter]);
  return { apps, loading, error, disconnect, emitter };
}
