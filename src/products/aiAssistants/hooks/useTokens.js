import { useCallback, useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import controller from '../controller/aiAssistantsController.js';
import { AI_EVENTS as E } from '../constants/constants.js';

/**
 * The user's personal access tokens. `createdSecret` holds the plaintext of the token just made
 * (the API shows it once); the caller clears it with `dismissSecret`. No async or try/catch here.
 */
export function useTokens() {
  const emitter = useMemo(() => new EventEmitter(), []);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState(null);

  useEffect(() => {
    const onList = ({ tokens: list }) => {
      setTokens(list);
      setLoading(false);
      setError(null);
    };
    const onListFail = (err) => {
      setError(err);
      setLoading(false);
    };
    const onCreated = ({ secret, apiToken }) => {
      setTokens((list) => [apiToken, ...list]);
      setCreatedSecret({ secret, name: apiToken.name });
      setCreating(false);
    };
    const onCreateFail = () => setCreating(false);
    const onRevoked = ({ id }) => setTokens((list) => list.filter((t) => t.id !== id));

    emitter.on(E.TOKENS_SUCCESS, onList);
    emitter.on(E.TOKENS_FAILURE, onListFail);
    emitter.on(E.CREATE_SUCCESS, onCreated);
    emitter.on(E.CREATE_FAILURE, onCreateFail);
    emitter.on(E.REVOKE_SUCCESS, onRevoked);
    controller.loadTokens(emitter);
    return () => {
      emitter.off(E.TOKENS_SUCCESS, onList);
      emitter.off(E.TOKENS_FAILURE, onListFail);
      emitter.off(E.CREATE_SUCCESS, onCreated);
      emitter.off(E.CREATE_FAILURE, onCreateFail);
      emitter.off(E.REVOKE_SUCCESS, onRevoked);
    };
  }, [emitter]);

  const create = useCallback(
    ({ name, scopes, expiresInDays }) => {
      setCreating(true);
      const payload = { name, scopes };
      if (expiresInDays) payload.expiresInDays = Number(expiresInDays);
      controller.createToken(emitter, payload);
    },
    [emitter],
  );
  const revoke = useCallback((id) => controller.revokeToken(emitter, id), [emitter]);
  const dismissSecret = useCallback(() => setCreatedSecret(null), []);

  return { tokens, loading, error, creating, createdSecret, create, revoke, dismissSecret, emitter };
}
