import { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { getPlans, assignUserPlan } from 'src/core/gateway/adminApi';
import { Dropdown } from 'src/common/components/Dropdown';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message || 'An error occurred');
      } finally {
        if (active) setPlansLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedPlanId) {
      setError('Please select a plan');
      return;
    }

    setLoading(true);
    try {
      const result = await assignUserPlan(user._id, selectedPlanId);
      if (result.success) {
        setSuccess('Plan assigned successfully!');
        setTimeout(() => onSuccess(), 1000);
      } else {
        setError(result.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const currentPlanLabel = user.planId?.displayName || null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Allocate Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* User info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Name:</strong> {user.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Current plan:</strong>{' '}
              <span className="ml-1 inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-semibold">
                {currentPlanLabel || 'Default / none'}
              </span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select plan</label>
            {plansLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
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
