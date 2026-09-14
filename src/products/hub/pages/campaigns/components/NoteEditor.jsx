import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from 'src/ui/primitives';
import { AiWriteButton } from 'src/products/hub/personalization/AiWriteButton.jsx';

/**
 * The note, and the reason it may be locked.
 *
 * On a free LinkedIn account the field is disabled rather than merely
 * ignored: LinkedIn allows about five personalised invitations a month and
 * then silently drops the note, so a campaign that offered the field would
 * quietly start sending blank requests while claiming otherwise.
 */
export function NoteEditor({ campaign, account, onSave, saving }) {
  /**
   * Seeded once per saved note, and reset by remounting rather than by an
   * effect — the parent keys this component on the note it was given. The
   * page polls every ten seconds while running, so an effect that pushed the
   * server's value into state would fight anyone typing.
   */
  const [value, setValue] = useState(campaign.note || '');

  const locked = !account?.notesAllowed;
  const running = campaign.status === 'running';
  const cap = account?.noteCap ?? 200;
  const dirty = value !== (campaign.note || '');

  if (locked) {
    return (
      <div className="px-[var(--ui-pad-lg)] py-4 flex items-start gap-3">
        <Lock size={14} className="mt-0.5 shrink-0 text-[var(--ui-text-tertiary)]" aria-hidden="true" />
        <div>
          <p className="text-[var(--ui-t-body)] text-[var(--ui-text-primary)]">This campaign sends a plain connection request.</p>
          <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] mt-0.5">
            Notes need LinkedIn Premium. On a free account LinkedIn drops the note after about five
            invitations a month without saying so, so Spurly does not offer one rather than let a
            campaign quietly stop personalising halfway through.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[var(--ui-pad-lg)] py-4 flex flex-col gap-2">
      <textarea
        value={value}
        maxLength={cap}
        rows={3}
        disabled={running}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Connection note"
        placeholder="Say why you are reaching out…"
        className="w-full text-[var(--ui-t-body)] rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-3 py-2 text-[var(--ui-text-primary)] disabled:opacity-60"
      />
      <div className="flex items-center justify-between">
        <span className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
          {running
            ? 'Pause the campaign to change the note — the people already invited were sent the old one.'
            : `${value.length}/${cap} characters`}
        </span>
        <div className="flex items-center gap-2">
          {!running && (
            <AiWriteButton
              content={value}
              type="CONNECTION_REQUEST"
              maxLength={cap}
              disabled={saving}
              onApply={setValue}
            />
          )}
          <Button size="sm" disabled={running || !dirty || saving} onClick={() => onSave(value)}>
            {saving ? 'Saving…' : 'Save note'}
          </Button>
        </div>
      </div>
    </div>
  );
}
