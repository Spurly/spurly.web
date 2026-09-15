import { useState, useEffect, useCallback, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import adminController from 'src/core/admin/controller/admin.js';
import { ADMIN_EVENTS } from 'src/core/admin/constants/constants.js';
import { Loader, Save, Check, AlertCircle, Plus } from 'lucide-react';
import { AdminLayout } from 'src/core/pages/admin/components/AdminLayout';
import { DataTable } from 'src/core/DataTable';
import { Button, useToast } from 'src/core/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';
import PlanFormModal from '../components/PlanFormModal';
import { buildPlanColumns } from './planColumns.jsx';

/**
 * All network calls go through `adminController`, which reports back over
 * `eventEmitter` instead of returning/throwing — this page has no
 * async/await or try/catch of its own; that stays confined to the
 * controller and gateway.
 */
export function AdminPricingPage() {
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);

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

  // Declared above the effect that calls them, same reasoning as before: a
  // `const` referenced before its declaration is a temporal-dead-zone
  // hazard the moment anything calls it earlier, and it blocks the React
  // Compiler from optimising the component.
  const fetchCosts = useCallback(() => {
    setLoading(true);
    setError('');
    adminController.getActionCosts(eventEmitter);
  }, [eventEmitter]);

  const fetchPlans = useCallback(() => {
    setPlansLoading(true);
    setPlansError('');
    adminController.getPlans(eventEmitter);
  }, [eventEmitter]);

  useEffect(() => {
    function handleCostsSuccess(data) {
      setCosts(data.costs);
      const initialDrafts = {};
      data.costs.forEach((c) => {
        initialDrafts[c.feature] = String(c.cost);
      });
      setDrafts(initialDrafts);
      setLoading(false);
    }
    function handleCostsFailure(err) {
      setError(getApiErrorMessage(err, 'Failed to load action costs'));
      toast.error(getToastError(err, "Couldn't load action costs"));
      setLoading(false);
    }
    function handlePlansSuccess(data) {
      setPlans(data.plans || []);
      setPlansLoading(false);
    }
    function handlePlansFailure(err) {
      setPlansError(getApiErrorMessage(err, 'Failed to load plans'));
      toast.error(getToastError(err, "Couldn't load plans"));
      setPlansLoading(false);
    }

    eventEmitter.on(ADMIN_EVENTS.GET_ACTION_COSTS_SUCCESS, handleCostsSuccess);
    eventEmitter.on(ADMIN_EVENTS.GET_ACTION_COSTS_FAILURE, handleCostsFailure);
    eventEmitter.on(ADMIN_EVENTS.GET_PLANS_SUCCESS, handlePlansSuccess);
    eventEmitter.on(ADMIN_EVENTS.GET_PLANS_FAILURE, handlePlansFailure);

    return () => {
      eventEmitter.off(ADMIN_EVENTS.GET_ACTION_COSTS_SUCCESS, handleCostsSuccess);
      eventEmitter.off(ADMIN_EVENTS.GET_ACTION_COSTS_FAILURE, handleCostsFailure);
      eventEmitter.off(ADMIN_EVENTS.GET_PLANS_SUCCESS, handlePlansSuccess);
      eventEmitter.off(ADMIN_EVENTS.GET_PLANS_FAILURE, handlePlansFailure);
    };
  }, [eventEmitter, toast]);

  useEffect(() => {
    fetchCosts();
    fetchPlans();
  }, [fetchCosts, fetchPlans]);

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

  const handleChange = (feature, value) => {
    setDrafts((prev) => ({ ...prev, [feature]: value }));
    setSavedFeature(null);
  };

  const handleSave = (feature) => {
    const raw = drafts[feature];
    const value = Number(raw);
    /* Field validation — stays inline, next to the input it's about. */
    if (!Number.isFinite(value) || value < 0) {
      setError(`Cost for ${feature} must be a number ≥ 0`);
      return;
    }

    setSavingFeature(feature);
    setError('');
    setSavedFeature(null);

    eventEmitter.once(ADMIN_EVENTS.UPDATE_ACTION_COST_SUCCESS, (data) => {
      setCosts((prev) =>
        prev.map((c) =>
          c.feature === feature ? { ...c, cost: value, updatedAt: data.updatedAt } : c
        )
      );
      setSavedFeature(feature);
      setTimeout(() => setSavedFeature(null), 2500);
      toast.success(`${feature} now costs ${value} credit${value === 1 ? '' : 's'}`);
      setSavingFeature(null);
    });
    eventEmitter.once(ADMIN_EVENTS.UPDATE_ACTION_COST_FAILURE, (err) => {
      toast.error(getToastError(err, "Couldn't update the cost"));
      setSavingFeature(null);
    });

    adminController.updateActionCost(eventEmitter, feature, value);
  };

  const handleToggleBilling = (feature, nextEnabled) => {
    setTogglingFeature(feature);
    setError('');
    setCosts((prev) =>
      prev.map((c) => (c.feature === feature ? { ...c, billingEnabled: nextEnabled } : c))
    );

    eventEmitter.once(ADMIN_EVENTS.UPDATE_ACTION_BILLING_SUCCESS, (data) => {
      setCosts((prev) =>
        prev.map((c) =>
          c.feature === feature
            ? { ...c, billingEnabled: data.billingEnabled, updatedAt: data.updatedAt }
            : c
        )
      );
      toast.success(`Billing ${nextEnabled ? 'enabled' : 'disabled'} for ${feature}`);
      setTogglingFeature(null);
    });
    eventEmitter.once(ADMIN_EVENTS.UPDATE_ACTION_BILLING_FAILURE, (err) => {
      setCosts((prev) =>
        prev.map((c) => (c.feature === feature ? { ...c, billingEnabled: !nextEnabled } : c))
      );
      /* The optimistic toggle above has just been rolled back. A toast is the
         only signal the user gets that the switch flipped back on purpose. */
      toast.error(getToastError(err, "Couldn't update billing"));
      setTogglingFeature(null);
    });

    adminController.updateActionBilling(eventEmitter, feature, nextEnabled);
  };

  const isDirty = (c) => String(drafts[c.feature]) !== String(c.cost);

  return (
    <AdminLayout title="Pricing" subtitle="Plans & credit cost per action">
      {/* ============================ PLANS ============================ */}
      <div className="mb-12">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="max-w-2xl">
            <h3 className="text-[var(--ui-t-section)] font-medium text-[var(--ui-text-primary)]">
              Subscription plans
            </h3>
            <p className="text-[var(--ui-text-secondary)] text-[var(--ui-t-body)] leading-relaxed mt-1">
              Create custom plans with daily action limits. The{' '}
              <span className="font-medium text-[var(--ui-text-primary)]">default</span> plan is
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
          <div className="mb-4 flex items-center gap-2 p-3 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] font-medium"
            style={{ background: 'var(--ui-danger-tint)', color: 'var(--ui-danger)', border: '1px solid rgba(255,69,58,0.2)' }}>
            <AlertCircle size={18} />
            <span>{plansError}</span>
          </div>
        )}

        <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border-hairline)] overflow-hidden shadow-sm">
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
          <h3 className="text-[var(--ui-t-section)] font-medium text-[var(--ui-text-primary)] mb-3">
            Credit cost per action
          </h3>
          <div className="mb-6">
            <p className="text-[var(--ui-text-secondary)]">
              Set how many credits each action costs, and toggle billing per action. Changes are the
              source of truth and take effect for all users within a few minutes (backend cache
              refresh). The extension reads these values too.
            </p>
            <p className="text-[var(--ui-text-tertiary)] text-[var(--ui-t-label)] mt-2">
              When an action's billing is <span className="font-medium">Off</span>, that action is
              free — no credits are deducted and users are never blocked for it. Turn it back{' '}
              <span className="font-medium">On</span> to resume charging at the cost shown.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-[var(--ui-danger-tint)] text-[var(--ui-danger-fg)] rounded-[var(--ui-radius-md)] border border-[var(--ui-danger-tint)]">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-[var(--ui-surface-card)] border border-[var(--ui-border)] rounded-[var(--ui-radius-lg)] shadow-[var(--ui-shadow-sm)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--ui-surface-page)] text-left text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
                  <th className="px-[var(--ui-pad-lg)] py-3 font-medium">Action</th>
                  <th className="px-[var(--ui-pad-lg)] py-3 font-medium">Feature key</th>
                  <th className="px-[var(--ui-pad-lg)] py-3 font-medium">Billing</th>
                  <th className="px-[var(--ui-pad-lg)] py-3 font-medium">Cost (credits)</th>
                  <th className="px-[var(--ui-pad-lg)] py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border-hairline)]">
                {costs.map((c) => (
                  <tr key={c.feature} className="hover:bg-[var(--ui-surface-page)]">
                    <td className="px-[var(--ui-pad-lg)] py-4 font-medium text-[var(--ui-text-primary)]">{c.label}</td>
                    <td className="px-[var(--ui-pad-lg)] py-4">
                      <code className="text-[var(--ui-t-meta)] bg-[var(--ui-surface-sunken)] px-2 py-1 rounded text-[var(--ui-text-secondary)]">
                        {c.feature}
                      </code>
                    </td>
                    <td className="px-[var(--ui-pad-lg)] py-4">
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
                            c.billingEnabled !== false ? 'bg-[var(--ui-success)]' : 'bg-[var(--ui-border-strong)]'
                          } ${togglingFeature === c.feature ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                              c.billingEnabled !== false ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[var(--ui-t-label)] font-medium ${
                            c.billingEnabled !== false ? 'text-[var(--ui-success-fg)]' : 'text-[var(--ui-text-quaternary)]'
                          }`}
                        >
                          {c.billingEnabled !== false ? 'On' : 'Off — free'}
                        </span>
                      </div>
                    </td>
                    <td className="px-[var(--ui-pad-lg)] py-4">
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
                        className={`w-28 px-3 py-2 border rounded-[var(--ui-radius-md)] focus:outline-none ${
                          c.billingEnabled === false
                            ? 'border-[var(--ui-border-hairline)] bg-[var(--ui-surface-sunken)] text-[var(--ui-text-quaternary)] cursor-not-allowed'
                            : 'border-[var(--ui-border)]'
                        }`}
                      />
                    </td>
                    <td className="px-[var(--ui-pad-lg)] py-4">
                      <button
                        onClick={() => handleSave(c.feature)}
                        disabled={
                          c.billingEnabled === false || !isDirty(c) || savingFeature === c.feature
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-[var(--ui-radius-md)] text-[var(--ui-t-label)] font-medium transition-colors ${
                          c.billingEnabled === false || !isDirty(c)
                            ? 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-quaternary)] cursor-not-allowed'
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
