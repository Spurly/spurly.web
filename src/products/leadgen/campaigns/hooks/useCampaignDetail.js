import { useState, useEffect, useRef } from 'react';
import { useAuth } from 'src/platform/auth/useAuth.js';
import {
  insertTokenAt,
  previewValuesFor,
} from 'src/shared/utils/templateTokens.js';
import { useCampaign } from './useCampaign.js';
import { useExtension } from 'src/platform/extension/hooks/useExtension';
import { useOutreachSummary } from 'src/platform/outreach/useOutreachSummary';
import campaignsController from '../controller/campaigns.js';
import { useToast } from 'src/ui/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';
import { startCampaign, stopCampaign, pingExtension } from 'src/shared/extension/extensionBridge.js';
import { NOTE_MAX, MSG_MAX, SUBJECT_MAX } from '../constants.js';

/**
 * All state and orchestration for the campaign detail page — the action
 * config editor (note/message + templates), the launch/stop/retry flow, the
 * inline rename, and the live send-progress polling. Moved out of the page
 * component itself so the page is UI only; every effect, poll, and
 * error-toast path below is unchanged from when it lived there.
 */
export function useCampaignDetail(campaignId) {
  const { campaign, members, loading, error, refresh, update } = useCampaign(campaignId);
  const ext = useExtension();
  const toast = useToast();

  const [actionType, setActionType] = useState(null);
  const [note, setNote] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Inline rename. Campaigns are auto-named at creation from a fixed
  // convention (timestamp + lead count) — no client asks for a name any more —
  // so this is the ONLY place a campaign gets a human name. It saves on its own
  // rather than joining the `dirty`/Save flow below: that one batches the
  // action config, and a rename that sat unsaved behind a Save button the user
  // didn't notice would look like the rename simply failed.
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [showEnable, setShowEnable] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const pollRef = useRef(null);

  // Template picker: null when closed, otherwise the action it's picking for.
  const [pickingFor, setPickingFor] = useState(null); // 'connection' | 'message'
  const [templateNotice, setTemplateNotice] = useState(null);
  const noteRef = useRef(null);
  const bodyRef = useRef(null);

  // Preview: renders the note/message the way the extension will fill it, for
  // one real recipient at a time.
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const { user } = useAuth();
  const senderName = (user?.name || '').split(' ')[0] || '';

  // Weekly LinkedIn invite budget, counted across ALL campaigns. Polled while a
  // send is running so the number moves as invites go out.
  const { summary: outreach, refresh: refreshOutreach } = useOutreachSummary({
    pollMs: sending ? 5000 : 0,
  });

  // Seed local state once the campaign loads.
  useEffect(() => {
    if (campaign) {
      setActionType(campaign.actionType ?? null);
      setNote(campaign.connectionNote ?? '');
      setMsgSubject(campaign.messageSubject ?? '');
      setMsgBody(campaign.messageBody ?? '');
    }
  }, [campaign?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty =
    campaign &&
    (actionType !== (campaign.actionType ?? null) ||
      note !== (campaign.connectionNote ?? '') ||
      msgSubject !== (campaign.messageSubject ?? '') ||
      msgBody !== (campaign.messageBody ?? ''));

  // Everything we persist on save/launch.
  const buildUpdate = () => ({
    actionType,
    connectionNote: note,
    messageSubject: msgSubject,
    messageBody: msgBody,
  });

  // The "Applied X" confirmation belongs to one editor, so switching action
  // shouldn't carry it over to the other one.
  const selectAction = (next) => {
    if (next === actionType) return;
    setTemplateNotice(null);
    setActionType(next);
  };

  // A template fills the field and then gets out of the way — the copy stays
  // editable, and {{tokens}} are left intact so the extension can personalise
  // them per recipient at send time.
  const applyTemplate = (template) => {
    const target = pickingFor;
    setPickingFor(null);
    if (!target || !template) return;

    const content = String(template.content || '');

    if (target === 'connection') {
      const previous = note;
      const trimmed = content.slice(0, NOTE_MAX);
      setNote(trimmed);
      setTemplateNotice({
        name: template.name,
        // Template content allows 5000 chars while the campaign note caps at
        // 300, so say so rather than silently losing the tail.
        trimmedTo: content.length > NOTE_MAX ? NOTE_MAX : null,
        undo: () => {
          setNote(previous);
          setTemplateNotice(null);
        },
      });
      return;
    }

    const prevBody = msgBody;
    const prevSubject = msgSubject;
    const trimmedBody = content.slice(0, MSG_MAX);
    const templateSubject = String(template.subject || '').slice(0, SUBJECT_MAX);
    setMsgBody(trimmedBody);
    // Only overwrite the subject when the template actually carries one —
    // otherwise picking a body-only template would wipe a subject the user typed.
    if (templateSubject) setMsgSubject(templateSubject);
    setTemplateNotice({
      name: template.name,
      trimmedTo: content.length > MSG_MAX ? MSG_MAX : null,
      undo: () => {
        setMsgBody(prevBody);
        setMsgSubject(prevSubject);
        setTemplateNotice(null);
      },
    });
  };

  // The notice is an "applied ✓ / undo" affordance, not an error — it shouldn't
  // linger. Cleared on unmount too, so no setState-after-unmount warning.
  useEffect(() => {
    if (!templateNotice) return undefined;
    const timer = setTimeout(() => setTemplateNotice(null), 12000);
    return () => clearTimeout(timer);
  }, [templateNotice]);

  /** Insert a {{token}} at the caret of the note / message textarea. */
  const insertToken = (field, token) => {
    const isNote = field === 'note';
    const el = isNote ? noteRef.current : bodyRef.current;
    const max = isNote ? NOTE_MAX : MSG_MAX;
    const current = isNote ? note : msgBody;

    const { text, caret } = insertTokenAt(current, token, el?.selectionStart, el?.selectionEnd);
    if (text.length > max) return; // would blow the field's cap — no-op
    (isNote ? setNote : setMsgBody)(text);

    // Put the caret back after the token so chips can be clicked in sequence.
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await update(buildUpdate());
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
      toast.success('Campaign saved');
    } catch (e) {
      console.error('[Campaign] Save error:', e);
      toast.error(getToastError(e, "Couldn't save the campaign"));
    } finally {
      setSaving(false);
    }
  };

  const startRename = () => {
    if (!campaign) return;
    setNameDraft(campaign.name || '');
    setRenaming(true);
  };

  const commitRename = async () => {
    const next = nameDraft.trim();
    setRenaming(false);
    // Empty means "I changed my mind", not "clear the name" — the schema
    // requires one, and a blank title is never what someone wanted.
    if (!next || next === campaign?.name) return;

    setRenameSaving(true);
    try {
      await update({ name: next });
      toast.success('Campaign renamed');
    } catch (e) {
      console.error('[Campaign] Rename error:', e);
      toast.error(getToastError(e, "Couldn't rename the campaign"));
    } finally {
      setRenameSaving(false);
    }
  };

  const total = campaign?.stats?.total ?? members.length;
  const completed = campaign?.stats?.completed ?? members.filter((m) => m.status !== 'pending').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;
  const failedCount = members.filter((m) => m.status === 'failed').length;
  // Preview against real recipients — pending ones first, since those are who
  // the next send actually reaches.
  const previewPool = members.length
    ? [...members].sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0))
    : [];
  // Clamped rather than stored, so a refresh that shrinks the list can't leave
  // the index pointing past the end.
  const safePreviewIndex = previewPool.length ? previewIndex % previewPool.length : 0;
  const previewPerson = previewPool[safePreviewIndex] || null;
  const previewValues = previewValuesFor(previewPerson || {}, senderName);

  const messageReady = actionType === 'message' && msgBody.trim().length > 0;
  const canSend = pendingCount > 0 && (actionType === 'connection' || messageReady);

  // Connection campaigns are capped by LinkedIn's weekly invite limit, counted
  // account-wide rather than per campaign.
  const budget = outreach?.connectionBudget;
  const budgetBlocked =
    actionType === 'connection' && budget?.weeklyLimit > 0 && budget.weeklyRemaining <= 0;
  const budgetTight =
    actionType === 'connection' &&
    !budgetBlocked &&
    budget?.weeklyRemaining > 0 &&
    pendingCount > budget.weeklyRemaining;

  // While a send is in progress: refresh status AND keep nudging the extension.
  // A single wake-up message to a sleeping MV3 worker can be missed, so we ping
  // repeatedly — each ping wakes the worker and makes it pick up the queued
  // campaign — until progress is visible. This makes starts near-instant instead
  // of waiting on the extension's 1-minute fallback alarm.
  useEffect(() => {
    if (!sending) return undefined;
    pingExtension().catch(() => {}); // immediate nudge
    pollRef.current = setInterval(() => {
      refresh();
      pingExtension().catch(() => {}); // repeat nudge every tick
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [sending, refresh]);

  // Stop polling once the run finishes.
  useEffect(() => {
    if (sending && (campaign?.status === 'completed' || pendingCount === 0)) {
      setSending(false);
    }
  }, [sending, campaign?.status, pendingCount]);

  // Hammer the start trigger until the worker confirms it's running. Each call
  // wakes the (possibly asleep) service worker; retrying covers dropped wakes so
  // the send begins within a couple seconds instead of on the 1-minute alarm.
  const kickStart = async (id) => {
    for (let i = 0; i < 12; i += 1) {
      let res;
      try {
        res = await startCampaign(id);
      } catch {
        res = { started: false, error: 'no response' };
      }
      const err = (res && res.error) || '';
      // Running (or already running) → done.
      if (res?.started || /already running/i.test(err)) return true;
      // Non-retryable outcomes — stop hammering.
      if (/not logged in|no pending|unsupported|not a connection/i.test(err)) return false;
      // Otherwise the worker likely didn't get the message; try again shortly.
      await new Promise((r) => setTimeout(r, 1000));
    }
    return false;
  };

  const handleSend = async () => {
    setSendError(null);
    try {
      // 1. Persist the action + note/message so the backend queue is correct.
      if (dirty) await update(buildUpdate());
      // 2. Flip the campaign to active — this alone QUEUES the work. The
      //    extension pulls active campaigns on its own (poll), so the send will
      //    happen even if we can't reach the extension from here right now.
      await campaignsController.launchCampaign(campaignId);
      refreshOutreach();
      // 3. If the extension isn't present at all, prompt to enable it — but the
      //    campaign stays queued and will run the moment it's turned on.
      const info = await ext.recheck();
      if (!info.installed) {
        setShowEnable(true);
        await refresh();
        return;
      }
      // 4. Actively drive the start. A sleeping MV3 worker can miss a single
      //    wake-up message, so we retry ~once a second and stop as soon as the
      //    worker confirms it's running (or reports a non-retryable reason).
      setSending(true);
      kickStart(campaignId);
      await refresh();
      toast.success('Campaign launched', {
        description: pendingCount
          ? `${pendingCount.toLocaleString()} queued to send.`
          : undefined,
      });
    } catch (e) {
      /* Detail stays in the strip under the Send button; the toast just names
         the action, so an extension/queue diagnostic can't land in it. */
      setSendError(getApiErrorMessage(e, 'Failed to launch campaign'));
      toast.error(getToastError(e, "Couldn't launch the campaign"));
    }
  };

  // Reset failed members to pending so the next launch retries them. A failed
  // send is usually transient (tab closed, content script not ready), so this
  // shouldn't require rebuilding the campaign.
  const handleRetryFailed = async () => {
    if (retrying || failedCount === 0) return;
    setRetrying(true);
    setSendError(null);
    try {
      await campaignsController.retryFailedMembers(campaignId);
      await refresh();
      toast.success(`${failedCount.toLocaleString()} reset to pending`);
    } catch (e) {
      setSendError(getApiErrorMessage(e, 'Failed to reset failed leads'));
      toast.error(getToastError(e, "Couldn't reset the failed leads"));
    } finally {
      setRetrying(false);
    }
  };

  const handleStop = async () => {
    try {
      await stopCampaign();
      toast.info('Campaign stopped');
    } catch (_) {
      /* Best effort — the backend flag is what actually halts the run, so a
         failed extension ping isn't worth alarming the user about. */
      toast.info('Campaign stopped', { description: 'The extension may finish its current lead.' });
    }
    setSending(false);
    refresh();
  };

  return {
    campaign,
    members,
    loading,
    error,
    ext,

    actionType,
    note,
    setNote,
    msgSubject,
    setMsgSubject,
    msgBody,
    setMsgBody,
    saving,
    savedAt,

    renaming,
    setRenaming,
    nameDraft,
    setNameDraft,
    renameSaving,

    sending,
    sendError,
    showEnable,
    setShowEnable,
    retrying,

    pickingFor,
    setPickingFor,
    templateNotice,
    setTemplateNotice,
    noteRef,
    bodyRef,

    showPreview,
    setShowPreview,
    previewIndex,
    setPreviewIndex,

    dirty,
    selectAction,
    applyTemplate,
    insertToken,
    handleSave,
    startRename,
    commitRename,

    total,
    completed,
    pendingCount,
    failedCount,
    previewPool,
    safePreviewIndex,
    previewPerson,
    previewValues,
    canSend,
    budget,
    budgetBlocked,
    budgetTight,

    handleSend,
    handleRetryFailed,
    handleStop,
  };
}
