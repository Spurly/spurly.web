import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Megaphone, CheckCircle, ShieldAlert } from 'lucide-react';
import { Input } from 'src/common/components/Input';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/common/utils/apiError';
import campaignsController from 'src/core/controllers/campaignsController.js';
import { describeOutreach, isContacted } from 'src/common/utils/outreach';

/**
 * Create a campaign from the people selected in the Captured People table.
 *
 * The important behaviour here is the dedupe guard: re-inviting someone you
 * already invited is an account-risk event on LinkedIn, so already-contacted
 * people are called out and excluded by default. The preview below is computed
 * from the rows currently loaded in the table; the server re-checks the full
 * selection and reports the authoritative count back as `skippedContacted`.
 */
export function CreateCampaignModal({ people = [], personIds, onClose, onSuccess }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [excludeContacted, setExcludeContacted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // { campaign, memberCount, skippedContacted }

  const { contacted, hasFullPreview } = useMemo(() => {
    const list = people.filter(Boolean);
    return {
      contacted: list.filter(isContacted),
      // Selection can span pages while only the current page is loaded, so the
      // preview is only exact when we can see every selected row.
      hasFullPreview: list.length === personIds.length,
    };
  }, [people, personIds.length]);

  const contactedCount = contacted.length;
  const newCount = Math.max(0, personIds.length - contactedCount);
  const willSend = excludeContacted ? newCount : personIds.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      const result = await campaignsController.createCampaign({
        name: name.trim(),
        personIds,
        excludeContacted,
      });
      setDone(result);
      onSuccess?.();
      /* The result panel below says more than this does. The toast fires anyway
         so that "every completed action confirms the same way" holds without
         exception — a rule with carve-outs isn't one users can rely on. */
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
        {/* Header */}
        <div className="flex items-center justify-between px-[var(--ui-pad-lg)] pt-[var(--ui-pad-lg)] pb-[var(--ui-pad-lg)] border-b border-[var(--separator)]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[var(--ui-radius-lg)] grid place-items-center shrink-0"
              style={{ background: 'var(--accent-tint)' }}
            >
              <Megaphone size={17} style={{ color: 'var(--brand-purple)' }} />
            </div>
            <div>
              <h2 className="text-[14px] font-medium text-[var(--text-primary)] tracking-[-0.012em]">
                Create campaign
              </h2>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                {personIds.length} lead{personIds.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-[var(--ui-radius-md)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-[var(--ui-pad-lg)] py-5">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div
                className="w-12 h-12 rounded-full grid place-items-center"
                style={{ background: 'var(--green-tint)' }}
              >
                <CheckCircle size={24} style={{ color: 'var(--green)' }} />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[var(--text-primary)]">Campaign created</p>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                  <span className="font-medium">"{done.campaign.name}"</span> was created with{' '}
                  <span className="font-medium">{done.memberCount}</span> lead
                  {done.memberCount !== 1 ? 's' : ''}.
                </p>
                {done.skippedContacted > 0 && (
                  <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    {done.skippedContacted} already-contacted{' '}
                    {done.skippedContacted === 1 ? 'person was' : 'people were'} skipped.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={onClose}
                  className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => navigate(`/dashboard/campaigns/${done.campaign._id}`)}
                  className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-white"
                  style={{ background: 'var(--brand-purple)' }}
                >
                  Open campaign
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Campaign name"
                placeholder="e.g. Apple Engineers — Q3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                autoFocus
                required
                maxLength={120}
              />

              {/* Dedupe guard */}
              {contactedCount > 0 ? (
                <div
                  className="rounded-[var(--ui-radius-lg)] p-3.5"
                  style={{ background: 'var(--amber-tint)', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert
                      size={16}
                      style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium" style={{ color: 'var(--amber)' }}>
                        {hasFullPreview
                          ? `${newCount} new, ${contactedCount} already contacted`
                          : `${contactedCount} of the loaded rows were already contacted`}
                      </p>
                      <p className="text-[12px] mt-1 text-[var(--text-secondary)] leading-snug">
                        Re-inviting someone you've already reached can get your LinkedIn account
                        restricted.
                      </p>

                      {/* Who, exactly — first few, so the count isn't abstract. */}
                      <ul className="mt-2 flex flex-col gap-1">
                        {contacted.slice(0, 3).map((person) => {
                          const { label, relative } = describeOutreach(person.outreach);
                          return (
                            <li
                              key={person._id}
                              className="flex items-center justify-between gap-2 text-[12px]"
                            >
                              <span className="truncate text-[var(--text-secondary)]">
                                {person.name || person.linkedInUrl}
                              </span>
                              <span className="shrink-0 text-[var(--text-tertiary)] tabular-nums">
                                {label}
                                {relative ? ` · ${relative}` : ''}
                              </span>
                            </li>
                          );
                        })}
                        {contactedCount > 3 && (
                          <li className="text-[12px] text-[var(--text-tertiary)]">
                            +{contactedCount - 3} more
                          </li>
                        )}
                      </ul>

                      <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={excludeContacted}
                          onChange={(e) => setExcludeContacted(e.target.checked)}
                          disabled={submitting}
                          className="w-3.5 h-3.5 rounded-[var(--ui-radius-xs)] accent-[var(--brand-purple)] cursor-pointer"
                        />
                        <span className="text-[12px] font-medium text-[var(--text-primary)]">
                          Exclude already-contacted people
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                !hasFullPreview && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={excludeContacted}
                      onChange={(e) => setExcludeContacted(e.target.checked)}
                      disabled={submitting}
                      className="w-3.5 h-3.5 rounded-[var(--ui-radius-xs)] accent-[var(--brand-purple)] cursor-pointer"
                    />
                    <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                      Exclude anyone already contacted
                    </span>
                  </label>
                )
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || (hasFullPreview && willSend === 0)}
                  className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-white transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--brand-purple)' }}
                >
                  {submitting
                    ? 'Creating…'
                    : hasFullPreview && contactedCount > 0
                      ? `Create with ${willSend}`
                      : 'Create campaign'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
