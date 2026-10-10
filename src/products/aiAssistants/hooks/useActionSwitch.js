import { useCallback, useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import controller from '../controller/aiAssistantsController.js';
import { AI_EVENTS as E } from '../constants/constants.js';

/** The account-wide "Allow AI assistants to take actions" switch. Off until the user turns it on. */
export function useActionSwitch() {
  const emitter = useMemo(() => new EventEmitter(), []);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onValue = ({ enabled: value }) => {
      setEnabled(value);
      setLoading(false);
      setSaving(false);
      setError(null);
    };
    const onFail = (err) => {
      setError(err);
      setLoading(false);
      setSaving(false);
    };
    emitter.on(E.SWITCH_SUCCESS, onValue);
    emitter.on(E.SWITCH_FAILURE, onFail);
    controller.loadActionSwitch(emitter);
    return () => {
      emitter.off(E.SWITCH_SUCCESS, onValue);
      emitter.off(E.SWITCH_FAILURE, onFail);
    };
  }, [emitter]);

  const change = useCallback(
    (next) => {
      setSaving(true);
      controller.setActionSwitch(emitter, next);
    },
    [emitter],
  );
  return { enabled, loading, saving, error, change };
}
