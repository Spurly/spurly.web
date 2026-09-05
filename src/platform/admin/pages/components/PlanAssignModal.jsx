import { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { getPlans, assignUserPlan } from 'src/platform/admin/api';
import { Dropdown } from 'src/ui/primitives/Dropdown';
import { useToast } from 'src/ui/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';

/**
 * PlanAssignModal
 * Allocate a subscription plan to a specific user. Loads the list of plans and
 * lets the admin pick one; the currently-assigned plan (if any) is preselected.
 */
export default function PlanAssignModal({ user, onClose, onSuccess }) {
  const currentPlanId = user.planId?._id || user.planId || '';

  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId);
  const [plansLoading, setPlansLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  /* Inline covers two things a toast can't: the "pick a plan" field prompt, and
     a failed plan list — which would otherwise leave an empty dropdown with no
     explanation. Both are also toasted so they're not missed. */
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    let active = true;
    (async () => {
      setPlansLoading(true);
      setError('');
      try {
        const result = await getPlans();
        if (!active) return;
        if (result.success) {
          setPlans(result.data.plans || []);
        } else {
          setError(result.message || 'Failed to load plans');
          toast.error(getToastError(result, "Couldn't load plans"));
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, 'Failed to load plans'));
          toast.error(getToastError(err, "Couldn't load plans"));
        }
      } finally {
        if (active) setPlansLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPlanId) {
      setError('Please select a plan');
      return;
    }

    setLoading(true);
    try {
      const result = await assignUserPlan(user._id, selectedPlanId);
      if (result.success) {
        const label = plans.find((p) => p._id === selectedPlanId)?.displayName;
        toast.success(
          label
            ? `${user.name || user.email} moved to ${label}`
            : 'Plan assigned',
        );
        onSuccess();
      } else {
        toast.error(getToastError(result, "Couldn't assign the plan"));
      }
    } catch (err) {
      toast.error(getToastError(err, "Couldn't assign the plan"));
    } finally {
      setLoading(false);
    }
  };

  const currentPlanLabel = user.planId?.displayName || null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-[var(--ui-pad-lg)] border-b border-[var(--ui-border-hairline)]">
          <h2 className="text-[17px] font-medium text-[var(--ui-text-primary)]">Allocate Plan</h2>
          <button
            onClick={onClose}
            className="text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-secondary)] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* User info */}
        <div className="p-[var(--ui-pad-lg)] bg-[var(--ui-surface-page)] border-b border-[var(--ui-border-hairline)]">
          <div className="space-y-2">
            <p className="text-[12px] text-[var(--ui-text-secondary)]">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-[12px] text-[var(--ui-text-secondary)]">
              <strong>Name:</strong> {user.name}
            </p>
            <p className="text-[12px] text-[var(--ui-text-secondary)]">
              <strong>Current plan:</strong>{' '}
              <span className="ml-1 inline-block bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] px-3 py-1 rounded-full font-medium">
                {currentPlanLabel || 'Default / none'}
              </span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-[var(--ui-pad-lg)] space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-2">Select plan</label>
            {plansLoading ? (
              <div className="flex items-center gap-2 text-[var(--ui-text-tertiary)] text-[12px] py-2">
                <Loader size={16} className="animate-spin" />
                Loading plans...
              </div>
            ) : (
              <Dropdown
                id="assign-plan-select"
                variant="dashboard"
                value={selectedPlanId}
                onChange={setSelectedPlanId}
                placeholder="— Choose a plan —"
                options={plans.map((p) => [
                  p._id,
                  `${p.displayName}${p.isDefault ? ' (default)' : ''}${
                    p.isActive === false ? ' — inactive' : ''
                  }`,
                ])}
              />
            )}
          </div>

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
              disabled={loading || plansLoading}
              className="flex-1 btn btn-primary py-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Plan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
