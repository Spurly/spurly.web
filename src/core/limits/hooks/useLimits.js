import { useCallback, useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import limitsController from '../controller/limits.js';
import { LIMITS_EVENTS, LIMITS_POLL_MS } from '../constants/constants.js';

/**
 * The limits tracker. Loads on mount and refreshes every minute while the
 * consumer is mounted. A failed refresh keeps the numbers already on screen.
 * `savePreferences({ quietEnabled, quietStartHour, quietEndHour })` updates
 * quiet hours and reloads, so the status line reflects the change at once.
 */
export function useLimits() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const onLoad = (data) => {
      setSnapshot(data);
      setLoading(false);
      setError(null);
    };
    const onLoadFail = (message) => {
      setLoading(false);
      setError(message);
    };
    const onSave = () => {
      setSaving(false);
      setSaveError(null);
      limitsController.load(eventEmitter);
    };
    const onSaveFail = (message) => {
      setSaving(false);
      setSaveError(message);
    };
    eventEmitter.on(LIMITS_EVENTS.LOAD_SUCCESS, onLoad);
    eventEmitter.on(LIMITS_EVENTS.LOAD_FAILURE, onLoadFail);
    eventEmitter.on(LIMITS_EVENTS.SAVE_SUCCESS, onSave);
    eventEmitter.on(LIMITS_EVENTS.SAVE_FAILURE, onSaveFail);
    limitsController.load(eventEmitter);
    const timer = setInterval(() => limitsController.load(eventEmitter), LIMITS_POLL_MS);
    return () => {
      clearInterval(timer);
      eventEmitter.off(LIMITS_EVENTS.LOAD_SUCCESS, onLoad);
      eventEmitter.off(LIMITS_EVENTS.LOAD_FAILURE, onLoadFail);
      eventEmitter.off(LIMITS_EVENTS.SAVE_SUCCESS, onSave);
      eventEmitter.off(LIMITS_EVENTS.SAVE_FAILURE, onSaveFail);
    };
  }, [eventEmitter]);

  const savePreferences = useCallback(
    (preferences) => {
      setSaving(true);
      setSaveError(null);
      limitsController.savePreferences(eventEmitter, preferences);
    },
    [eventEmitter],
  );

  return { snapshot, loading, error, saving, saveError, savePreferences };
}
