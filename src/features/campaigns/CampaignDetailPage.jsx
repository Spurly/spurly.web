import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, MessageSquare, Check, Users, Send, Square, AlertTriangle, RotateCcw, FileText, X, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { useAuth } from 'src/hooks/useAuth.js';
import { TemplatePickerModal } from 'src/components/TemplatePickerModal.jsx';
import {
  TEMPLATE_TOKENS,
  insertTokenAt,
  previewTemplate,
  previewValuesFor,
  findUnknownTokens,
} from 'src/common/utils/templateTokens.js';
import { useCampaign } from 'src/hooks/useCampaign';
import { useExtension } from 'src/hooks/useExtension';
import { useOutreachSummary } from 'src/hooks/useOutreachSummary';
import campaignsController from 'src/core/controllers/campaignsController.js';
import { useToast } from 'src/ui/primitives';
import { getToastError, getApiErrorMessage } from 'src/common/utils/apiError';
import { startCampaign, stopCampaign, pingExtension } from 'src/core/extension/extensionBridge.js';
import { STATUS_STYLES } from './helpers';
import { CampaignFlowCanvas } from './CampaignFlowCanvas.jsx';
import { EnableExtensionModal } from './EnableExtensionModal.jsx';
import { AiWriteButton } from 'src/features/personalization/AiWriteButton.jsx';

const NOTE_MAX = 300;
const MSG_MAX = 2000;
const SUBJECT_MAX = 200;

