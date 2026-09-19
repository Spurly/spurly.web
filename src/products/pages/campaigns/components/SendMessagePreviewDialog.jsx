import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, UserPlus } from 'lucide-react';
import { Dialog, Button, IconButton } from 'src/core/primitives';
import { previewTemplate, previewValuesFor } from 'src/shared/utils/templateTokens.js';

/**
 * The confirmation both campaign types were missing: what will actually be
 * sent, to how many people, before "Start sending" does anything
 * irreversible.
 *
 * Originally built for `type: 'message'` campaigns only — a `connect`
 * campaign's note was already visible on the page above the Start button
 * (NoteEditor) and this dialog felt redundant on top of it. Generalized to
 * `mode: 'connect'` too so both flows get the same "who, and what exactly"
 * check immediately before the paced sender starts, rather than one flow
 * having a safety net the other doesn't. `template` is whichever field the
 * mode sends — `messageTemplate` for a message campaign, `note` for a
 * connect one — and an empty connect template renders the plain-invitation
 * copy rather than nothing, since "no note" is itself the thing to confirm.
 *
 * Sampled from a handful of real PENDING members (fetched fresh when this
 * opens, not from whatever the page's own member table happens to be
 * filtered to) so the person on screen is genuinely who is about to be
 * contacted, not a placeholder.
 */
const COPY = {
  message: {
    confirmLabel: 'Send messages',
    confirmingLabel: 'Starting…',
    ConfirmIcon: MessageSquare,
    verb: 'message',
    emptyPreview: 'Nothing to preview — the message is empty.',
  },
  connect: {
    confirmLabel: 'Send connection requests',
    confirmingLabel: 'Starting…',
    ConfirmIcon: UserPlus,
    verb: 'invitation',
    emptyPreview: 'Plain connection request — no note.',
  },
};

export function SendMessagePreviewDialog({
  open,
  onClose,
  onConfirm,
  confirming,
  mode = 'message',
  template,
  members,
  membersLoading,
  pendingCount,
  senderName,
}) {
  // Starts at the first recipient every time this dialog opens. No effect
  // needed: the parent only mounts this component while `open` is true (see
  // CampaignDetailPage.jsx), so a fresh mount is a fresh `useState(0)` —
  // same "reset by remounting" trick NoteEditor/MessageEditor use for their
  // own seeded-once state.
  const [index, setIndex] = useState(0);
  const copy = COPY[mode] ?? COPY.message;

  const pool = members || [];
  const safeIndex = pool.length ? index % pool.length : 0;
  const person = pool[safeIndex] || null;
  const values = previewValuesFor(
    person ? { name: person.name, title: person.headline } : {},
    senderName,
  );
  const rendered = template?.trim() ? previewTemplate(template, values) : '';

  return (
    <Dialog
      open={open}
      onClose={() => { if (!confirming) onClose(); }}
      title="Review before sending"
      description={
        pendingCount > 0
          ? `This ${copy.verb} goes to ${pendingCount.toLocaleString()} ${pendingCount === 1 ? 'person' : 'people'}, paced through your working hours — not all at once.`
          : 'Nobody is queued to receive this right now.'
      }
      size="md"
      closeOnBackdrop={!confirming}
      closeOnEscape={!confirming}
      footer={
        <>
          <Button variant="ghost" size="sm" disabled={confirming} onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            leadingIcon={confirming ? <Loader2 size={13} className="animate-spin" /> : <copy.ConfirmIcon size={13} />}
            disabled={confirming || pendingCount === 0}
            onClick={onConfirm}
          >
            {confirming ? copy.confirmingLabel : copy.confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {membersLoading ? (
          <div className="flex items-center gap-2 py-6 justify-center text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
            <Loader2 size={14} className="animate-spin" /> Loading a preview…
          </div>
        ) : (
          <div
            className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-sunken)] p-3"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-primary)] truncate">
                {person ? (person.name || 'This person') : 'Sample recipient'}
              </span>
              {pool.length > 1 && (
                <div className="flex items-center gap-1 shrink-0">
                  <IconButton
                    size="sm"
                    variant="ghost"
                    label="Previous recipient"
                    icon={<ChevronLeft size={13} />}
                    onClick={() => setIndex((i) => (i - 1 + pool.length) % pool.length)}
                  />
                  <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] tabular-nums">
                    {safeIndex + 1}/{pool.length}
                  </span>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    label="Next recipient"
                    icon={<ChevronRight size={13} />}
                    onClick={() => setIndex((i) => (i + 1) % pool.length)}
                  />
                </div>
              )}
            </div>
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)] whitespace-pre-wrap">
              {rendered || <span className="text-[var(--ui-text-tertiary)]">{copy.emptyPreview}</span>}
            </p>
          </div>
        )}

        {!membersLoading && pool.length === 0 && pendingCount > 0 && (
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
            Showing sample placeholders — could not load a real recipient just now.
          </p>
        )}
      </div>
    </Dialog>
  );
}

export default SendMessagePreviewDialog;
