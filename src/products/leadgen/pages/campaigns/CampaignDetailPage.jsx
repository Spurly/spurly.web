import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, MessageSquare, Users, Send, Square, AlertTriangle, RotateCcw } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { TemplatePickerModal } from 'src/products/leadgen/pages/templates/components/TemplatePickerModal.jsx';
import { useCampaignDetail } from 'src/products/leadgen/campaigns/hooks/useCampaignDetail.js';
import { STATUS_STYLES } from './components/statusView.js';
import { CampaignFlowCanvas } from './components/CampaignFlowCanvas.jsx';
import { EnableExtensionModal } from './components/EnableExtensionModal.jsx';
import { AiWriteButton } from 'src/products/leadgen/personalization/AiWriteButton.jsx';
import { NOTE_MAX, MSG_MAX, SUBJECT_MAX } from 'src/products/leadgen/campaigns/constants.js';
import {
  PreviewToggle,
  EditorPreview,
  UnknownTokenWarning,
  UseTemplateButton,
  TokenBar,
  TemplateNotice,
  ExtensionBadge,
  ActionCard,
} from './components/DetailControls.jsx';

export function CampaignDetailPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const {
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
  } = useCampaignDetail(campaignId);

  const statusStyle = STATUS_STYLES[campaign?.status] || STATUS_STYLES.draft;

  return (
    <DashboardLayout>
      <div className="relative flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-[var(--ui-surface-card)] border-b border-[var(--ui-border-hairline)] px-[var(--ui-pad-lg)] py-3.5 shrink-0 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/campaigns')}
            className="w-8 h-8 grid place-items-center rounded-[var(--ui-radius-md)] text-[var(--ui-text-tertiary)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text-primary)] transition-colors shrink-0"
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
                  className="text-[var(--ui-t-section)] font-medium tracking-[-0.012em] text-[var(--ui-text-primary)] bg-transparent min-w-0 flex-1 rounded-[var(--ui-radius-sm)] px-1.5 -mx-1.5 outline-none"
                  style={{ border: '1px solid var(--ui-accent)' }}
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
                  className="text-[var(--ui-t-section)] font-medium tracking-[-0.012em] text-[var(--ui-text-primary)] truncate rounded-[var(--ui-radius-sm)] px-1.5 -mx-1.5 cursor-text hover:bg-[var(--ui-surface-hover)] transition-colors"
                >
                  {campaign?.name || (loading ? 'Loading…' : 'Campaign')}
                </h1>
              )}
              {renameSaving && (
                <span className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] shrink-0">Saving…</span>
              )}
              {campaign && (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[var(--ui-t-meta)] font-medium shrink-0"
                  style={{ background: statusStyle.bg, color: statusStyle.color }}
                >
                  {statusStyle.label}
                </span>
              )}
            </div>
            <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] mt-0.5 flex items-center gap-1.5">
              <Users size={12} /> {total} lead{total === 1 ? '' : 's'}
            </p>
          </div>

          <ExtensionBadge ext={ext} />

          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[var(--ui-t-body)] font-medium transition-opacity disabled:opacity-40"
            style={{ background: 'var(--ui-surface-sunken)', color: 'var(--ui-text-primary)', border: '1px solid var(--ui-border-hairline)' }}
          >
            {saving ? 'Saving…' : savedAt ? 'Saved ✓' : 'Save'}
          </button>

          {sending ? (
            <button
              onClick={handleStop}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-sm)] text-[var(--ui-t-body)] font-medium text-white transition-opacity"
              style={{ background: 'var(--ui-danger)' }}
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
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-sm)] text-[var(--ui-t-body)] font-medium text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--ui-accent)' }}
            >
              <Send size={14} /> Send {actionType === 'message' ? 'messages' : 'requests'}
              {pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          )}
        </div>

        {error && (
          <div className="px-[var(--ui-pad-lg)] py-3 text-[var(--ui-t-body)]" style={{ color: 'var(--ui-danger-fg)' }}>
            {error}
          </div>
        )}
        {/* Toasted as well, but kept: a launch failure means nothing is sending,
            and that's worth stating persistently next to the Send button. */}
        {sendError && (
          <div className="px-[var(--ui-pad-lg)] py-3 text-[var(--ui-t-body)]" style={{ color: 'var(--ui-danger-fg)' }}>
            {sendError}
          </div>
        )}

        {/* Weekly LinkedIn invite budget — the binding constraint on connection
            campaigns, counted across every campaign on this account. */}
        {(budgetBlocked || budgetTight) && (
          <div
            className="px-[var(--ui-pad-lg)] py-2.5 text-[var(--ui-t-label)] flex items-center gap-2"
            style={
              budgetBlocked
                ? { background: 'var(--ui-danger-tint)', color: 'var(--ui-danger)' }
                : { background: 'var(--ui-warning-tint)', color: 'var(--ui-warning)' }
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
            className="px-[var(--ui-pad-lg)] py-2.5 text-[var(--ui-t-label)] flex items-center gap-2.5"
            style={{ background: 'var(--ui-danger-tint)', color: 'var(--ui-danger)' }}
          >
            <AlertTriangle size={14} className="shrink-0" />
            <span className="flex-1">
              {failedCount} lead{failedCount === 1 ? '' : 's'} failed to send. Hover a row's status
              for the reason.
            </span>
            <button
              onClick={handleRetryFailed}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--ui-radius-md)] text-[var(--ui-t-label)] font-medium transition-opacity disabled:opacity-50"
              style={{ background: 'var(--ui-danger)', color: 'var(--ui-accent-on)' }}
            >
              <RotateCcw size={12} />
              {retrying ? 'Resetting…' : 'Retry failed'}
            </button>
          </div>
        )}
        {sending && (
          <div
            className="px-[var(--ui-pad-lg)] py-2.5 text-[var(--ui-t-label)] flex items-center gap-2"
            style={{ background: 'var(--ui-accent-tint)', color: 'var(--ui-accent)' }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--ui-accent)' }} />
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
            style={{ borderLeft: '1px solid var(--ui-border-hairline)', background: 'var(--ui-surface-card)' }}
          >
            <section>
              <h2 className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] mb-1">
                What should this campaign do?
              </h2>
              <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] mb-4">
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
                  <h2 className="shrink-0 text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
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
                    <span className="shrink-0 text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] tabular-nums">
                      {note.length}/{NOTE_MAX}
                    </span>
                  </div>
                </div>
                <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] mb-3">
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
                  className="w-full px-4 py-3 bg-[var(--ui-surface-sunken)] border border-[var(--ui-border)] rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-tertiary)] focus:outline-none focus:border-[var(--ui-accent)] focus:shadow-[var(--ui-focus-ring)] transition-colors resize-none"
                />

                {/* LinkedIn truncates invitation notes past ~200 chars, while
                    the field itself allows 300. Warn rather than block. */}
                {note.length > 200 && (
                  <p className="text-[var(--ui-t-label)] mt-2" style={{ color: 'var(--ui-warning-fg)' }}>
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
                  <h2 className="shrink-0 text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">Message</h2>
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
                    <span className="shrink-0 text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] tabular-nums">
                      {msgBody.length}/{MSG_MAX}
                    </span>
                  </div>
                </div>
                <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] mb-3">
                  Sent as a LinkedIn message. Works for 1st-degree connections; leads you’re not
                  connected to are skipped. Tokens below are filled in per person.
                </p>

                <input
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value.slice(0, SUBJECT_MAX))}
                  placeholder="Subject (Sales Navigator InMail only) — optional"
                  className="w-full mb-3 px-4 h-11 bg-[var(--ui-surface-sunken)] border border-[var(--ui-border)] rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-tertiary)] focus:outline-none focus:border-[var(--ui-accent)] focus:shadow-[var(--ui-focus-ring)] transition-colors"
                />

                <TokenBar disabled={sending} onInsert={(token) => insertToken('body', token)} />

                <textarea
                  ref={bodyRef}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value.slice(0, MSG_MAX))}
                  placeholder="Hi {{firstName}}, …"
                  rows={6}
                  className="w-full px-4 py-3 bg-[var(--ui-surface-sunken)] border border-[var(--ui-border)] rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-tertiary)] focus:outline-none focus:border-[var(--ui-accent)] focus:shadow-[var(--ui-focus-ring)] transition-colors resize-none"
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
