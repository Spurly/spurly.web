import { useState } from 'react';
import { X, Layers, CheckCircle } from 'lucide-react';
import { Input } from 'src/common/components/Input';
import sessionsController from 'src/core/controllers/sessionsController.js';

export function CreateSessionModal({ profileIds, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null); // { copiedCount, sessionName }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const data = await sessionsController.createFromProfiles({
        sessionName: name.trim(),
        sessionDescription: description.trim() || undefined,
        profileIds,
      });
      setDone({ copiedCount: data.copiedCount, sessionName: name.trim() });
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-[20px] shadow-[var(--shadow-lg)] overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-[var(--separator)]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[11px] grid place-items-center shrink-0"
              style={{ background: 'var(--accent-tint)' }}
            >
              <Layers size={17} style={{ color: 'var(--brand-purple)' }} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[var(--text-primary)] tracking-[-0.014em]">
                Create session
              </h2>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                {profileIds.length} lead{profileIds.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-[9px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {done ? (
            /* Success state */
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div
                className="w-12 h-12 rounded-full grid place-items-center"
                style={{ background: 'var(--green-tint)' }}
              >
                <CheckCircle size={24} style={{ color: 'var(--green)' }} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[var(--text-primary)]">Session created</p>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                  <span className="font-semibold">"{done.sessionName}"</span> was created with{' '}
                  <span className="font-semibold">{done.copiedCount}</span> profile{done.copiedCount !== 1 ? 's' : ''}.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 h-10 px-6 rounded-[12px] text-[14px] font-semibold text-white"
                style={{ background: 'var(--brand-purple)' }}
              >
                Done
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Session name"
                placeholder="e.g. Apple Engineers — Q3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                autoFocus
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--text-primary)] tracking-[-0.006em]">
                  Description <span className="font-normal text-[var(--text-tertiary)]">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  placeholder="e.g. Filtered from all sessions"
                  rows={2}
                  className="w-full px-4 py-3 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-[12px] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)] transition-all resize-none disabled:opacity-50"
                />
              </div>

              {error && (
                <p
                  className="text-[13px] font-medium px-3 py-2.5 rounded-[10px]"
                  style={{ background: 'var(--red-tint)', color: 'var(--red)' }}
                >
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="h-10 px-4 rounded-[12px] text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="h-10 px-5 rounded-[12px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--brand-purple)' }}
                >
                  {submitting ? 'Creating…' : 'Create session'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
