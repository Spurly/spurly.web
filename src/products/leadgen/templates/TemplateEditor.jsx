import { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import {
  TEMPLATE_TOKENS,
  previewTemplate,
  findUnknownTokens,
  insertTokenAt,
} from 'src/shared/utils/templateTokens.js';
import { AiWriteButton } from 'src/products/leadgen/personalization/AiWriteButton.jsx';

/**
 * Create/edit form for a single message template.
 *
 * Shared by the Templates page and the campaign picker's "New template" flow,
 * so the token chips, the character budget and the preview behave identically
 * wherever a template is authored.
 *
 * Props:
 *   type       — 'CONNECTION_REQUEST' | 'DIRECT_MESSAGE'
 *   template   — existing record to edit, or null to create
 *   saving     — parent-owned submit state
 *   error      — parent-owned error string
 *   onSubmit   — (payload) => void
 *   onCancel   — () => void
 *   senderName — used in the preview so {{sender}} reads correctly
 */

// LinkedIn truncates invitation notes at 200 characters. The Campaign schema
// allows 300, so this is a soft warning rather than a hard cap.
export const CONNECTION_NOTE_SOFT_LIMIT = 200;
const NAME_MAX = 100;
const SUBJECT_MAX = 200;
const CONTENT_MAX = 5000;
const DESCRIPTION_MAX = 500;

const EMPTY = { name: '', subject: '', content: '', description: '' };

const FIELD_CLASS =
  'w-full px-4 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-[var(--ui-radius-lg)] ' +
  'text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
  'focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--ui-focus-ring)] ' +
  'transition-colors disabled:opacity-50';

export function TemplateEditor({
  type,
  template = null,
  saving = false,
  error = null,
  onSubmit,
  onCancel,
  senderName = '',
}) {
  const isConnection = type === 'CONNECTION_REQUEST';
  const [form, setForm] = useState(EMPTY);
  const [showPreview, setShowPreview] = useState(false);
  const contentRef = useRef(null);

  // Reseed whenever the editor is pointed at a different record (or at "new").
  useEffect(() => {
    setForm(
      template
        ? {
            name: template.name || '',
            subject: template.subject || '',
            content: template.content || '',
            description: template.description || '',
          }
        : EMPTY,
    );
  }, [template?._id, type]); // eslint-disable-line react-hooks/exhaustive-deps

  const unknownTokens = useMemo(() => findUnknownTokens(form.content), [form.content]);
  const preview = useMemo(
    () => previewTemplate(form.content, senderName ? { sender: senderName, senderName } : {}),
    [form.content, senderName],
  );

  const overSoftLimit = isConnection && form.content.length > CONNECTION_NOTE_SOFT_LIMIT;
  const canSave = form.name.trim().length > 0 && form.content.trim().length > 0 && !saving;

  const insertToken = (token) => {
    const el = contentRef.current;
    const { text, caret } = insertTokenAt(
      form.content,
      token,
      el?.selectionStart,
      el?.selectionEnd,
    );
    if (text.length > CONTENT_MAX) return;
    setForm((f) => ({ ...f, content: text }));
    // Restore focus and drop the caret after the inserted token, so chips can
    // be clicked in sequence without reaching for the mouse in between.
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSubmit({
      name: form.name.trim(),
      type,
      content: form.content.trim(),
      // A connection note has no subject — clear any stale value so switching a
      // template's type can't leave an orphaned subject behind.
      subject: isConnection ? '' : form.subject.trim(),
      description: form.description.trim(),
      category: 'other',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-[var(--text-primary)]">
          Template name
        </label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, NAME_MAX) })}
          placeholder={isConnection ? 'e.g. Warm intro — founders' : 'e.g. Follow-up after connect'}
          disabled={saving}
          autoFocus
          className={`${FIELD_CLASS} h-11`}
        />
      </div>

      {/* Subject — messages only */}
      {!isConnection && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[var(--text-primary)]">
            Subject <span className="font-normal text-[var(--text-tertiary)]">— optional</span>
          </label>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value.slice(0, SUBJECT_MAX) })}
            placeholder="Used for Sales Navigator InMail only"
            disabled={saving}
            className={`${FIELD_CLASS} h-11`}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-[13px] font-medium text-[var(--text-primary)]">
            {isConnection ? 'Invitation note' : 'Message'}
          </label>
          <div className="flex items-center gap-3">
            <AiWriteButton
              content={form.content}
              type={type}
              templateId={template?._id || null}
              maxLength={CONTENT_MAX}
              disabled={saving}
              onApply={(text) => setForm((f) => ({ ...f, content: text }))}
            />
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPreview ? 'Hide preview' : 'Preview'}
            </button>
          </div>
        </div>

        {/* Token chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-[var(--text-tertiary)] mr-0.5">Insert</span>
          {TEMPLATE_TOKENS.map((t) => (
            <button
              key={t.token}
              type="button"
              title={`${t.label} — e.g. ${t.sample}`}
              disabled={saving}
              onClick={() => insertToken(t.token)}
              className="px-2 h-6 rounded-[var(--ui-radius-sm)] font-mono text-[11px] text-[var(--brand-purple)] bg-[var(--accent-tint)] hover:bg-[var(--accent-tint-2)] transition-colors disabled:opacity-50"
            >
              {t.token}
            </button>
          ))}
        </div>

        <textarea
          ref={contentRef}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value.slice(0, CONTENT_MAX) })}
          placeholder={
            isConnection
              ? "Hi {{firstName}}, I came across your work at {{company}} and would love to connect."
              : "Hi {{firstName}}, thanks for connecting! …"
          }
          rows={isConnection ? 5 : 8}
          disabled={saving}
          className={`${FIELD_CLASS} py-3 leading-relaxed resize-none`}
        />

        <div className="flex items-start justify-between gap-3 text-[12px]">
          <span
            className="text-[var(--text-tertiary)]"
            style={overSoftLimit ? { color: 'var(--amber)' } : undefined}
          >
            {isConnection
              ? `${form.content.length}/${CONNECTION_NOTE_SOFT_LIMIT} — LinkedIn truncates longer invitation notes`
              : `${form.content.length} characters`}
          </span>
        </div>

        {/* A typo like {{firstname}} silently vanishes at send time, so name it. */}
        {unknownTokens.length > 0 && (
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-[var(--ui-radius-lg)] text-[12px]"
            style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}
          >
            <AlertTriangle size={14} className="shrink-0 mt-px" />
            <span>
              {unknownTokens.map((t) => `{{${t}}}`).join(', ')}{' '}
              {unknownTokens.length === 1 ? "isn't a known token" : "aren't known tokens"} — it will
              be removed when the message is sent.
            </span>
          </div>
        )}

        {showPreview && (
          <div
            className="px-4 py-3 rounded-[var(--ui-radius-lg)] text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{
              background: 'var(--surface-sunken)',
              border: '1px dashed var(--border-default)',
              color: preview ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            {preview || 'Nothing to preview yet.'}
            <div className="mt-2 text-[11px] text-[var(--text-tertiary)]">
              Sample data — each recipient gets their own details at send time.
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-[var(--text-primary)]">
          Description <span className="font-normal text-[var(--text-tertiary)]">— optional</span>
        </label>
        <input
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value.slice(0, DESCRIPTION_MAX) })
          }
          placeholder="When to use this one"
          disabled={saving}
          className={`${FIELD_CLASS} h-11`}
        />
      </div>

      {error && (
        <p
          className="text-[13px] font-medium px-3 py-2.5 rounded-[var(--ui-radius-lg)]"
          style={{ background: 'var(--red-tint)', color: 'var(--red)' }}
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--brand-purple)' }}
        >
          {saving ? 'Saving…' : template ? 'Save changes' : 'Create template'}
        </button>
      </div>
    </form>
  );
}
