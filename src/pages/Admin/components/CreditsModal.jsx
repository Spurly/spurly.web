import { useState } from 'react';
import { X, Plus, Minus, Loader } from 'lucide-react';
import { updateCredits } from 'src/core/gateway/adminApi';

export default function CreditsModal({ user, onClose, onSuccess }) {
  const [mode, setMode] = useState('add'); // 'add' or 'deduct'
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
        setSuccess(`Credits ${mode === 'add' ? 'added' : 'deducted'} successfully!`);
        setAmount('');
        setReason('');
        setTimeout(() => {
          onSuccess();
        }, 1500);
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
          <h2 className="text-xl font-bold text-gray-900">Manage Credits</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Name:</strong> {user.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Current Balance:</strong>
              <span className="ml-2 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                {user.creditBalance?.toFixed(1) || 0}
              </span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Action</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('add')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 transition-colors ${
                  mode === 'add'
                    ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <Plus size={18} />
                Add Credits
              </button>
              <button
                type="button"
                onClick={() => setMode('deduct')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 transition-colors ${
                  mode === 'deduct'
                    ? 'border-red-500 bg-red-50 text-red-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <Minus size={18} />
                Deduct Credits
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
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
