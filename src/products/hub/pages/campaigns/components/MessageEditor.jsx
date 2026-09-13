import { useState } from 'react';
import { Button } from 'src/ui/primitives';

/**
 * The message a `type: 'message'` campaign sends, mirroring NoteEditor's
 * shape exactly — same "seeded once per saved value, reset by remounting"
 * trick (the parent keys this on the saved template so the 10s poll while
 * running never fights someone mid-edit), same disabled-while-running lock.
 *
 * No LinkedIn-tier gating here, unlike NoteEditor's Premium lock: ordinary
 * messaging a 1st-degree connection is not a Premium feature, so there is
 * nothing to disable the field for. What IS enforced (server-side, in
 * campaigns/service.js#startCampaign) is that the message cannot be blank
 * when the campaign starts — an empty connection note is still a real send,
 * an empty message is not.
 */
const CAP = 2000;

export function MessageEditor({ campaign, onSave, saving }) {
  const [value, setValue] = useState(campaign.messageTemplate || '');

  const running = campaign.status === 'running';
  const dirty = value !== (campaign.messageTemplate || '');

  return (
    <div className="px-[var(--ui-pad-lg)] py-4 flex flex-col gap-2">
      <textarea
        value={value}
        maxLength={CAP}
        rows={4}
        disabled={running}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Campaign message"
        placeholder="Hi {{firstName}}, …"
        className="w-full text-[var(--ui-t-body)] rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-3 py-2 text-[var(--ui-text-primary)] disabled:opacity-60"
      />
      <div className="flex items-center justify-between">
        <span className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
          {running
            ? 'Pause the campaign to change the message — the people already messaged were sent the old one.'
            : `Use {{firstName}} to personalize · ${value.length}/${CAP} characters`}
        </span>
        <Button size="sm" disabled={running || !dirty || saving || !value.trim()} onClick={() => onSave(value)}>
          {saving ? 'Saving…' : 'Save message'}
        </Button>
      </div>
    </div>
  );
}

export default MessageEditor;
