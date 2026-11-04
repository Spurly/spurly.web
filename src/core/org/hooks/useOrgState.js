import { useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import { useAuth } from 'src/core/auth/hooks/useAuth.js';
import { isOrgSessionFor } from 'src/shared/utils/orgSession.js';
import orgController from '../controller/org.js';
import { ORG_EVENTS, ORG_STATE_NONE } from '../constants/constants.js';

/**
 * Is the signed-in user an organization member, and which workspace features are on?
 * Answered by the server (`GET /org/state`), once per user per page load and shared by every
 * component that asks, so a solo user costs exactly one request and a member gets the same
 * answer however they signed in (password, Google, extension, a second browser).
 * The browser marker set by the org sign-in is only a first guess until the answer arrives; a
 * failed request means "not a member" (nobody is signed out or blocked by it). Managed
 * (partner) sessions never ask.
 */

const known = new Map(); // userId -> { isMember, workspaceEnabled, features }
const asking = new Map(); // userId -> Set of subscribers, while a request is in flight

export function resetOrgState() {
  known.clear();
  asking.clear();
}

function ask(userId, onAnswer) {
  if (asking.has(userId)) {
    asking.get(userId).add(onAnswer);
    return;
  }
  asking.set(userId, new Set([onAnswer]));
  const emitter = new EventEmitter();
  const finish = (state) => {
    known.set(userId, state);
    const subscribers = asking.get(userId) || [];
    asking.delete(userId);
    for (const notify of subscribers) notify(state);
  };
  emitter.on(ORG_EVENTS.STATE_LOADED, (data) => finish({
    isMember: Boolean(data?.isMember),
    workspaceEnabled: Boolean(data?.workspaceEnabled),
    features: { ...ORG_STATE_NONE.features, ...(data?.features || {}) },
  }));
  emitter.on(ORG_EVENTS.STATE_FAILED, () => finish(ORG_STATE_NONE));
  orgController.loadState(emitter);
}

export function useOrgState() {
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;
  const skip = !userId || Boolean(user?.isManaged);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (skip || known.has(userId)) return undefined;
    let live = true;
    ask(userId, () => { if (live) setTick((n) => n + 1); });
    return () => { live = false; };
  }, [skip, userId]);

  const answer = skip ? ORG_STATE_NONE : known.get(userId);
  return useMemo(() => {
    if (answer) return { ...answer, loaded: true };
    return { isMember: isOrgSessionFor(user), workspaceEnabled: false, features: ORG_STATE_NONE.features, loaded: false };
  }, [answer, user]);
}
