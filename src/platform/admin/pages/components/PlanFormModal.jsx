import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { createPlan, updatePlan } from 'src/platform/admin/api';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';

/**
 * PlanFormModal
 * Create a new plan or edit an existing one. When `plan` is provided the modal
 * runs in edit mode (the internal `name` key is immutable to avoid breaking
 * seed/backfill references); otherwise it creates a new plan.
 *
 * Fields mirror the Plan schema: name, displayName, isActive, isDefault, rank,
 * the three daily limits, and the feature flags.
 *
 * RANK AND FEATURES ARE NOT COSMETIC. Rank is what makes "a higher tier must
 * be a superset of the tier below" a checkable statement — the server rejects
 * a save that breaks it, in either direction, and the message names the plan
 * and the field. Hub is what lets a plan's users link a LinkedIn account, and
 * every linked account is ~EUR 5/month against the vendor's peak-accounts
 * figure. Both are surfaced here rather than left to the CLI, because a switch
 * that spends money should be visible to whoever is editing the plan.
 */
export default function PlanFormModal({ plan, onClose, onSuccess }) {
  const isEdit = Boolean(plan);

  const [name, setName] = useState(plan?.name || '');
  const [displayName, setDisplayName] = useState(plan?.displayName || '');
  const [isActive, setIsActive] = useState(plan ? plan.isActive !== false : true);
  const [captureCardsPerDay, setCaptureCardsPerDay] = useState(
    String(plan?.limits?.captureCardsPerDay ?? 50)
  );
  const [sendConnectionsPerDay, setSendConnectionsPerDay] = useState(
    String(plan?.limits?.sendConnectionsPerDay ?? 25)
  );
  const [sendMessagesPerDay, setSendMessagesPerDay] = useState(
    String(plan?.limits?.sendMessagesPerDay ?? 25)
  );
  const [rank, setRank] = useState(String(plan?.rank ?? 0));
  const [hub, setHub] = useState(Boolean(plan?.features?.hub));

  const [loading, setLoading] = useState(false);
  /* Field validation only — these point at specific inputs. */
  const [error, setError] = useState('');
  const toast = useToast();

  const validNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEdit && !name.trim()) {
      setError('Plan name (internal key) is required');
      return;
    }
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }
    if (
      !validNumber(captureCardsPerDay) ||
      !validNumber(sendConnectionsPerDay) ||
      !validNumber(sendMessagesPerDay)
    ) {
      setError('All limits must be numbers ≥ 0');
      return;
    }
    if (!validNumber(rank)) {
      setError('Tier must be a number ≥ 0');
      return;
    }

    const limits = {
      captureCardsPerDay: Number(captureCardsPerDay),
      sendConnectionsPerDay: Number(sendConnectionsPerDay),
      sendMessagesPerDay: Number(sendMessagesPerDay),
    };

    setLoading(true);
    try {
      let result;
      const features = { hub };

      if (isEdit) {
        result = await updatePlan(plan._id, {
          displayName: displayName.trim(),
          isActive,
          rank: Number(rank),
          limits,
          features,
        });
      } else {
        result = await createPlan({
          name: name.trim().toLowerCase(),
          displayName: displayName.trim(),
          isActive,
          rank: Number(rank),
          limits,
          features,
        });
      }

      if (result.success) {
        toast.success(
          isEdit ? `Updated ${displayName.trim()}` : `Created ${displayName.trim()}`,
        );
        onSuccess();
      } else {
        // Shown in the form as well as the toast: the superset invariant's
        // refusal names a field and another plan, and it is the kind of
        // sentence you want to still be on screen while you fix the number.
        setError(result.message || 'The plan could not be saved');
        toast.error(getToastError(result, isEdit ? "Couldn't update the plan" : "Couldn't create the plan"));
      }
    } catch (err) {
      toast.error(
        getToastError(err, isEdit ? "Couldn't update the plan" : "Couldn't create the plan"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-[var(--ui-pad-lg)] border-b border-[var(--ui-border-hairline)]">
          <h2 className="text-[17px] font-medium text-[var(--ui-text-primary)]">
            {isEdit ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-secondary)] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-[var(--ui-pad-lg)] space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-2">
              Internal name (key)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. pro"
              className="input"
              disabled={loading || isEdit}
            />
            <p className="text-[11px] text-[var(--ui-text-tertiary)] mt-1">
              {isEdit
                ? 'The internal key cannot be changed after creation.'
                : 'Lowercase key used internally (e.g. free, solopreneur, agency).'}
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-2">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Pro"
              className="input"
              disabled={loading}
            />
          </div>

          {/* Limits */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-2">Captures / day</label>
              <input
                type="number"
                min="0"
                step="1"
                value={captureCardsPerDay}
                onChange={(e) => setCaptureCardsPerDay(e.target.value)}
                className="input"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-2">
                Connections / day
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={sendConnectionsPerDay}
                onChange={(e) => setSendConnectionsPerDay(e.target.value)}
                className="input"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-2">Messages / day</label>
              <input
                type="number"
                min="0"
                step="1"
                value={sendMessagesPerDay}
                onChange={(e) => setSendMessagesPerDay(e.target.value)}
                className="input"
                disabled={loading}
              />
            </div>
          </div>

          {/* Tier + entitlements */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-2">Tier</label>
              <input
                type="number"
                min="0"
                step="1"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="input"
                disabled={loading}
              />
              <p className="text-[11px] text-[var(--ui-text-tertiary)] mt-1">
                Higher is a superset of lower. A plan may not carry a smaller limit, or
                fewer features, than any plan beneath it.
              </p>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-2">
                Includes
              </label>
              <label className="flex items-center gap-2 text-[12px] text-[var(--ui-text-secondary)] cursor-pointer h-[34px]">
                <input
                  type="checkbox"
                  checked={hub}
                  onChange={(e) => setHub(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4"
                />
                Outreach hub
              </label>
              <p className="text-[11px] text-[var(--ui-text-tertiary)] mt-1">
                Lets these users link a LinkedIn account — about €5/month each, billed on
                the peak connected in any 30 days.
              </p>
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 text-[12px] text-[var(--ui-text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading}
              className="h-4 w-4"
            />
            Active
          </label>

          {error && (
            <div className="p-3 bg-[var(--ui-danger-tint)] border border-[var(--ui-danger-tint)] rounded-[var(--ui-radius-md)] text-[var(--ui-danger-fg)] text-[12px]">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn btn-secondary py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn btn-primary py-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Create Plan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
