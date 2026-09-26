import { useState, useEffect, useMemo } from 'react';
import { Loader, Plus, Gift, X } from 'lucide-react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import adminController from 'src/core/admin/controller/admin.js';
import { ADMIN_EVENTS } from 'src/core/admin/constants/constants.js';
import { AdminLayout } from 'src/core/pages/admin/components/AdminLayout';
import { Button, Badge, useToast } from 'src/core/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';

/**
 * Admin → Billing
 *
 * Comped accounts — access granted outright, no payment involved. A comp is
 * a flag on the account and writes no payment history, which is what keeps
 * revenue reporting honest. (Promo codes were removed with the move to
 * Razorpay subscriptions — everyone pays the same monthly price after the
 * one free trial.)
 *
 * Every network call goes through `adminController`, which reports back
 * over an `eventEmitter` instead of returning/throwing — no async/await or
 * try/catch anywhere on this page, only in the controller/gateway.
 */

function Section({ icon: Icon, title, description, action, children }) {
  return (
    <section className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)]">
      <header className="flex items-start justify-between gap-4 border-b border-[var(--ui-border-hairline)] px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <Icon size={18} className="mt-0.5 shrink-0 text-[var(--ui-text-secondary)]" />
          <div className="min-w-0">
            <h2 className="text-[length:var(--ui-t-body)] font-semibold text-[var(--ui-text-primary)]">{title}</h2>
            <p className="mt-0.5 text-[length:var(--ui-t-body)] leading-relaxed text-[var(--ui-text-secondary)]">
              {description}
            </p>
          </div>
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Empty({ children }) {
  return (
    <p className="py-6 text-center text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{children}</p>
  );
}

/* ------------------------------------------------------------ exemptions */

