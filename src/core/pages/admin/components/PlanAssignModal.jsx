import { useEffect, useMemo, useState } from 'react';
import { X, Loader } from 'lucide-react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import adminController from 'src/core/admin/controller/admin.js';
import { ADMIN_EVENTS } from 'src/core/admin/constants/constants.js';
import { Dropdown } from 'src/core/primitives/Dropdown';
import { useToast } from 'src/core/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';

/**
 * PlanAssignModal
 * Allocate a subscription plan to a specific user. Loads the list of plans and
 * lets the admin pick one; the currently-assigned plan (if any) is preselected.
 */
export default function PlanAssignModal({ user, onClose, onSuccess }) {
  const currentPlanId = user.planId?._id || user.planId || '';
  const eventEmitter = useMemo(() => new EventEmitter(), []);

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
    setPlansLoading(true);
    setError('');

    eventEmitter.once(ADMIN_EVENTS.GET_PLANS_SUCCESS, (data) => {
      if (!active) return;
      setPlans(data.plans || []);
      setPlansLoading(false);
    });
    eventEmitter.once(ADMIN_EVENTS.GET_PLANS_FAILURE, (err) => {
      if (!active) return;
      setError(getApiErrorMessage(err, 'Failed to load plans'));
      toast.error(getToastError(err, "Couldn't load plans"));
      setPlansLoading(false);
    });

    adminController.getPlans(eventEmitter);

    return () => {
      active = false;
    };
  }, [eventEmitter, toast]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPlanId) {
      setError('Please select a plan');
      return;
    }

    setLoading(true);

    eventEmitter.once(ADMIN_EVENTS.ASSIGN_USER_PLAN_SUCCESS, () => {
      const label = plans.find((p) => p._id === selectedPlanId)?.displayName;
      toast.success(
        label
          ? `${user.name || user.email} moved to ${label}`
          : 'Plan assigned',
      );
      setLoading(false);
      onSuccess();
    });
    eventEmitter.once(ADMIN_EVENTS.ASSIGN_USER_PLAN_FAILURE, (err) => {
      toast.error(getToastError(err, "Couldn't assign the plan"));
      setLoading(false);
    });

    adminController.assignUserPlan(eventEmitter, user._id, selectedPlanId);
  };

  const currentPlanLabel = user.planId?.displayName || null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-[var(--ui-pad-lg)] border-b border-[var(--ui-border-hairline)]">
          <h2 className="text-[var(--ui-t-section)] font-medium text-[var(--ui-text-primary)]">Allocate Plan</h2>
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
            <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)]">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)]">
              <strong>Name:</strong> {user.name}
            </p>
            <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)]">
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
            <label className="block text-[var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)] mb-2">Select plan</label>
            {plansLoading ? (
              <div className="flex items-center gap-2 text-[var(--ui-text-tertiary)] text-[var(--ui-t-label)] py-2">
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
            <div className="p-3 bg-[var(--ui-danger-tint)] border border-[var(--ui-danger-tint)] rounded-[var(--ui-radius-md)] text-[var(--ui-danger-fg)] text-[var(--ui-t-label)]">
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
