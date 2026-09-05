import { useState } from 'react';
import { X, Plus, Minus, Loader } from 'lucide-react';
import { updateCredits } from 'src/platform/admin/api';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';

export default function CreditsModal({ user, onClose, onSuccess }) {
  const [mode, setMode] = useState('add'); // 'add' or 'deduct'
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  /* Field validation only — the API's own verdict is a toast. */
  const [error, setError] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount');
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const result = await updateCredits(
        user._id,
        numAmount,
        mode === 'add' ? 'add' : 'deduct',
        reason
      );

      if (result.success) {
        toast.success(
          `${numAmount.toLocaleString()} credits ${mode === 'add' ? 'added to' : 'deducted from'} ${user.name || user.email}`,
        );
        setAmount('');
        setReason('');
        /* The confirmation now lives outside the modal, so there's no reason to
           hold it open — close as soon as the write lands. */
        onSuccess();
      } else {
        toast.error(getToastError(result, "Couldn't update credits"));
      }
    } catch (err) {
      toast.error(getToastError(err, "Couldn't update credits"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-[var(--ui-pad-lg)] border-b border-[var(--ui-border-hairline)]">
          <h2 className="text-[17px] font-medium text-[var(--ui-text-primary)]">Manage Credits</h2>
          <button
            onClick={onClose}
            className="text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-secondary)] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-[var(--ui-pad-lg)] bg-[var(--ui-surface-page)] border-b border-[var(--ui-border-hairline)]">
          <div className="space-y-2">
            <p className="text-[12px] text-[var(--ui-text-secondary)]">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-[12px] text-[var(--ui-text-secondary)]">
              <strong>Name:</strong> {user.name}
            </p>
            <p className="text-[12px] text-[var(--ui-text-secondary)]">
              <strong>Current Balance:</strong>
              <span className="ml-2 inline-block bg-[var(--ui-info-tint)] text-[var(--ui-info-fg)] px-3 py-1 rounded-full font-medium">
                {user.creditBalance?.toFixed(1) || 0}
              </span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-[var(--ui-pad-lg)] space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)]">Action</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('add')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--ui-radius-md)] border-2 transition-colors ${
                  mode === 'add'
                    ? 'border-[var(--ui-success)] bg-[var(--ui-success-tint)] text-[var(--ui-success-fg)] font-medium'
                    : 'border-[var(--ui-border-hairline)] text-[var(--ui-text-secondary)] hover:border-[var(--ui-border)]'
                }`}
              >
                <Plus size={18} />
                Add Credits
              </button>
              <button
                type="button"
                onClick={() => setMode('deduct')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--ui-radius-md)] border-2 transition-colors ${
                  mode === 'deduct'
                    ? 'border-[var(--ui-danger)] bg-[var(--ui-danger-tint)] text-[var(--ui-danger-fg)] font-medium'
                    : 'border-[var(--ui-border-hairline)] text-[var(--ui-text-secondary)] hover:border-[var(--ui-border)]'
                }`}
              >
                <Minus size={18} />
                Deduct Credits
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-2">
              {mode === 'add' ? 'Credits to Add' : 'Credits to Deduct'}
            </label>
            <input
              type="number"
              step="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="input"
              disabled={loading}
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you making this adjustment?"
              rows="3"
              className="input resize-none"
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-[var(--ui-danger-tint)] border border-[var(--ui-danger-tint)] rounded-[var(--ui-radius-md)] text-[var(--ui-danger-fg)] text-[12px]">
              {error}
            </div>
          )}

          {/* Buttons */}
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
                  Processing...
                </>
              ) : (
                `${mode === 'add' ? 'Add' : 'Deduct'} Credits`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
