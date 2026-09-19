import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from 'src/core/primitives';
import { AiWriteButton } from 'src/products/personalization/AiWriteButton.jsx';

/**
 * The message a `type: 'message'` campaign sends, mirroring NoteEditor's
 * shape exactly — same "seeded once per saved value, reset by remounting"
 * trick (the parent keys this on the saved template so the 10s poll while
 * running never fights someone mid-edit), same disabled-while-running lock,
 * and the same collapsed-by-default one-liner so this doesn't sit as a full
 * open textarea above the members table once a message is already saved.
 *
 * No LinkedIn-tier gating here, unlike NoteEditor's Premium lock: ordinary
 * messaging a 1st-degree connection is not a Premium feature, so there is
 * nothing to disable the field for. What IS enforced (server-side, in
 * campaigns/service.js#startCampaign) is that the message cannot be blank
 * when the campaign starts — an empty connection note is still a real send,
 * an empty message is not, so this starts expanded when there's nothing
 * written yet rather than hiding a required field behind an extra click.
 */
const CAP = 2000;

export function MessageEditor({ campaign, onSave, saving }) {
  const [value, setValue] = useState(campaign.messageTemplate || '');
  const [expanded, setExpanded] = useState(!campaign.messageTemplate);

  const running = campaign.status === 'running';
  const dirty = value !== (campaign.messageTemplate || '');

  if (!expanded) {
    return (
      <div className="px-[var(--ui-pad-lg)] py-3 flex items-center justify-between gap-3">
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] truncate">
          “{value}”
        </p>
        <Button
          size="sm"
          variant="ghost"
          disabled={running}
          trailingIcon={<ChevronDown size={13} />}
          onClick={() => setExpanded(true)}
        >
          Edit message
        </Button>
      </div>
    );
  }

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
        className="w-full text-[length:var(--ui-t-body)] rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-3 py-2 text-[var(--ui-text-primary)] disabled:opacity-60"
      />
      <div className="flex items-center justify-between">
        <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
          {running
            ? 'Pause the campaign to change the message — the people already messaged were sent the old one.'
            : `Use {{firstName}} to personalize · ${value.length}/${CAP} characters`}
        </span>
        <div className="flex items-center gap-2">
          {campaign.messageTemplate && (
            <Button size="sm" variant="ghost" disabled={saving} trailingIcon={<ChevronUp size={13} />} onClick={() => { setValue(campaign.messageTemplate || ''); setExpanded(false); }}>
              Collapse
            </Button>
          )}
          {!running && (
            <AiWriteButton
              content={value}
              type="DIRECT_MESSAGE"
              maxLength={CAP}
              disabled={saving}
              onApply={setValue}
            />
          )}
          <Button size="sm" disabled={running || !dirty || saving || !value.trim()} onClick={() => onSave(value)}>
            {saving ? 'Saving…' : 'Save message'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MessageEditor;
