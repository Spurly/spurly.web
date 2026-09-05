import { useState, useEffect } from 'react';
import { Loader, Plus, Ticket, Gift, X, Pencil, Trash2 } from 'lucide-react';
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getBillingExemptions,
  grantBillingExemption,
  revokeBillingExemption,
  getAllUsers,
} from 'src/platform/admin/api';
import { AdminLayout } from 'src/platform/admin/AdminLayout';
import { Button, Badge, useToast } from 'src/ui/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';

/**
 * Admin → Billing
 *
 * Two things that both grant cheaper-or-free access, kept on one screen
 * because they answer the same question ("why is this account not paying
 * full price?") and are usually reasoned about together.
 *
 *   Promo codes — discounts customers apply themselves.
 *   Comped accounts — access granted outright, no payment involved.
 *
 * Neither writes payment history: a comp is a flag on the account and a promo
 * only ever reduces a real payment. That separation is what keeps revenue
 * reporting honest.
 */

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function Section({ icon: Icon, title, description, action, children }) {
  return (
    <section className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-white">
      <header className="flex items-start justify-between gap-4 border-b border-[var(--ui-border-hairline)] px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <Icon size={18} className="mt-0.5 shrink-0 text-[var(--ui-text-secondary)]" />
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[var(--ui-text-primary)]">{title}</h2>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--ui-text-secondary)]">
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
    <p className="py-6 text-center text-[13px] text-[var(--ui-text-secondary)]">{children}</p>
  );
}

/* ---------------------------------------------------------------- promos */

const EMPTY_PROMO = {
  code: '',
  description: '',
  discountType: 'percent',
  percentOff: '',
  firstCycleAmountINR: '',
  appliesTo: 'first_payment',
  perUserLimit: 1,
  maxRedemptions: '',
  expiresAt: '',
};

function toFormState(promo) {
  if (!promo) return EMPTY_PROMO;
  return {
    code: promo.code || '',
    description: promo.description || '',
    discountType: promo.discountType || 'fixed_price',
    percentOff: promo.percentOff ?? '',
    firstCycleAmountINR: promo.firstCycleAmountINR ?? '',
    appliesTo: promo.appliesTo || 'first_payment',
    perUserLimit: promo.perUserLimit ?? 1,
    maxRedemptions: promo.maxRedemptions ?? '',
    expiresAt: promo.expiresAt ? String(promo.expiresAt).slice(0, 10) : '',
  };
}

