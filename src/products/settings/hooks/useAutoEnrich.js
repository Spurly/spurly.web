import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import autoEnrichController from '../controller/autoEnrich.js';
import { AUTO_ENRICH_EVENTS } from '../constants/constants.js';

/**
 * State for the "Automatic enrichment" card. No try/catch or async/await: the controller reports by event.
 * Changes apply on the server first; the card shows what the server answered, never a guess (a failed save leaves
 * the control where it was and the server's own message in a toast).
 */
export function useAutoEnrich(enabled = true) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = useCallback(() => autoEnrichController.get(eventEmitter), [eventEmitter]);

  useEffect(() => {
    const onGet = (next) => { setSetting(next); setLoading(false); };
    const onGetFailure = () => setLoading(false);
    const onSet = (next) => {
      setSaving(false);
      // The write answers with the setting only; keep the range and progress the read gave us.
      setSetting((prev) => ({ ...(prev || {}), ...next }));
    };
    const onSetFailure = (error) => {
      setSaving(false);
      toast.error(getToastError(error, "Couldn't change automatic enrichment"));
    };
    eventEmitter.on(AUTO_ENRICH_EVENTS.GET_SUCCESS, onGet);
    eventEmitter.on(AUTO_ENRICH_EVENTS.GET_FAILURE, onGetFailure);
    eventEmitter.on(AUTO_ENRICH_EVENTS.SET_SUCCESS, onSet);
    eventEmitter.on(AUTO_ENRICH_EVENTS.SET_FAILURE, onSetFailure);
    return () => {
      eventEmitter.off(AUTO_ENRICH_EVENTS.GET_SUCCESS, onGet);
      eventEmitter.off(AUTO_ENRICH_EVENTS.GET_FAILURE, onGetFailure);
      eventEmitter.off(AUTO_ENRICH_EVENTS.SET_SUCCESS, onSet);
      eventEmitter.off(AUTO_ENRICH_EVENTS.SET_FAILURE, onSetFailure);
    };
  }, [eventEmitter, toast]);

  useEffect(() => { if (enabled) load(); }, [enabled, load]);

  const change = useCallback((patch) => {
    setSaving(true);
    autoEnrichController.set(eventEmitter, patch);
  }, [eventEmitter]);

  return { setting, loading, saving, change, reload: load };
}
