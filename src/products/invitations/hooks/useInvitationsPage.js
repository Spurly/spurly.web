import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast, useConfirm } from 'src/core/primitives';
import { getApiErrorMessage, getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import hubInvitationsController from '../controller/invitations.js';
import { DEFAULT_RULES, INVITATIONS_EVENTS as E } from '../constants/constants.js';

/** What a failed call means for the page: a different screen, a cap, or a plain error. */
export function failureKind(error) {
  const code = error?.code ?? error?.response?.data?.code;
  if (code === 'NO_ACCOUNT' || code === 'ACCOUNT_NOT_READY') return 'account';
  if (code === 'ACTION_CAP') return 'cap';
  return 'other';
}

/** Caps carry a sentence written for the person; everything else goes through the toast rules. */
export function errorText(error, fallback) {
  return failureKind(error) === 'cap' ? getApiErrorMessage(error, fallback) : getToastError(error, fallback);
}

const emptyList = { items: [], cursor: null, loading: true, loadingMore: false, failed: false, loaded: false };

/**
 * State for the Invitations page: Sent (live from LinkedIn, withdraw), Received
 * (live, accept / decline) and Rules (the two automations, both off by default).
 * Received and Rules load the first time their tab opens. Nothing is optimistic:
 * a row leaves the list only after the server says the action happened.
 */
export function useInvitationsPage() {
  const em = useMemo(() => new EventEmitter(), []);
  const toast = useToast();
  const confirm = useConfirm();

  const [tab, setTabState] = useState('sent');
  const [sent, setSent] = useState(emptyList);
  const [staleAfterDays, setStaleAfterDays] = useState(21);
  const [received, setReceived] = useState({ ...emptyList, loading: false });
  const [rules, setRules] = useState({ data: DEFAULT_RULES, loading: false, loaded: false, saving: false });
  const [usage, setUsage] = useState({});
  const [needsAccount, setNeedsAccount] = useState(false);
  const [busy, setBusy] = useState(() => new Set());

  const appendRef = useRef({ sent: false, received: false });
  const loadedRef = useRef({ received: false, rules: false });

  const markBusy = useCallback((id, on) => {
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const guard = useCallback((error) => {
    if (failureKind(error) === 'account') { setNeedsAccount(true); return true; }
    return false;
  }, []);

  useEffect(() => {
    const handlers = {
      [E.GET_SENT_SUCCESS]: (d) => {
        setNeedsAccount(false);
        setStaleAfterDays(d.staleAfterDays ?? 21);
        setSent((prev) => ({
          items: appendRef.current.sent ? [...prev.items, ...d.items] : d.items,
          cursor: d.cursor, loading: false, loadingMore: false, failed: false, loaded: true,
        }));
        appendRef.current.sent = false;
      },
      [E.GET_SENT_FAILURE]: (error) => {
        appendRef.current.sent = false;
        setSent((prev) => ({ ...prev, loading: false, loadingMore: false, failed: !guard(error), loaded: true }));
        if (failureKind(error) !== 'account') toast.error(errorText(error, 'Could not read your sent invitations'));
      },
      [E.WITHDRAW_SUCCESS]: ({ invitationId }) => {
        markBusy(invitationId, false);
        setSent((prev) => ({ ...prev, items: prev.items.filter((i) => i.unipileInvitationId !== invitationId) }));
        toast.success('Invitation withdrawn');
        hubInvitationsController.getUsage(em);
      },
      [E.WITHDRAW_FAILURE]: (error) => {
        setBusy(new Set());
        toast.error(errorText(error, 'Could not withdraw this invitation'));
      },
      [E.GET_RECEIVED_SUCCESS]: (d) => {
        setNeedsAccount(false);
        setReceived((prev) => ({
          items: appendRef.current.received ? [...prev.items, ...d.items] : d.items,
          cursor: d.cursor, loading: false, loadingMore: false, failed: false, loaded: true,
        }));
        appendRef.current.received = false;
      },
      [E.GET_RECEIVED_FAILURE]: (error) => {
        appendRef.current.received = false;
        setReceived((prev) => ({ ...prev, loading: false, loadingMore: false, failed: !guard(error), loaded: true }));
        if (failureKind(error) !== 'account') toast.error(errorText(error, 'Could not read your incoming invitations'));
      },
      [E.RESPOND_SUCCESS]: ({ invitationId, action }) => {
        markBusy(invitationId, false);
        setReceived((prev) => ({ ...prev, items: prev.items.filter((i) => i.unipileInvitationId !== invitationId) }));
        toast.success(action === 'accept' ? 'Invitation accepted' : 'Invitation declined');
        hubInvitationsController.getUsage(em);
      },
      [E.RESPOND_FAILURE]: (error) => {
        setBusy(new Set());
        toast.error(errorText(error, 'Could not answer this invitation'));
      },
      [E.GET_RULES_SUCCESS]: (data) => setRules((prev) => ({ ...prev, data, loading: false, loaded: true })),
      [E.GET_RULES_FAILURE]: (error) => {
        setRules((prev) => ({ ...prev, loading: false }));
        toast.error(errorText(error, 'Could not load your rules'));
      },
      [E.SAVE_RULES_SUCCESS]: (data) => {
        setRules((prev) => ({ ...prev, data, saving: false }));
        toast.success('Rules saved');
      },
      [E.SAVE_RULES_FAILURE]: (error) => {
        setRules((prev) => ({ ...prev, saving: false }));
        toast.error(getApiErrorMessage(error, 'Could not save your rules'));
      },
      [E.GET_USAGE_SUCCESS]: (d) => setUsage(d.usage ?? {}),
      [E.GET_USAGE_FAILURE]: () => {},
    };
    Object.entries(handlers).forEach(([event, fn]) => em.on(event, fn));
    return () => Object.entries(handlers).forEach(([event, fn]) => em.off(event, fn));
  }, [em, toast, guard, markBusy]);

  useEffect(() => {
    hubInvitationsController.getSent(em, {});
    hubInvitationsController.getUsage(em);
  }, [em]);

  const setTab = useCallback((id) => {
    setTabState(id);
    if (id === 'received' && !loadedRef.current.received) {
      loadedRef.current.received = true;
      setReceived((prev) => ({ ...prev, loading: true }));
      hubInvitationsController.getReceived(em, {});
    }
    if (id === 'rules' && !loadedRef.current.rules) {
      loadedRef.current.rules = true;
      setRules((prev) => ({ ...prev, loading: true }));
      hubInvitationsController.getRules(em);
    }
  }, [em]);

  const refresh = useCallback(() => {
    if (tab === 'sent') {
      setSent((prev) => ({ ...prev, loading: true }));
      hubInvitationsController.getSent(em, {});
    } else if (tab === 'received') {
      setReceived((prev) => ({ ...prev, loading: true }));
      hubInvitationsController.getReceived(em, {});
    }
  }, [em, tab]);

  const loadMore = useCallback((which) => {
    const list = which === 'sent' ? sent : received;
    if (!list.cursor || list.loadingMore) return;
    appendRef.current[which] = true;
    (which === 'sent' ? setSent : setReceived)((prev) => ({ ...prev, loadingMore: true }));
    (which === 'sent' ? hubInvitationsController.getSent : hubInvitationsController.getReceived)(em, { cursor: list.cursor });
  }, [em, sent, received]);

  const withdraw = useCallback(async (invitation) => {
    const ok = await confirm({
      title: 'Withdraw this invitation?',
      body: `${invitation.invitedName || 'This person'} will no longer see your request. LinkedIn may stop you inviting them again for a few weeks.`,
      confirmLabel: 'Withdraw',
    });
    if (!ok) return;
    markBusy(invitation.unipileInvitationId, true);
    hubInvitationsController.withdraw(em, invitation.unipileInvitationId);
  }, [confirm, em, markBusy]);

  const respond = useCallback(async (invitation, action) => {
    if (action === 'decline') {
      const ok = await confirm({
        title: 'Decline this invitation?',
        body: `${invitation.inviterName || 'This person'} is not told, and the request is removed from your list.`,
        confirmLabel: 'Decline',
      });
      if (!ok) return;
    }
    markBusy(invitation.unipileInvitationId, true);
    hubInvitationsController.respond(em, { invitationId: invitation.unipileInvitationId, action, sharedSecret: invitation.sharedSecret });
  }, [confirm, em, markBusy]);

  const saveRules = useCallback((next) => {
    setRules((prev) => ({ ...prev, saving: true }));
    hubInvitationsController.saveRules(em, { autoWithdraw: next.autoWithdraw, autoAccept: next.autoAccept });
  }, [em]);

  return {
    tab, setTab, sent, received, rules, usage, staleAfterDays, needsAccount, busy,
    refresh, loadMore, withdraw, respond, saveRules,
  };
}
