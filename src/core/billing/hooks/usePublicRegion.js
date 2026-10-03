import { useEffect, useState } from 'react';
import subscriptionsController from '../controller/subscriptions.js';
import { SUBSCRIPTION_EVENTS } from '../constants/constants.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';

/**
 * 'IN' | 'INTL' for the visitor on a public page. Starts as 'INTL' so the
 * prerendered HTML and the first client render are identical (USD, which is
 * what Google indexes), then switches to 'IN' after hydration if the backend
 * says the visitor is in India. If the call fails the page keeps showing USD.
 * Runs in an effect, so it is skipped during prerender.
 */
export function usePublicRegion() {
  const [region, setRegion] = useState('INTL');

  useEffect(() => {
    let cancelled = false;
    const emitter = new EventEmitter();
    emitter.once(SUBSCRIPTION_EVENTS.GET_PUBLIC_REGION_SUCCESS, (value) => {
      if (!cancelled) setRegion(value);
    });
    subscriptionsController.getPublicRegion(emitter);
    return () => {
      cancelled = true;
    };
  }, []);

  return region;
}