function PromoForm({ editing, onCancel, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(() => toFormState(editing));
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isPercent = form.discountType === 'percent';

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        appliesTo: form.appliesTo,
        perUserLimit: Number(form.perUserLimit) || 1,
        maxRedemptions: form.maxRedemptions === '' ? null : Number(form.maxRedemptions),
        expiresAt: form.expiresAt || null,
      };
      if (isPercent) payload.percentOff = Number(form.percentOff);
      else payload.firstCycleAmountINR = Number(form.firstCycleAmountINR);

      // The code itself is the identity customers have already been given —
      // changing it on an existing record would silently break every link and
      // email that referenced it. Edit changes the terms, never the code.
      if (editing) delete payload.code;

      const result = editing
        ? await updatePromoCode(editing._id, payload)
        : await createPromoCode(payload);

      if (result.success) {
        toast.success(`${editing ? editing.code : payload.code} ${editing ? 'updated' : 'created'}`);
        onCreated();
      } else {
        toast.error(getToastError(result, "Couldn't save the code"));
      }
    } catch (err) {
      toast.error(getToastError(err, "Couldn't save the code"));
    } finally {
      setSaving(false);
    }
  }

  const field =
    'w-full rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] px-3 py-2 text-[13px]';
  const label = 'block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-1';

  return (
    <form
      onSubmit={submit}
      className="mb-5 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-sunken)] p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="promo-code">Code</label>
          <input
            id="promo-code"
            className={`${field} uppercase tracking-wider`}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="SAVE30"
            required
            readOnly={!!editing}
            disabled={!!editing}
            title={editing ? 'The code itself cannot be changed once it exists' : undefined}
          />
        </div>
        <div>
          <label className={label} htmlFor="promo-desc">Description</label>
          <input
            id="promo-desc"
            className={field}
            value={form.description}
            onChange={set('description')}
            placeholder="Spring campaign"
          />
        </div>

        <div>
          <label className={label} htmlFor="promo-type">Discount</label>
          <select id="promo-type" className={field} value={form.discountType} onChange={set('discountType')}>
            <option value="percent">Percentage off</option>
            <option value="fixed_price">Fixed price</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="promo-value">
            {isPercent ? 'Percent off' : 'Price (₹)'}
          </label>
          <input
            id="promo-value"
            type="number"
            min={isPercent ? 1 : 0}
            max={isPercent ? 100 : undefined}
            className={field}
            value={isPercent ? form.percentOff : form.firstCycleAmountINR}
            onChange={set(isPercent ? 'percentOff' : 'firstCycleAmountINR')}
            placeholder={isPercent ? '30' : '499'}
            required
          />
        </div>

        <div>
          <label className={label} htmlFor="promo-scope">Applies to</label>
          <select id="promo-scope" className={field} value={form.appliesTo} onChange={set('appliesTo')}>
            <option value="first_payment">First payment only</option>
            <option value="any_payment">Any payment (incl. renewals)</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="promo-expiry">Expires (optional)</label>
          <input id="promo-expiry" type="date" className={field} value={form.expiresAt} onChange={set('expiresAt')} />
        </div>

        <div>
          <label className={label} htmlFor="promo-peruser">Uses per customer</label>
          <input
            id="promo-peruser"
            type="number"
            min="1"
            className={field}
            value={form.perUserLimit}
            onChange={set('perUserLimit')}
          />
        </div>
        <div>
          <label className={label} htmlFor="promo-max">Total uses (blank = unlimited)</label>
          <input
            id="promo-max"
            type="number"
            min="0"
            className={field}
            value={form.maxRedemptions}
            onChange={set('maxRedemptions')}
            placeholder="Unlimited"
          />
        </div>
      </div>

      {form.appliesTo === 'any_payment' && !form.expiresAt && (
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--ui-text-warning,#9a5b08)]">
          This code works on renewals and never expires — anyone who learns it keeps the
          discount indefinitely. Consider setting an expiry.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create code'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function PromoRow({ promo, onToggle, onEdit, onDelete }) {
  const worth =
    promo.discountType === 'percent'
      ? `${promo.percentOff}% off`
      : money(promo.firstCycleAmountINR);
  const cap = promo.maxRedemptions === null ? '∞' : promo.maxRedemptions;
  const expired = promo.expiresAt && new Date(promo.expiresAt) <= new Date();
  const hasBeenUsed = (promo.redemptions || 0) > 0 || (promo.redeemedCount || 0) > 0;

  return (
    <tr className="border-b border-[var(--ui-border-hairline)] last:border-0">
      <td className="py-3 pr-3">
        <span className="font-mono text-[13px] font-semibold tracking-wider text-[var(--ui-text-primary)]">
          {promo.code}
        </span>
        {promo.autoApply && (
          <Badge size="sm" tone="accent" className="ml-2">Auto</Badge>
        )}
        {promo.description && (
          <div className="mt-0.5 text-[12px] text-[var(--ui-text-secondary)]">{promo.description}</div>
        )}
      </td>
      <td className="py-3 pr-3 text-[13px] text-[var(--ui-text-primary)]">{worth}</td>
      <td className="py-3 pr-3 text-[12px] text-[var(--ui-text-secondary)]">
        {promo.appliesTo === 'any_payment' ? 'Any payment' : 'First payment'}
      </td>
      <td className="py-3 pr-3 text-right text-[13px] tabular-nums text-[var(--ui-text-primary)]">
        {promo.redemptions} / {cap}
      </td>
      <td className="py-3 pr-3 text-right text-[13px] tabular-nums text-[var(--ui-text-secondary)]">
        {money(promo.totalDiscountGiven)}
      </td>
      <td className="py-3 pr-3">
        {expired ? (
          <Badge size="sm">Expired</Badge>
        ) : promo.active ? (
          <Badge size="sm" tone="success">Active</Badge>
        ) : (
          <Badge size="sm">Off</Badge>
        )}
      </td>
      <td className="py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {/* FIRSTMONTH applies itself to every eligible signup — turning it
              off is a pricing change, so it gets the same control as any
              other code. */}
          <Button size="sm" variant="ghost" onClick={() => onToggle(promo)}>
            {promo.active ? 'Disable' : 'Enable'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leadingIcon={<Pencil size={13} />}
            onClick={() => onEdit(promo)}
          >
            Edit
          </Button>
          {/* Delete is offered only for a code nobody has used. Once it has
              redemptions it's part of the financial record, so the server
              refuses and the honest control is Disable. */}
          {!hasBeenUsed && (
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={<Trash2 size={13} />}
              onClick={() => onDelete(promo)}
            >
              Delete
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------ exemptions */

function ExemptionForm({ onCancel, onGranted }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setUsersLoading(true);
      setUsersError('');
      try {
        // 100 is the server's max page size for this endpoint. A dropdown
        // beyond that would need real search-as-you-type, which this screen
        // doesn't need yet — comping accounts is a rare, deliberate action.
        const result = await getAllUsers(100, 0);
        if (cancelled) return;
        if (result.success) {
          setUsers(result.data.users || []);
        } else {
          setUsersError(result.message || 'Failed to load users');
        }
      } catch (err) {
        if (!cancelled) setUsersError(getApiErrorMessage(err, 'Failed to load users'));
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await grantBillingExemption({
        email: email.trim(),
        reason: reason.trim(),
        until: until || null,
      });
      if (result.success) {
        toast.success(`${email.trim()} comped`);
        onGranted();
      } else {
        toast.error(getToastError(result, "Couldn't comp that account"));
      }
    } catch (err) {
      toast.error(getToastError(err, "Couldn't comp that account"));
    } finally {
      setSaving(false);
    }
  }

  const field =
    'w-full rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] px-3 py-2 text-[13px]';
  const label = 'block text-[12px] font-medium text-[var(--ui-text-secondary)] mb-1';

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
            <p className="mt-1 text-[12px] text-[var(--ui-text-warning,#9a5b08)]">{usersError}</p>
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
      <p className="mt-3 text-[12px] text-[var(--ui-text-secondary)]">
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

  const [promos, setPromos] = useState([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [promosError, setPromosError] = useState('');
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null); // null => create mode

  const [exemptions, setExemptions] = useState([]);
  const [exLoading, setExLoading] = useState(true);
  const [exError, setExError] = useState('');
  const [showExForm, setShowExForm] = useState(false);

  useEffect(() => {
    fetchPromos();
    fetchExemptions();
  }, []);

  async function fetchPromos() {
    setPromosLoading(true);
    setPromosError('');
    try {
      const result = await getPromoCodes();
      if (result.success) {
        // The promo-codes controller nests its payload as { promoCodes: [...] }
        // while billing-exemptions returns the array directly. Accept either
        // rather than assuming — a shape mismatch here renders a silent empty
        // state, which reads as "no codes exist" instead of "we failed".
        const list = Array.isArray(result.data)
          ? result.data
          : result.data?.promoCodes || [];
        setPromos(list);
      } else {
        setPromosError(result.message || 'Failed to load promo codes');
      }
    } catch (err) {
      setPromosError(getApiErrorMessage(err, 'Failed to load promo codes'));
    } finally {
      setPromosLoading(false);
    }
  }

  async function fetchExemptions() {
    setExLoading(true);
    setExError('');
    try {
      const result = await getBillingExemptions();
      if (result.success) {
        const list = Array.isArray(result.data)
          ? result.data
          : result.data?.exemptions || [];
        setExemptions(list);
      } else {
        setExError(result.message || 'Failed to load comped accounts');
      }
    } catch (err) {
      setExError(getApiErrorMessage(err, 'Failed to load comped accounts'));
    } finally {
      setExLoading(false);
    }
  }

  async function togglePromo(promo) {
    try {
      const result = await updatePromoCode(promo._id, { active: !promo.active });
      if (result.success) {
        toast.success(`${promo.code} ${promo.active ? 'disabled' : 'enabled'}`);
        fetchPromos();
      } else {
        toast.error(getToastError(result, "Couldn't update the code"));
      }
    } catch (err) {
      toast.error(getToastError(err, "Couldn't update the code"));
    }
  }

  async function removePromo(promo) {
    try {
      const result = await deletePromoCode(promo._id);
      if (result.success) {
        toast.success(`${promo.code} deleted`);
        fetchPromos();
      } else {
        // The server refuses to delete a redeemed code (409) and explains why.
        toast.error(getToastError(result, "Couldn't delete the code"));
      }
    } catch (err) {
      toast.error(getToastError(err, "Couldn't delete the code"));
    }
  }

  function startEdit(promo) {
    setEditingPromo(promo);
    setShowPromoForm(true);
  }

  function closePromoForm() {
    setShowPromoForm(false);
    setEditingPromo(null);
  }

  async function revoke(row) {
    try {
      const result = await revokeBillingExemption(row.email);
      if (result.success) {
        toast.success(`Comp revoked — falls back to ${result.data.fallsBackTo}`);
        fetchExemptions();
      } else {
        toast.error(getToastError(result, "Couldn't revoke the comp"));
      }
    } catch (err) {
      toast.error(getToastError(err, "Couldn't revoke the comp"));
    }
  }

  const th = 'pb-2 pr-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--ui-text-secondary)]';

  return (
    <AdminLayout title="Billing" subtitle="Promo codes and comped accounts">
      <div className="flex flex-col gap-5 p-[var(--ui-pad-lg)]">

        <Section
          icon={Ticket}
          title="Promo codes"
          description="Discounts customers enter themselves on the subscribe page. FIRSTMONTH is the one exception — it applies automatically to first-time subscribers."
          action={
            !showPromoForm && (
              <Button
                size="sm"
                leadingIcon={<Plus size={14} />}
                onClick={() => {
                  setEditingPromo(null);
                  setShowPromoForm(true);
                }}
              >
                New code
              </Button>
            )
          }
        >
          {showPromoForm && (
            <PromoForm
              key={editingPromo?._id || 'new'}
              editing={editingPromo}
              onCancel={closePromoForm}
              onCreated={() => {
                closePromoForm();
                fetchPromos();
              }}
            />
          )}

          {promosLoading ? (
            <div className="flex justify-center py-6">
              <Loader size={18} className="animate-spin text-[var(--ui-text-secondary)]" />
            </div>
          ) : promosError ? (
            <Empty>{promosError}</Empty>
          ) : !promos.length ? (
            <Empty>No promo codes yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--ui-border-hairline)]">
                    <th className={th}>Code</th>
                    <th className={th}>Discount</th>
                    <th className={th}>Scope</th>
                    <th className={`${th} text-right`}>Used</th>
                    <th className={`${th} text-right`}>Discount given</th>
                    <th className={th}>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p) => (
                    <PromoRow
                      key={p._id}
                      promo={p}
                      onToggle={togglePromo}
                      onEdit={startEdit}
                      onDelete={removePromo}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

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
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
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
                          <div className="text-[12px] text-[var(--ui-text-secondary)]">{row.name}</div>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-[13px] text-[var(--ui-text-secondary)]">
                        {row.billingExemptReason || '—'}
                      </td>
                      <td className="py-3 pr-3 text-[13px] text-[var(--ui-text-secondary)]">
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