export function CampaignDetailPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
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

  const statusStyle = STATUS_STYLES[campaign?.status] || STATUS_STYLES.draft;
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

  return (
    <DashboardLayout>
      <div className="relative flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-[var(--ui-surface-card)] border-b border-[var(--separator)] px-[var(--ui-pad-lg)] py-3.5 shrink-0 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/campaigns')}
            className="w-8 h-8 grid place-items-center rounded-[var(--ui-radius-md)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              {renaming ? (
                <input
                  autoFocus
                  value={nameDraft}
                  maxLength={120}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                      // Escape must not commit, so clear the intent before the
                      // blur that follows fires commitRename.
                      setRenaming(false);
                      e.currentTarget.blur();
                    }
                  }}
                  className="text-[17px] font-medium tracking-[-0.012em] text-[var(--text-primary)] bg-transparent min-w-0 flex-1 rounded-[var(--ui-radius-sm)] px-1.5 -mx-1.5 outline-none"
                  style={{ border: '1px solid var(--brand-purple)' }}
                />
              ) : (
                <h1
                  onClick={startRename}
                  role="button"
                  tabIndex={campaign ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      startRename();
                    }
                  }}
                  title={campaign ? 'Click to rename' : undefined}
                  className="text-[17px] font-medium tracking-[-0.012em] text-[var(--text-primary)] truncate rounded-[var(--ui-radius-sm)] px-1.5 -mx-1.5 cursor-text hover:bg-[var(--surface-hover)] transition-colors"
                >
                  {campaign?.name || (loading ? 'Loading…' : 'Campaign')}
                </h1>
              )}
              {renameSaving && (
                <span className="text-[11px] text-[var(--text-tertiary)] shrink-0">Saving…</span>
              )}
              {campaign && (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0"
                  style={{ background: statusStyle.bg, color: statusStyle.color }}
                >
                  {statusStyle.label}
                </span>
              )}
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5 flex items-center gap-1.5">
              <Users size={12} /> {total} lead{total === 1 ? '' : 's'}
            </p>
          </div>

          <ExtensionBadge ext={ext} />

          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium transition-opacity disabled:opacity-40"
            style={{ background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid var(--border-hairline)' }}
          >
            {saving ? 'Saving…' : savedAt ? 'Saved ✓' : 'Save'}
          </button>

          {sending ? (
            <button
              onClick={handleStop}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-white transition-opacity"
              style={{ background: 'var(--red)' }}
            >
              <Square size={13} /> Stop ({completed}/{total})
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend || budgetBlocked}
              title={
                !actionType
                  ? 'Choose an action first'
                  : actionType === 'message' && !msgBody.trim()
                    ? 'Write a message first'
                    : pendingCount === 0
                      ? 'No pending leads to send'
                      : budgetBlocked
                        ? `Weekly LinkedIn invite limit reached (${budget.weekUsed}/${budget.weeklyLimit})`
                        : undefined
              }
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--brand-purple)' }}
            >
              <Send size={14} /> Send {actionType === 'message' ? 'messages' : 'requests'}
              {pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          )}
        </div>

        {error && (
          <div className="px-[var(--ui-pad-lg)] py-3 text-[13px]" style={{ color: 'var(--red)' }}>
            {error}
          </div>
        )}
        {/* Toasted as well, but kept: a launch failure means nothing is sending,
            and that's worth stating persistently next to the Send button. */}
        {sendError && (
          <div className="px-[var(--ui-pad-lg)] py-3 text-[13px]" style={{ color: 'var(--red)' }}>
            {sendError}
          </div>
        )}

        {/* Weekly LinkedIn invite budget — the binding constraint on connection
            campaigns, counted across every campaign on this account. */}
        {(budgetBlocked || budgetTight) && (
          <div
            className="px-[var(--ui-pad-lg)] py-2.5 text-[12px] flex items-center gap-2"
            style={
              budgetBlocked
                ? { background: 'var(--red-tint)', color: 'var(--red)' }
                : { background: 'var(--amber-tint)', color: 'var(--amber)' }
            }
          >
            <AlertTriangle size={14} className="shrink-0" />
            {budgetBlocked ? (
              <span>
                Weekly LinkedIn invite limit reached — {budget.weekUsed}/{budget.weeklyLimit} sent
                in the last 7 days. Sending is paused until the window rolls over.
              </span>
            ) : (
              <span>
                {budget.weeklyRemaining} invite{budget.weeklyRemaining === 1 ? '' : 's'} left this
                week ({budget.weekUsed}/{budget.weeklyLimit} used) but {pendingCount} lead
                {pendingCount === 1 ? '' : 's'} pending — the rest will need another run.
              </span>
            )}
          </div>
        )}

        {/* Needs attention — failed sends are usually transient, so offer the
            one-click reset rather than making the user rebuild the campaign. */}
        {failedCount > 0 && !sending && (
          <div
            className="px-[var(--ui-pad-lg)] py-2.5 text-[12px] flex items-center gap-2.5"
            style={{ background: 'var(--red-tint)', color: 'var(--red)' }}
          >
            <AlertTriangle size={14} className="shrink-0" />
            <span className="flex-1">
              {failedCount} lead{failedCount === 1 ? '' : 's'} failed to send. Hover a row's status
              for the reason.
            </span>
            <button
              onClick={handleRetryFailed}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--ui-radius-md)] text-[12px] font-medium transition-opacity disabled:opacity-50"
              style={{ background: 'var(--red)', color: '#fff' }}
            >
              <RotateCcw size={12} />
              {retrying ? 'Resetting…' : 'Retry failed'}
            </button>
          </div>
        )}
        {sending && (
          <div
            className="px-[var(--ui-pad-lg)] py-2.5 text-[12px] flex items-center gap-2"
            style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--brand-purple)' }} />
            Sending via the extension — {completed}/{total} done. It may take up to a minute to begin; keep this browser open (you can leave this tab).
          </div>
        )}

        {/* Body — canvas (primary) + config rail (lemlist-style) */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left: animated workflow canvas */}
          <div className="flex-1 min-w-0">
            <CampaignFlowCanvas
              members={members}
              actionType={actionType}
              sending={sending}
              status={campaign?.status}
            />
          </div>

          {/* Right: action config rail */}
          <aside
            className="w-[380px] xl:w-[420px] shrink-0 overflow-y-auto p-[var(--ui-pad-lg)] flex flex-col gap-5"
            style={{ borderLeft: '1px solid var(--separator)', background: 'var(--surface-raised)' }}
          >
            <section>
              <h2 className="text-[14px] font-medium text-[var(--text-primary)] mb-1">
                What should this campaign do?
              </h2>
              <p className="text-[12px] text-[var(--text-secondary)] mb-4">
                Choose the action the extension will run for every lead.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <ActionCard
                  icon={UserPlus}
                  title="Connection request"
                  subtitle="Send a LinkedIn invitation"
                  selected={actionType === 'connection'}
                  onClick={() => selectAction('connection')}
                />
                <ActionCard
                  icon={MessageSquare}
                  title="Message"
                  subtitle="Message your connections"
                  selected={actionType === 'message'}
                  onClick={() => selectAction('message')}
                />
              </div>
            </section>

            {/* Invitation note — only for the connection action */}
            {actionType === 'connection' && (
              <section>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="shrink-0 text-[14px] font-medium text-[var(--text-primary)]">
                    Invitation note
                  </h2>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <AiWriteButton
                      content={note}
                      type="CONNECTION_REQUEST"
                      maxLength={NOTE_MAX}
                      disabled={sending}
                      onApply={setNote}
                    />
                    <PreviewToggle on={showPreview} onClick={() => setShowPreview((v) => !v)} />
                    <UseTemplateButton onClick={() => setPickingFor('connection')} />
                    <span className="shrink-0 text-[12px] text-[var(--text-tertiary)] tabular-nums">
                      {note.length}/{NOTE_MAX}
                    </span>
                  </div>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] mb-3">
                  Optional. Leave empty to send a note-free request. Tokens below are filled in per
                  person when the invite goes out.
                </p>

                <TokenBar disabled={sending} onInsert={(token) => insertToken('note', token)} />

                <textarea
                  ref={noteRef}
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                  placeholder="Hi {{firstName}}, I'd love to connect…"
                  rows={5}
                  className="w-full px-4 py-3 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-[var(--ui-radius-lg)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--ui-focus-ring)] transition-colors resize-none"
                />

                {/* LinkedIn truncates invitation notes past ~200 chars, while
                    the field itself allows 300. Warn rather than block. */}
                {note.length > 200 && (
                  <p className="text-[12px] mt-2" style={{ color: 'var(--amber)' }}>
                    LinkedIn truncates invitation notes after about 200 characters.
                  </p>
                )}

                <UnknownTokenWarning content={note} />

                {showPreview && (
                  <EditorPreview
                    body={note}
                    values={previewValues}
                    person={previewPerson}
                    index={safePreviewIndex}
                    count={previewPool.length}
                    onNext={() => setPreviewIndex((i) => i + 1)}
                  />
                )}

                <TemplateNotice notice={templateNotice} onDismiss={() => setTemplateNotice(null)} />
              </section>
            )}

            {/* Message editor — only for the message action */}
            {actionType === 'message' && (
              <section>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="shrink-0 text-[14px] font-medium text-[var(--text-primary)]">Message</h2>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <AiWriteButton
                      content={msgBody}
                      type="DIRECT_MESSAGE"
                      maxLength={MSG_MAX}
                      disabled={sending}
                      onApply={setMsgBody}
                    />
                    <PreviewToggle on={showPreview} onClick={() => setShowPreview((v) => !v)} />
                    <UseTemplateButton onClick={() => setPickingFor('message')} />
                    <span className="shrink-0 text-[12px] text-[var(--text-tertiary)] tabular-nums">
                      {msgBody.length}/{MSG_MAX}
                    </span>
                  </div>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] mb-3">
                  Sent as a LinkedIn message. Works for 1st-degree connections; leads you’re not
                  connected to are skipped. Tokens below are filled in per person.
                </p>

                <input
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value.slice(0, SUBJECT_MAX))}
                  placeholder="Subject (Sales Navigator InMail only) — optional"
                  className="w-full mb-3 px-4 h-11 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-[var(--ui-radius-lg)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--ui-focus-ring)] transition-colors"
                />

                <TokenBar disabled={sending} onInsert={(token) => insertToken('body', token)} />

                <textarea
                  ref={bodyRef}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value.slice(0, MSG_MAX))}
                  placeholder="Hi {{firstName}}, …"
                  rows={6}
                  className="w-full px-4 py-3 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-[var(--ui-radius-lg)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--ui-focus-ring)] transition-colors resize-none"
                />

                <UnknownTokenWarning content={`${msgSubject}\n${msgBody}`} />

                {showPreview && (
                  <EditorPreview
                    subject={msgSubject}
                    body={msgBody}
                    values={previewValues}
                    person={previewPerson}
                    index={safePreviewIndex}
                    count={previewPool.length}
                    onNext={() => setPreviewIndex((i) => i + 1)}
                  />
                )}

                <TemplateNotice notice={templateNotice} onDismiss={() => setTemplateNotice(null)} />
              </section>
            )}
          </aside>
        </div>

        {pickingFor && (
          <TemplatePickerModal
            action={pickingFor}
            maxLength={pickingFor === 'connection' ? NOTE_MAX : MSG_MAX}
            onPick={applyTemplate}
            onClose={() => setPickingFor(null)}
          />
        )}

        {showEnable && (
          <EnableExtensionModal
            installed={ext.installed}
            loggedIn={ext.loggedIn}
            loginKnown={ext.loginKnown}
            checking={ext.checking}
            onRecheck={async () => {
              const info = await ext.recheck();
              if (info.installed && info.loggedIn) {
                setShowEnable(false);
                handleSend();
              }
            }}
            onClose={() => setShowEnable(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

/** Show/hide the filled-in preview of the note or message. */
function PreviewToggle({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 h-7 px-2.5 rounded-[var(--ui-radius-md)] text-[12px] font-medium transition-colors"
      style={
        on
          ? { background: 'var(--accent-tint)', color: 'var(--brand-purple)' }
          : { background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }
      }
    >
      {on ? <EyeOff size={12} /> : <Eye size={12} />} Preview
    </button>
  );
}

/**
 * The note/message as one recipient will actually receive it.
 *
 * Rendered with the same substitution rules the extension applies at send time
 * (`fillTemplate` in the background worker), including stripping tokens it
 * can't fill — so an empty {{company}} shows up here rather than surprising
 * the user in someone's inbox.
 */
function EditorPreview({ subject = '', body = '', values, person, index, count, onNext }) {
  const filledSubject = previewTemplate(subject, values);
  const filledBody = previewTemplate(body, values);
  const label = person?.name || 'this recipient';

  return (
    <div
      className="mt-3 rounded-[var(--ui-radius-lg)] overflow-hidden"
      style={{ border: '1px dashed var(--border-default)', background: 'var(--surface-sunken)' }}
    >
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[var(--separator)]">
        <span className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
          {count > 0 ? `As ${label} will see it` : 'Preview'}
        </span>
        {count > 1 && (
          <>
            <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums ml-auto shrink-0">
              {index + 1}/{count}
            </span>
            <button
              type="button"
              onClick={onNext}
              title="Preview the next lead"
              className="shrink-0 w-6 h-6 grid place-items-center rounded-[var(--ui-radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </>
        )}
      </div>

      <div className="px-3.5 py-3">
        {filledSubject && (
          <p className="text-[12px] font-medium text-[var(--text-primary)] mb-1.5">
            {filledSubject}
          </p>
        )}
        <p
          className="text-[13px] leading-relaxed whitespace-pre-wrap"
          style={{ color: filledBody ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
        >
          {filledBody ||
            (body.trim()
              ? 'Every token resolved to nothing — this lead has no matching details.'
              : 'Nothing written yet.')}
        </p>
        {count === 0 && (
          <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
            No leads loaded — showing tokens as empty.
          </p>
        )}
      </div>
    </div>
  );
}

/** Names tokens the sender can't fill, before they silently vanish on send. */
function UnknownTokenWarning({ content }) {
  const unknown = findUnknownTokens(content);
  if (unknown.length === 0) return null;
  return (
    <div
      className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-[var(--ui-radius-lg)] text-[12px]"
      style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}
    >
      <AlertTriangle size={14} className="shrink-0 mt-px" />
      <span>
        {unknown.map((t) => `{{${t}}}`).join(', ')}{' '}
        {unknown.length === 1 ? "isn't a known token" : "aren't known tokens"} — it will be removed
        when the message is sent.
      </span>
    </div>
  );
}

/** Opens the saved-template picker for the section it sits in. */
function UseTemplateButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 h-7 px-2.5 rounded-[var(--ui-radius-md)] text-[12px] font-medium transition-colors"
      style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}
    >
      <FileText size={12} /> Template
    </button>
  );
}

/**
 * Token chips for the note / message editors. Same vocabulary the extension
 * fills at send time, so what's offered here is always substitutable.
 */
function TokenBar({ onInsert, disabled = false }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2">
      <span className="text-[11px] text-[var(--text-tertiary)] mr-0.5">Insert</span>
      {TEMPLATE_TOKENS.map((t) => (
        <button
          key={t.token}
          type="button"
          disabled={disabled}
          title={`${t.label} — e.g. ${t.sample}`}
          onClick={() => onInsert(t.token)}
          className="px-2 h-6 rounded-[var(--ui-radius-sm)] font-mono text-[11px] text-[var(--brand-purple)] bg-[var(--accent-tint)] hover:bg-[var(--accent-tint-2)] transition-colors disabled:opacity-40"
        >
          {t.token}
        </button>
      ))}
    </div>
  );
}

/** "Applied X ✓ · Undo" confirmation after a template fills the field. */
function TemplateNotice({ notice, onDismiss }) {
  if (!notice) return null;
  return (
    <div
      className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-[var(--ui-radius-lg)] text-[12px]"
      style={
        notice.trimmedTo
          ? { background: 'var(--amber-tint)', color: 'var(--amber)' }
          : { background: 'var(--green-tint)', color: 'var(--green)' }
      }
    >
      <Check size={14} className="shrink-0 mt-px" />
      <span className="flex-1 min-w-0">
        Applied <span className="font-medium">“{notice.name}”</span>
        {notice.trimmedTo ? ` — trimmed to ${notice.trimmedTo} characters` : ''}
      </span>
      <button
        type="button"
        onClick={notice.undo}
        className="shrink-0 font-medium underline underline-offset-2 hover:opacity-80"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/** Live extension-connection indicator. Reflects the DOM-marker/ping detection. */
function ExtensionBadge({ ext }) {
  let dot = 'var(--text-tertiary)';
  let label = 'Checking…';
  let title = 'Checking for the Spurly extension';

  if (!ext.checking) {
    if (!ext.installed) {
      dot = 'var(--red)';
      label = 'Extension off';
      title = 'Extension not detected on this page — enable it, then refresh';
    } else if (ext.loginKnown && !ext.loggedIn) {
      // Only warn about sign-in when the worker actually told us it's logged out.
      dot = '#f59e0b';
      label = 'Sign in to extension';
      title = 'Extension detected but not signed in — open it and log in';
    } else {
      // Installed, and either confirmed logged-in or login unknown (worker asleep).
      dot = 'var(--green)';
      label = 'Extension connected';
      title = 'The extension is connected';
    }
  }

  return (
    <button
      onClick={() => ext.recheck()}
      title={`${title} · click to recheck`}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--ui-radius-lg)] text-[12px] font-medium transition-colors"
      style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)', border: '1px solid var(--border-hairline)' }}
    >
      <span
        className={`w-2 h-2 rounded-full ${ext.checking ? 'animate-pulse' : ''}`}
        style={{ background: dot }}
      />
      {label}
    </button>
  );
}

function ActionCard({ icon: Icon, title, subtitle, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="relative flex flex-col items-start gap-2 p-4 rounded-[var(--ui-radius-lg)] text-left transition-colors disabled:cursor-not-allowed"
      style={{
        background: selected ? 'var(--accent-tint)' : 'var(--surface-sunken)',
        border: `1.5px solid ${selected ? 'var(--brand-purple)' : 'var(--border-hairline)'}`,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {selected && (
        <span
          className="absolute top-3 right-3 w-5 h-5 rounded-full grid place-items-center text-white"
          style={{ background: 'var(--brand-purple)' }}
        >
          <Check size={12} />
        </span>
      )}
      <span
        className="w-9 h-9 rounded-[var(--ui-radius-lg)] grid place-items-center"
        style={{
          background: selected ? 'var(--brand-purple)' : 'var(--accent-tint)',
          color: selected ? '#fff' : 'var(--brand-purple)',
        }}
      >
        <Icon size={18} />
      </span>
      <span className="text-[13px] font-medium text-[var(--text-primary)]">{title}</span>
      <span className="text-[12px] text-[var(--text-tertiary)]">{subtitle}</span>
    </button>
  );
}
