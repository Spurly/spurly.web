import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, MessageSquare } from 'lucide-react';
import { Dialog, Button, IconButton } from 'src/ui/primitives';
import { previewTemplate, previewValuesFor } from 'src/shared/utils/templateTokens.js';

/**
 * The confirmation Hub's message campaigns were missing: what will actually
 * be sent, to how many people, before "Start sending" does anything
 * irreversible.
 *
 * A `type: 'connect'` campaign's note is already visible on the page above
 * the Start button (NoteEditor), and that flow is live in production and
 * unchanged here on purpose. A `type: 'message'` campaign had no equivalent
 * — clicking Start fired the paced sender straight from the editor with
 * nothing in between, which is the gap this dialog closes. Mirrors the
 * per-recipient preview offered elsewhere in the app (EditorPreview),
 * rendering the SAME token map (`previewTemplate` / `previewValuesFor`) so a
 * template that previews correctly there previews correctly here too.
 *
 * Sampled from a handful of real PENDING members (fetched fresh when this
 * opens, not from whatever the page's own member table happens to be
 * filtered to) so the person on screen is genuinely who is about to be
 * messaged, not a placeholder.
 */
export function SendMessagePreviewDialog({
  open,
  onClose,
  onConfirm,
  confirming,
  messageTemplate,
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

  const pool = members || [];
  const safeIndex = pool.length ? index % pool.length : 0;
  const person = pool[safeIndex] || null;
  const values = previewValuesFor(
    person ? { name: person.name, title: person.headline } : {},
    senderName,
  );
  const rendered = previewTemplate(messageTemplate, values);

  return (
    <Dialog
      open={open}
      onClose={() => { if (!confirming) onClose(); }}
      title="Review before sending"
      description={
        pendingCount > 0
          ? `This message goes to ${pendingCount.toLocaleString()} ${pendingCount === 1 ? 'person' : 'people'}, paced through your working hours — not all at once.`
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
            leadingIcon={confirming ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
            disabled={confirming || pendingCount === 0}
            onClick={onConfirm}
          >
            {confirming ? 'Starting…' : 'Send messages'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {membersLoading ? (
          <div className="flex items-center gap-2 py-6 justify-center text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
            <Loader2 size={14} className="animate-spin" /> Loading a preview…
          </div>
        ) : (
          <div
            className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-sunken)] p-3"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[var(--ui-t-label)] font-medium text-[var(--ui-text-primary)] truncate">
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
                  <span className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] tabular-nums">
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
            <p className="text-[var(--ui-t-body)] text-[var(--ui-text-primary)] whitespace-pre-wrap">
              {rendered || <span className="text-[var(--ui-text-tertiary)]">Nothing to preview — the message is empty.</span>}
            </p>
          </div>
        )}

        {!membersLoading && pool.length === 0 && pendingCount > 0 && (
          <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
            Showing sample placeholders — could not load a real recipient just now.
          </p>
        )}
      </div>
    </Dialog>
  );
}

export default SendMessagePreviewDialog;
