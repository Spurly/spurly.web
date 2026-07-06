import { useState, useEffect } from 'react';
import {
  getActionCosts,
  updateActionCost,
  updateActionBilling,
  getPlans,
} from 'src/core/gateway/adminApi';
import { Loader, Save, Check, AlertCircle, Plus } from 'lucide-react';
import { AdminLayout } from 'src/admin/AdminLayout';
import { DataTable } from 'src/common/components/DataTable';
import { Button } from 'src/common/components/Button';
import PlanFormModal from 'src/pages/Admin/components/PlanFormModal';
import { buildPlanColumns } from './planColumns.jsx';

export function AdminPricingPage() {
  const [costs, setCosts] = useState([]);
  const [drafts, setDrafts] = useState({}); // feature -> string value being edited
  const [loading, setLoading] = useState(true);
  const [savingFeature, setSavingFeature] = useState(null);
  const [togglingFeature, setTogglingFeature] = useState(null);
  const [error, setError] = useState('');
  const [savedFeature, setSavedFeature] = useState(null);

  // Plans management
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null); // null => create mode

  useEffect(() => {
    fetchCosts();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setPlansLoading(true);
    setPlansError('');
    try {
      const result = await getPlans();
      if (result.success) {
        setPlans(result.data.plans || []);
      } else {
        setPlansError(result.message || 'Failed to load plans');
      }
    } catch (err) {
      setPlansError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setPlansLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setShowPlanModal(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setShowPlanModal(true);
  };

  const handlePlanSuccess = () => {
    setShowPlanModal(false);
    setEditingPlan(null);
    fetchPlans();
  };

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
    <AdminLayout title="Pricing" subtitle="Plans & credit cost per action">
      {/* ============================ PLANS ============================ */}
      <div className="mb-12">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="max-w-2xl">
            <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">
              Subscription plans
            </h3>
            <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed mt-1">
              Create custom plans with daily action limits. The{' '}
              <span className="font-medium text-[var(--text-primary)]">default</span> plan is
              assigned to every new user automatically. Allocate specific plans to users from the
              Users tab.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leadingIcon={<Plus size={16} />}
            onClick={handleCreatePlan}
            className="flex-shrink-0"
          >
            New Plan
          </Button>
        </div>

        {plansError && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-[12px] text-[13px] font-medium"
            style={{ background: 'var(--red-tint)', color: 'var(--red)', border: '1px solid rgba(255,69,58,0.2)' }}>
            <AlertCircle size={18} />
            <span>{plansError}</span>
          </div>
        )}

        <div className="rounded-[16px] border border-[var(--border-hairline)] overflow-hidden shadow-sm">
          <DataTable
            columns={buildPlanColumns(handleEditPlan)}
            data={plans}
            rowKey={(row) => row._id}
            loading={plansLoading}
            emptyMessage="No plans yet"
            emptyHint="Create a plan to get started"
            maxHeight="none"
          />
        </div>
      </div>

      {/* ======================= ACTION COSTS ========================= */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="max-w-3xl">
          <h3 className="text-[17px] font-semibold text-[var(--text-primary)] mb-3">
            Credit cost per action
          </h3>
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

      {showPlanModal && (
        <PlanFormModal
          plan={editingPlan}
          onClose={() => {
            setShowPlanModal(false);
            setEditingPlan(null);
          }}
          onSuccess={handlePlanSuccess}
        />
      )}
    </AdminLayout>
  );
}
