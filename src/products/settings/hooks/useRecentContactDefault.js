import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import recentContactController from '../controller/recentContact.js';
import { RECENT_CONTACT_EVENTS, RECENT_CONTACT_DEFAULT } from '../constants/constants.js';

/** State for the workspace default of "skip people I've messaged recently". The controller reports by event. */
export function useRecentContactDefault(enabled = true) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [rule, setRule] = useState(RECENT_CONTACT_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const onGet = (next) => { if (next) setRule(next); setLoading(false); };
    const onGetFailure = () => setLoading(false);
    const onSet = (next) => { setSaving(false); if (next) setRule(next); toast.success('Saved. New campaigns and sequences will start with this.'); };
    const onSetFailure = (error) => { setSaving(false); toast.error(getToastError(error, "Couldn't save that")); };
    eventEmitter.on(RECENT_CONTACT_EVENTS.GET_SUCCESS, onGet);
    eventEmitter.on(RECENT_CONTACT_EVENTS.GET_FAILURE, onGetFailure);
    eventEmitter.on(RECENT_CONTACT_EVENTS.SET_SUCCESS, onSet);
    eventEmitter.on(RECENT_CONTACT_EVENTS.SET_FAILURE, onSetFailure);
    return () => {
      eventEmitter.off(RECENT_CONTACT_EVENTS.GET_SUCCESS, onGet);
      eventEmitter.off(RECENT_CONTACT_EVENTS.GET_FAILURE, onGetFailure);
      eventEmitter.off(RECENT_CONTACT_EVENTS.SET_SUCCESS, onSet);
      eventEmitter.off(RECENT_CONTACT_EVENTS.SET_FAILURE, onSetFailure);
    };
  }, [eventEmitter, toast]);

  useEffect(() => { if (enabled) recentContactController.get(eventEmitter); }, [enabled, eventEmitter]);

  const save = useCallback((next) => {
    setSaving(true);
    recentContactController.set(eventEmitter, next);
  }, [eventEmitter]);

  return { rule, loading, saving, save };
}
