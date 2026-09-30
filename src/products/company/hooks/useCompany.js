import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import hubCompanyController from '../controller/company.js';
import { COMPANY_EVENTS } from '../constants/constants.js';

/** 'notFound' | 'noAccount' | 'throttled' | 'other' — what the page says about a failure. */
export function companyFailureKind(error) {
  const status = error?.status ?? error?.response?.status;
  const code = error?.code ?? error?.response?.data?.code;
  if (status === 404) return 'notFound';
  if (status === 409 || code === 'NO_LINKEDIN_ACCOUNT') return 'noAccount';
  if (status === 429) return 'throttled';
  return 'other';
}

/** One company by identifier (slug, numeric id or URN), with a refresh that bypasses the cache. */
export function useCompany(identifier) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const toast = useToast();
  const [state, setState] = useState({ loading: true, data: null, failure: null });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    function onSuccess(data) {
      setState({ loading: false, data, failure: null });
      setRefreshing(false);
    }
    function onFailure(error) {
      const kind = companyFailureKind(error);
      setRefreshing(false);
      // A failed refresh keeps what is on screen and says so; a failed first load is the page state.
      setState((prev) => (prev.data
        ? (toast.error(kind === 'throttled' ? 'Refreshed a moment ago. Try again shortly.' : getToastError(error, 'Could not refresh the company')), prev)
        : { loading: false, data: null, failure: kind }));
    }
    eventEmitter.on(COMPANY_EVENTS.GET_COMPANY_SUCCESS, onSuccess);
    eventEmitter.on(COMPANY_EVENTS.GET_COMPANY_FAILURE, onFailure);
    return () => {
      eventEmitter.off(COMPANY_EVENTS.GET_COMPANY_SUCCESS, onSuccess);
      eventEmitter.off(COMPANY_EVENTS.GET_COMPANY_FAILURE, onFailure);
    };
  }, [eventEmitter, toast]);

  useEffect(() => {
    if (identifier) hubCompanyController.getCompany(eventEmitter, identifier);
  }, [eventEmitter, identifier]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    hubCompanyController.getCompany(eventEmitter, identifier, { refresh: true });
  }, [eventEmitter, identifier]);

  return { ...state, refreshing, refresh };
}