function ExemptionForm({ onCancel, onGranted }) {
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setUsersLoading(true);
    setUsersError('');

    // 100 is the server's max page size for this endpoint. A dropdown
    // beyond that would need real search-as-you-type, which this screen
    // doesn't need yet — comping accounts is a rare, deliberate action.
    eventEmitter.once(ADMIN_EVENTS.GET_ALL_USERS_SUCCESS, (data) => {
      if (cancelled) return;
      setUsers(data.users || []);
      setUsersLoading(false);
    });
    eventEmitter.once(ADMIN_EVENTS.GET_ALL_USERS_FAILURE, (err) => {
      if (cancelled) return;
      setUsersError(getApiErrorMessage(err, 'Failed to load users'));
      setUsersLoading(false);
    });

    adminController.getAllUsers(eventEmitter, 100, 0);

    return () => {
      cancelled = true;
    };
  }, [eventEmitter]);

  function submit(e) {
    e.preventDefault();
    setSaving(true);

    const trimmedEmail = email.trim();

    eventEmitter.once(ADMIN_EVENTS.GRANT_BILLING_EXEMPTION_SUCCESS, () => {
      toast.success(`${trimmedEmail} comped`);
      setSaving(false);
      onGranted();
    });
    eventEmitter.once(ADMIN_EVENTS.GRANT_BILLING_EXEMPTION_FAILURE, (err) => {
      toast.error(getToastError(err, "Couldn't comp that account"));
      setSaving(false);
    });

    adminController.grantBillingExemption(eventEmitter, {
      email: trimmedEmail,
      reason: reason.trim(),
      until: until || null,
    });
  }

  const field =
    'w-full rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] px-3 py-2 text-[length:var(--ui-t-body)]';
  const label = 'block text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)] mb-1';

  return (
    <form
      onSubmit={submit}
      className="mb-5 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-sunken)] p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="ex-email">Account email</label>
          <select
            id="ex-email"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={usersLoading || !!usersError}
          >
            <option value="" disabled>
              {usersLoading
                ? 'Loading users…'
                : usersError
                ? 'Couldn’t load users'
                : 'Select an account'}
            </option>
            {users.map((u) => (
              <option key={u._id} value={u.email}>
                {u.email}
                {u.name ? ` — ${u.name}` : ''}
              </option>
            ))}
          </select>
          {usersError && (
            <p className="mt-1 text-[length:var(--ui-t-label)] text-[var(--ui-warning-fg)]">{usersError}</p>
          )}
        </div>
        <div>
          <label className={label} htmlFor="ex-reason">Reason</label>
          <input
            id="ex-reason"
            className={field}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Company account"
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="ex-until">Until (blank = indefinite)</label>
          <input id="ex-until" type="date" className={field} value={until} onChange={(e) => setUntil(e.target.value)} />
        </div>
      </div>
      <p className="mt-3 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
        A reason is required — six months from now an unexplained comp is
        indistinguishable from a billing bug.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Button type="submit" disabled={saving}>{saving ? 'Comping…' : 'Comp account'}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ page */

export function AdminBillingPage() {
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [exemptions, setExemptions] = useState([]);
  const [exLoading, setExLoading] = useState(true);
  const [exError, setExError] = useState('');
  const [showExForm, setShowExForm] = useState(false);

  function fetchExemptions() {
    setExLoading(true);
    setExError('');
    adminController.getBillingExemptions(eventEmitter);
  }

  useEffect(() => {
    // Accept either a bare array or { exemptions: [...] } — a shape mismatch
    // here renders a silent empty state, which reads as "nobody is comped".
    function handleExemptionsSuccess(data) {
      const list = Array.isArray(data) ? data : data?.exemptions || [];
      setExemptions(list);
      setExLoading(false);
    }
    function handleExemptionsFailure(err) {
      setExError(getApiErrorMessage(err, 'Failed to load comped accounts'));
      setExLoading(false);
    }

    eventEmitter.on(ADMIN_EVENTS.GET_BILLING_EXEMPTIONS_SUCCESS, handleExemptionsSuccess);
    eventEmitter.on(ADMIN_EVENTS.GET_BILLING_EXEMPTIONS_FAILURE, handleExemptionsFailure);

    return () => {
      eventEmitter.off(ADMIN_EVENTS.GET_BILLING_EXEMPTIONS_SUCCESS, handleExemptionsSuccess);
      eventEmitter.off(ADMIN_EVENTS.GET_BILLING_EXEMPTIONS_FAILURE, handleExemptionsFailure);
    };
  }, [eventEmitter]);

  useEffect(() => {
    // Indirection keeps react-hooks/set-state-in-effect quiet (same pattern
    // as SubscriptionContext).
    function runFetch() {
      fetchExemptions();
    }
    runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function revoke(row) {
    eventEmitter.once(ADMIN_EVENTS.REVOKE_BILLING_EXEMPTION_SUCCESS, (data) => {
      toast.success(`Comp revoked — falls back to ${data.fallsBackTo}`);
      fetchExemptions();
    });
    eventEmitter.once(ADMIN_EVENTS.REVOKE_BILLING_EXEMPTION_FAILURE, (err) => {
      toast.error(getToastError(err, "Couldn't revoke the comp"));
    });
    adminController.revokeBillingExemption(eventEmitter, row.email);
  }

  const th = 'pb-2 pr-3 text-left text-[length:var(--ui-t-meta)] font-medium uppercase tracking-wider text-[var(--ui-text-secondary)]';

  return (
    <AdminLayout title="Billing" subtitle="Comped accounts">
      <div className="flex flex-col gap-5 p-[var(--ui-pad-lg)]">

        <Section
          icon={Gift}
          title="Comped accounts"
          description="Full access with no payment — internal, founder, and special client accounts. Recorded as a flag on the account, so nothing here touches payment history or revenue reporting."
          action={
            !showExForm && (
              <Button size="sm" leadingIcon={<Plus size={14} />} onClick={() => setShowExForm(true)}>
                Comp an account
              </Button>
            )
          }
        >
          {showExForm && (
            <ExemptionForm
              onCancel={() => setShowExForm(false)}
              onGranted={() => {
                setShowExForm(false);
                fetchExemptions();
              }}
            />
          )}

          {exLoading ? (
            <div className="flex justify-center py-6">
              <Loader size={18} className="animate-spin text-[var(--ui-text-secondary)]" />
            </div>
          ) : exError ? (
            <Empty>{exError}</Empty>
          ) : !exemptions.length ? (
            <Empty>No comped accounts.</Empty>
          ) : (
            <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-[length:var(--ui-t-body)]">
                <thead className="sticky top-0 z-10 bg-[var(--ui-surface-card)]">
                  <tr className="border-b border-[var(--ui-border-hairline)]">
                    <th className={th}>Account</th>
                    <th className={th}>Reason</th>
                    <th className={th}>Until</th>
                    <th className={th}>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {exemptions.map((row) => (
                    <tr key={row._id} className="border-b border-[var(--ui-border-hairline)] last:border-0">
                      <td className="py-3 pr-3">
                        <div className="font-medium text-[var(--ui-text-primary)]">{row.email}</div>
                        {row.name && (
                          <div className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{row.name}</div>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
                        {row.billingExemptReason || '—'}
                      </td>
                      <td className="py-3 pr-3 text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
                        {row.billingExemptUntil
                          ? new Date(row.billingExemptUntil).toLocaleDateString()
                          : 'Indefinite'}
                      </td>
                      <td className="py-3 pr-3">
                        {row.isCurrentlyExempt ? (
                          <Badge size="sm" tone="success">Active</Badge>
                        ) : (
                          <Badge size="sm">Lapsed</Badge>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Button size="sm" variant="ghost" leadingIcon={<X size={13} />} onClick={() => revoke(row)}>
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

      </div>
    </AdminLayout>
  );
}

export default AdminBillingPage;
