import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { createPlan, updatePlan } from 'src/core/gateway/adminApi';

/**
 * PlanFormModal
 * Create a new plan or edit an existing one. When `plan` is provided the modal
 * runs in edit mode (the internal `name` key is immutable to avoid breaking
 * seed/backfill references); otherwise it creates a new plan.
 *
 * Fields mirror the Plan schema: name, displayName, isActive, isDefault, and
 * the three daily limits (captureCardsPerDay, sendConnectionsPerDay,
 * sendMessagesPerDay).
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

    const limits = {
      captureCardsPerDay: Number(captureCardsPerDay),
      sendConnectionsPerDay: Number(sendConnectionsPerDay),
      sendMessagesPerDay: Number(sendMessagesPerDay),
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await updatePlan(plan._id, {
          displayName: displayName.trim(),
          isActive,
          limits,
        });
      } else {
        result = await createPlan({
          name: name.trim().toLowerCase(),
          displayName: displayName.trim(),
          isActive,
          limits,
        });
      }

      if (result.success) {
        setSuccess(isEdit ? 'Plan updated successfully!' : 'Plan created successfully!');
        setTimeout(() => onSuccess(), 900);
      } else {
        setError(result.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <p className="text-xs text-gray-500 mt-1">
              {isEdit
                ? 'The internal key cannot be changed after creation.'
                : 'Lowercase key used internally (e.g. free, solopreneur, agency).'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Captures / day</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Messages / day</label>
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

          {/* Active toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
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
