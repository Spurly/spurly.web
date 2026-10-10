import { useCallback, useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import controller from '../controller/aiAssistantsController.js';
import { AI_EVENTS as E } from '../constants/constants.js';

/**
 * Drives the OAuth consent screen. `params` is the authorize query as a plain object.
 * `redirectTo` appears once the user approved or denied: the page then sends the browser there.
 */
export function useConsent(params) {
  const emitter = useMemo(() => new EventEmitter(), []);
  const [client, setClient] = useState(null);
  const [requested, setRequested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);
  const key = JSON.stringify(params);

  useEffect(() => {
    const onInfo = ({ client: c, scopes }) => {
      setClient(c);
      setRequested(scopes);
      setLoading(false);
    };
    const onInfoFail = (err) => {
      setError(err);
      setLoading(false);
    };
    const onDone = ({ redirectTo: url }) => setRedirectTo(url);
    const onSubmitFail = (err) => {
      setError(err);
      setSubmitting(false);
    };
    emitter.on(E.CONSENT_INFO_SUCCESS, onInfo);
    emitter.on(E.CONSENT_INFO_FAILURE, onInfoFail);
    emitter.on(E.CONSENT_SUCCESS, onDone);
    emitter.on(E.CONSENT_FAILURE, onSubmitFail);
    controller.loadConsentInfo(emitter, JSON.parse(key));
    return () => {
      emitter.off(E.CONSENT_INFO_SUCCESS, onInfo);
      emitter.off(E.CONSENT_INFO_FAILURE, onInfoFail);
      emitter.off(E.CONSENT_SUCCESS, onDone);
      emitter.off(E.CONSENT_FAILURE, onSubmitFail);
    };
  }, [emitter, key]);

  const decide = useCallback(
    (approved, scopes = []) => {
      setSubmitting(true);
      setError(null);
      controller.submitConsent(emitter, JSON.parse(key), { approved, scopes });
    },
    [emitter, key],
  );

  return { client, requested, loading, error, submitting, redirectTo, approve: (scopes) => decide(true, scopes), deny: () => decide(false) };
}
