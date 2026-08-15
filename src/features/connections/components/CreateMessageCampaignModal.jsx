import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, CheckCircle } from 'lucide-react';
import { Input } from 'src/common/components/Input';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/common/utils/apiError';
import campaignsController from 'src/core/controllers/campaignsController.js';

/**
 * Create a message campaign from the connections selected in the table.
 *
 * A separate component from the People page's CreateCampaignModal rather than a
 * variant of it, because the two differ in the thing that modal is mostly about.
 * That one exists largely to guard against re-inviting someone — a repeat
 * connection request is an account-risk event on LinkedIn, so it previews and
 * excludes already-contacted people by default. None of that applies here:
 * messaging someone you've messaged before is ordinary, so the guard would be
 * wrong, and the preview it drives would be noise.
 *
 * What's left is deliberately small — a name, and a note about what will happen.
 * The message itself is written on the campaign page, where the AI writer, the
 * token chips and the per-recipient preview already live. Duplicating a message
 * editor in here would mean two places to keep in step.
 *
 * Props:
 *   connectionIds — selected Connection _ids
 *   onClose       — () => void
 *   onSuccess     — () => void, so the table can clear its selection
 */
export function CreateMessageCampaignModal({ connectionIds = [], onClose, onSuccess }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const count = connectionIds.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);

    try {
      const result = await campaignsController.createCampaignFromConnections({
        name: name.trim(),
        connectionIds,
      });
      setDone(result);
      onSuccess?.();
      /* Redundant with the result panel below, and deliberately so — every
         completed action in the app confirms the same way. */
      toast.success(`Campaign "${name.trim()}" created`);
    } catch (err) {
      toast.error(getToastError(err, "Couldn't create the campaign"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-[var(--ui-radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-[var(--ui-radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <X size={16} />
        </button>

        {done ? (
          <div className="p-[var(--ui-pad-lg)] flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle size={20} style={{ color: 'var(--brand-purple)' }} />
              <h2 className="text-[17px] font-medium text-[var(--text-primary)]">Campaign created</h2>
            </div>

            <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">{done.campaign?.name}</strong> has{' '}
              {done.memberCount} {done.memberCount === 1 ? 'person' : 'people'}. Write the message on
              the campaign page, then send.
            </p>

            {/* Silence here would be worse than a sentence: a campaign quietly
                containing fewer people than were selected is discovered days
                later, after wondering why half the list was never messaged. */}
            {done.skipped > 0 && (
              <p className="text-[12px]" style={{ color: 'var(--amber)' }}>
                {done.skipped} {done.skipped === 1 ? 'connection was' : 'connections were'} skipped —
                their LinkedIn profile URL was missing or malformed.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/campaigns/${done.campaign?._id}`)}
                className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-white"
                style={{ background: 'var(--brand-purple)' }}
              >
                Write the message
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-[var(--ui-pad-lg)] flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <MessageSquare size={18} style={{ color: 'var(--brand-purple)' }} />
              <h2 className="text-[17px] font-medium text-[var(--text-primary)]">
                Message {count} {count === 1 ? 'connection' : 'connections'}
              </h2>
            </div>

            <Input
              label="Campaign name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 120))}
              placeholder="e.g. Q3 check-in"
              disabled={submitting}
              autoFocus
            />

            {/* Two things the user can't infer and would otherwise discover
                after the fact: this is message-only, and their connections
                also land in People. */}
            <div
              className="px-4 py-3 rounded-[var(--ui-radius-lg)] text-[12px] leading-relaxed"
              style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
            >
              <p>
                This sends a LinkedIn <strong>message</strong>, not a connection request — everyone
                here is already connected to you.
              </p>
              <p className="mt-2">
                These {count === 1 ? 'connection' : 'connections'} will also be added to your People
                list so outreach is tracked against them. They stay in Connections too.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || submitting || count === 0}
                className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--brand-purple)' }}
              >
                {submitting ? 'Creating…' : 'Create campaign'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateMessageCampaignModal;
