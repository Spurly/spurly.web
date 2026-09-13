import { Eye, EyeOff, ChevronRight, AlertTriangle, FileText, Check, X } from 'lucide-react';
import {
  TEMPLATE_TOKENS,
  previewTemplate,
  findUnknownTokens,
} from 'src/shared/utils/templateTokens.js';

/**
 * Small, stateless pieces of the campaign detail page's action-config rail:
 * the note/message preview toggle and filled-in preview, the unknown-token
 * warning, the template-picker trigger, the token-insert chip bar, the
 * "applied ✓ / undo" notice, the extension-connection badge, and the
 * connection/message action cards. None of these own any state of their
 * own — everything comes from CampaignDetailPage via props.
 */


/** Show/hide the filled-in preview of the note or message. */
export function PreviewToggle({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 h-7 px-2.5 rounded-[var(--ui-radius-md)] text-[var(--ui-t-label)] font-medium transition-colors"
      style={
        on
          ? { background: 'var(--ui-accent-tint)', color: 'var(--ui-accent)' }
          : { background: 'var(--ui-surface-sunken)', color: 'var(--ui-text-secondary)' }
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
export function EditorPreview({ subject = '', body = '', values, person, index, count, onNext }) {
  const filledSubject = previewTemplate(subject, values);
  const filledBody = previewTemplate(body, values);
  const label = person?.name || 'this recipient';

  return (
    <div
      className="mt-3 rounded-[var(--ui-radius-lg)] overflow-hidden"
      style={{ border: '1px dashed var(--ui-border)', background: 'var(--ui-surface-sunken)' }}
    >
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[var(--ui-border-hairline)]">
        <span className="text-[var(--ui-t-meta)] font-medium text-[var(--ui-text-secondary)] truncate">
          {count > 0 ? `As ${label} will see it` : 'Preview'}
        </span>
        {count > 1 && (
          <>
            <span className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] tabular-nums ml-auto shrink-0">
              {index + 1}/{count}
            </span>
            <button
              type="button"
              onClick={onNext}
              title="Preview the next lead"
              className="shrink-0 w-6 h-6 grid place-items-center rounded-[var(--ui-radius-sm)] text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-surface-hover)] transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </>
        )}
      </div>

      <div className="px-3.5 py-3">
        {filledSubject && (
          <p className="text-[var(--ui-t-label)] font-medium text-[var(--ui-text-primary)] mb-1.5">
            {filledSubject}
          </p>
        )}
        <p
          className="text-[var(--ui-t-body)] leading-relaxed whitespace-pre-wrap"
          style={{ color: filledBody ? 'var(--ui-text-primary)' : 'var(--ui-text-tertiary)' }}
        >
          {filledBody ||
            (body.trim()
              ? 'Every token resolved to nothing — this lead has no matching details.'
              : 'Nothing written yet.')}
        </p>
        {count === 0 && (
          <p className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-2">
            No leads loaded — showing tokens as empty.
          </p>
        )}
      </div>
    </div>
  );
}

/** Names tokens the sender can't fill, before they silently vanish on send. */
export function UnknownTokenWarning({ content }) {
  const unknown = findUnknownTokens(content);
  if (unknown.length === 0) return null;
  return (
    <div
      className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-label)]"
      style={{ background: 'var(--ui-warning-tint)', color: 'var(--ui-warning)' }}
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
export function UseTemplateButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 h-7 px-2.5 rounded-[var(--ui-radius-md)] text-[var(--ui-t-label)] font-medium transition-colors"
      style={{ background: 'var(--ui-accent-tint)', color: 'var(--ui-accent)' }}
    >
      <FileText size={12} /> Template
    </button>
  );
}

/**
 * Token chips for the note / message editors. Same vocabulary the extension
 * fills at send time, so what's offered here is always substitutable.
 */
export function TokenBar({ onInsert, disabled = false }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2">
      <span className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mr-0.5">Insert</span>
      {TEMPLATE_TOKENS.map((t) => (
        <button
          key={t.token}
          type="button"
          disabled={disabled}
          title={`${t.label} — e.g. ${t.sample}`}
          onClick={() => onInsert(t.token)}
          className="px-2 h-6 rounded-[var(--ui-radius-sm)] font-mono text-[var(--ui-t-meta)] text-[var(--ui-accent-fg)] bg-[var(--ui-accent-tint)] hover:bg-[var(--ui-accent-tint-strong)] transition-colors disabled:opacity-40"
        >
          {t.token}
        </button>
      ))}
    </div>
  );
}

/** "Applied X ✓ · Undo" confirmation after a template fills the field. */
export function TemplateNotice({ notice, onDismiss }) {
  if (!notice) return null;
  return (
    <div
      className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-label)]"
      style={
        notice.trimmedTo
          ? { background: 'var(--ui-warning-tint)', color: 'var(--ui-warning)' }
          : { background: 'var(--ui-success-tint)', color: 'var(--ui-success)' }
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
export function ExtensionBadge({ ext }) {
  let dot = 'var(--ui-text-tertiary)';
  let label = 'Checking…';
  let title = 'Checking for the Spurly extension';

  if (!ext.checking) {
    if (!ext.installed) {
      dot = 'var(--ui-danger)';
      label = 'Extension off';
      title = 'Extension not detected on this page — enable it, then refresh';
    } else if (ext.loginKnown && !ext.loggedIn) {
      // Only warn about sign-in when the worker actually told us it's logged out.
      dot = 'var(--ui-warning-dot)';
      label = 'Sign in to extension';
      title = 'Extension detected but not signed in — open it and log in';
    } else {
      // Installed, and either confirmed logged-in or login unknown (worker asleep).
      dot = 'var(--ui-success)';
      label = 'Extension connected';
      title = 'The extension is connected';
    }
  }

  return (
    <button
      onClick={() => ext.recheck()}
      title={`${title} · click to recheck`}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-label)] font-medium transition-colors"
      style={{ background: 'var(--ui-surface-sunken)', color: 'var(--ui-text-secondary)', border: '1px solid var(--ui-border-hairline)' }}
    >
      <span
        className={`w-2 h-2 rounded-full ${ext.checking ? 'animate-pulse' : ''}`}
        style={{ background: dot }}
      />
      {label}
    </button>
  );
}

export function ActionCard({ icon: Icon, title, subtitle, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="relative flex flex-col items-start gap-2 p-4 rounded-[var(--ui-radius-lg)] text-left transition-colors disabled:cursor-not-allowed"
      style={{
        background: selected ? 'var(--ui-accent-tint)' : 'var(--ui-surface-sunken)',
        border: `1.5px solid ${selected ? 'var(--ui-accent)' : 'var(--ui-border-hairline)'}`,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {selected && (
        <span
          className="absolute top-3 right-3 w-5 h-5 rounded-full grid place-items-center text-white"
          style={{ background: 'var(--ui-accent)' }}
        >
          <Check size={12} />
        </span>
      )}
      <span
        className="w-9 h-9 rounded-[var(--ui-radius-lg)] grid place-items-center"
        style={{
          background: selected ? 'var(--ui-accent)' : 'var(--ui-accent-tint)',
          color: selected ? 'var(--ui-accent-on)' : 'var(--ui-accent-fg)',
        }}
      >
        <Icon size={18} />
      </span>
      <span className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">{title}</span>
      <span className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">{subtitle}</span>
    </button>
  );
}
