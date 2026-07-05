import { useState, useEffect } from 'react';
import { getActionCosts, updateActionCost, updateActionBilling } from 'src/core/gateway/adminApi';
import { Loader, Save, Check, AlertCircle } from 'lucide-react';
import { AdminLayout } from 'src/admin/AdminLayout';

export function AdminPricingPage() {
  const [costs, setCosts] = useState([]);
  const [drafts, setDrafts] = useState({}); // feature -> string value being edited
  const [loading, setLoading] = useState(true);
  const [savingFeature, setSavingFeature] = useState(null);
  const [togglingFeature, setTogglingFeature] = useState(null);
  const [error, setError] = useState('');
  const [savedFeature, setSavedFeature] = useState(null);

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getActionCosts();
      if (result.success) {
        setCosts(result.data.costs);
        const initialDrafts = {};
        result.data.costs.forEach((c) => {
          initialDrafts[c.feature] = String(c.cost);
        });
        setDrafts(initialDrafts);
      } else {
        setError(result.message || 'Failed to load action costs');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (feature, value) => {
    setDrafts((prev) => ({ ...prev, [feature]: value }));
    setSavedFeature(null);
  };

  const handleSave = async (feature) => {
    const raw = drafts[feature];
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      setError(`Cost for ${feature} must be a number ≥ 0`);
      return;
    }

    setSavingFeature(feature);
    setError('');
    setSavedFeature(null);
    try {
      const result = await updateActionCost(feature, value);
      if (result.success) {
        setCosts((prev) =>
          prev.map((c) =>
            c.feature === feature ? { ...c, cost: value, updatedAt: result.data.updatedAt } : c
          )
        );
        setSavedFeature(feature);
        setTimeout(() => setSavedFeature(null), 2500);
      } else {
        setError(result.message || 'Failed to update cost');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setSavingFeature(null);
    }
  };

  const handleToggleBilling = async (feature, nextEnabled) => {
    setTogglingFeature(feature);
    setError('');
    setCosts((prev) =>
      prev.map((c) => (c.feature === feature ? { ...c, billingEnabled: nextEnabled } : c))
    );
    try {
      const result = await updateActionBilling(feature, nextEnabled);
      if (!result.success) {
        setCosts((prev) =>
          prev.map((c) => (c.feature === feature ? { ...c, billingEnabled: !nextEnabled } : c))
        );
        setError(result.message || 'Failed to update billing');
      } else {
        setCosts((prev) =>
          prev.map((c) =>
            c.feature === feature
              ? { ...c, billingEnabled: result.data.billingEnabled, updatedAt: result.data.updatedAt }
              : c
          )
        );
      }
    } catch (err) {
      setCosts((prev) =>
        prev.map((c) => (c.feature === feature ? { ...c, billingEnabled: !nextEnabled } : c))
      );
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setTogglingFeature(null);
    }
  };

  const isDirty = (c) => String(drafts[c.feature]) !== String(c.cost);

  return (
    <AdminLayout title="Pricing" subtitle="Credit cost per action">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="max-w-3xl">
          <div className="mb-6">
            <p className="text-gray-600">
              Set how many credits each action costs, and toggle billing per action. Changes are the
              source of truth and take effect for all users within a few minutes (backend cache
              refresh). The extension reads these values too.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              When an action's billing is <span className="font-medium">Off</span>, that action is
              free — no credits are deducted and users are never blocked for it. Turn it back{' '}
              <span className="font-medium">On</span> to resume charging at the cost shown.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-sm text-gray-500">
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Feature key</th>
                  <th className="px-6 py-3 font-medium">Billing</th>
                  <th className="px-6 py-3 font-medium">Cost (credits)</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {costs.map((c) => (
                  <tr key={c.feature} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.label}</td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {c.feature}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={c.billingEnabled !== false}
                          disabled={togglingFeature === c.feature}
                          onClick={() =>
                            handleToggleBilling(c.feature, !(c.billingEnabled !== false))
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                            c.billingEnabled !== false ? 'bg-green-500' : 'bg-gray-300'
                          } ${togglingFeature === c.feature ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                              c.billingEnabled !== false ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-sm font-medium ${
                            c.billingEnabled !== false ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {c.billingEnabled !== false ? 'On' : 'Off — free'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={drafts[c.feature] ?? ''}
                        onChange={(e) => handleChange(c.feature, e.target.value)}
                        disabled={c.billingEnabled === false}
                        title={
                          c.billingEnabled === false
                            ? 'Billing is off for this action — turn it on to edit the cost'
                            : undefined
                        }
                        className={`w-28 px-3 py-2 border rounded-lg focus:outline-none ${
                          c.billingEnabled === false
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300'
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSave(c.feature)}
                        disabled={
                          c.billingEnabled === false || !isDirty(c) || savingFeature === c.feature
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          c.billingEnabled === false || !isDirty(c)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'btn btn-primary'
                        }`}
                      >
                        {savingFeature === c.feature ? (
                          <Loader className="animate-spin" size={16} />
                        ) : savedFeature === c.feature ? (
                          <Check size={16} />
                        ) : (
                          <Save size={16} />
                        )}
                        {savedFeature === c.feature ? 'Saved' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
