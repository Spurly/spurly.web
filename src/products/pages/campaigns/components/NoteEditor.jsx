import { useState } from 'react';
import { Lock, Info, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Button } from 'src/core/primitives';
import { AiWriteButton } from 'src/products/personalization/AiWriteButton.jsx';
import { TemplatePickerModal } from 'src/products/pages/templates/components/TemplatePickerModal.jsx';

/**
 * The note, and the reason it may be locked.
 *
 * On a free LinkedIn account the field is disabled rather than merely
 * ignored: LinkedIn allows about five personalised invitations a month and
 * then silently drops the note, so a campaign that offered the field would
 * quietly start sending blank requests while claiming otherwise.
 *
 * Collapsed to a one-line summary by default in both the locked and
 * unlocked cases — this sits directly above the members table, and a full
 * paragraph (or an open textarea) every time someone just wants to check
 * status reads as clutter. "Why?" reveals the Premium explanation without
 * making it permanent weight on the page; "Edit note" opens the textarea.
 */
export function NoteEditor({ campaign, account, onSave, saving }) {
  /**
   * Seeded once per saved note, and reset by remounting rather than by an
   * effect — the parent keys this component on the note it was given. The
   * page polls every ten seconds while running, so an effect that pushed the
   * server's value into state would fight anyone typing.
   */
  const [value, setValue] = useState(campaign.note || '');
  const [expanded, setExpanded] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [pickingTemplate, setPickingTemplate] = useState(false);

  const locked = !account?.notesAllowed;
  const running = campaign.status === 'running';
  const cap = account?.noteCap ?? 200;
  const dirty = value !== (campaign.note || '');

  if (locked) {
    return (
      <div className="px-[var(--ui-pad-lg)] py-3">
        <div className="flex items-center gap-2">
          <Lock size={13} className="shrink-0 text-[var(--ui-text-tertiary)]" aria-hidden="true" />
          <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)]">Plain connection request — no note</p>
          <button
            onClick={() => setShowWhy((s) => !s)}
            className="inline-flex items-center gap-1 text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-secondary)] hover:underline shrink-0"
          >
            <Info size={12} aria-hidden="true" /> Why?
          </button>
        </div>
        {showWhy && (
          <p className="mt-1.5 pl-[21px] text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
            Notes need LinkedIn Premium. On a free account LinkedIn drops the note after about five
            invitations a month without saying so, so Spurly does not offer one rather than let a
            campaign quietly stop personalising halfway through.
          </p>
        )}
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className="px-[var(--ui-pad-lg)] py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] truncate">
            {value ? `“${value}”` : 'No note'}
          </p>
          {running && (
            <p className="mt-0.5 text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
              Pause the campaign to change the note — the people already invited were sent the old one.
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Edit note"
          disabled={running}
          trailingIcon={<ChevronDown size={13} />}
          onClick={() => setExpanded(true)}
        >
          Edit note
        </Button>
      </div>
    );
  }

  return (
    <div className="px-[var(--ui-pad-lg)] py-4 flex-1 min-h-0 flex flex-col gap-2.5">
      <textarea
        value={value}
        maxLength={cap}
        rows={5}
        disabled={running}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Connection note"
        placeholder="Say why you are reaching out…"
        className="w-full flex-1 min-h-[120px] resize-y text-[length:var(--ui-t-body)] rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-3 py-2 text-[var(--ui-text-primary)] disabled:opacity-60"
      />
      <div className="flex flex-col gap-2 shrink-0">
        <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
          {running
            ? 'Pause the campaign to change the note — the people already invited were sent the old one.'
            : `${value.length}/${cap} characters`}
        </span>
        <div className="flex items-center flex-wrap gap-2">
          <Button size="sm" variant="ghost" disabled={saving} trailingIcon={<ChevronUp size={13} />} onClick={() => { setValue(campaign.note || ''); setExpanded(false); }}>
            Collapse
          </Button>
          {!running && (
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={<FileText size={13} />}
              disabled={saving}
              onClick={() => setPickingTemplate(true)}
            >
              Use template
            </Button>
          )}
          {!running && (
            <AiWriteButton
              content={value}
              type="CONNECTION_REQUEST"
              maxLength={cap}
              disabled={saving}
              onApply={setValue}
            />
          )}
          <Button size="sm" className="ml-auto" disabled={running || !dirty || saving} onClick={() => onSave(value)}>
            {saving ? 'Saving…' : 'Save note'}
          </Button>
        </div>
      </div>
      {pickingTemplate && (
        <TemplatePickerModal
          action="connection"
          maxLength={cap}
          onClose={() => setPickingTemplate(false)}
          onPick={(template) => {
            setValue((template.content || '').slice(0, cap));
            setPickingTemplate(false);
          }}
        />
      )}
    </div>
  );
}
