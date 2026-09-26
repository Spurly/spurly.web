import { useState, useEffect, useMemo } from 'react';
import { X, Loader } from 'lucide-react';
import { formatMoney } from 'src/shared/utils/money.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import adminController from 'src/core/admin/controller/admin.js';
import { ADMIN_EVENTS } from 'src/core/admin/constants/constants.js';
import { Badge, useToast } from 'src/core/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';

/**
 * UserDetailsModal
 * Read-only view of a single user's full record from the users collection.
 * Fetches the complete document on open and renders every field, so new
 * schema fields show up automatically without touching this component.
 */

// Fields that are noise or never present (sensitive fields are already
// stripped server-side via `select: false`, so this is just cosmetic).
const HIDDEN_KEYS = new Set(['__v']);

// Friendly labels for known keys. Any key not listed falls back to a
// humanized version of the raw key, so nothing is ever dropped.
const LABELS = {
  _id: 'User ID',
  name: 'Name',
  email: 'Email',
  linkedinId: 'LinkedIn ID',
  linkedinProfile: 'LinkedIn Profile',
  googleId: 'Google ID',
  googleProfile: 'Google Profile',
  activeSessionId: 'Active Session ID',
  companyName: 'Company Name',
  companyStage: 'Company Stage',
  sector: 'Sector',
  location: 'Location',
  teamSize: 'Team Size',
  teamSizeRange: 'Team Size Range',
  founderDemographics: 'Founder Demographics',
  fundingRaised: 'Funding Raised',
  profileComplete: 'Profile Complete',
  onboardingComplete: 'Onboarding Complete',
  creditBalance: 'Credit Balance',
  planId: 'Plan',
  billingExempt: 'Comped (no payment required)',
  billingExemptReason: 'Comp reason',
  billingExemptUntil: 'Comped until',
  billingExemptAt: 'Comped at',
  billingExemptBy: 'Comped by',
  isAdmin: 'Admin',
  referralCode: 'Referral Code',
  referredBy: 'Referred By',
  role: 'Role',
  primaryGoal: 'Primary Goal',
  monthlyActivity: 'Monthly Activity',
  linkedinPlan: 'LinkedIn Plan',
  companyWebsite: 'Company Website',
  profileUrl: 'Profile URL',
  picture: 'Picture',
  headline: 'Headline',
  gender: 'Gender',
  isWoman: 'Woman Founder',
  isSCST: 'SC/ST',
  displayName: 'Display Name',
  createdAt: 'Joined',
  updatedAt: 'Last Updated',
};

const DATE_KEYS = new Set(['createdAt', 'updatedAt']);

function labelFor(key) {
  if (LABELS[key]) return LABELS[key];
  // Humanize: split camelCase / snake_case, capitalize.
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function formatScalar(key, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (DATE_KEYS.has(key) || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  }
  if (Array.isArray(value)) {
    return value.length ? value.map((v) => (isPlainObject(v) ? JSON.stringify(v) : String(v))).join(', ') : '—';
  }
  return String(value);
}

function FieldRow({ label, value }) {
  return (
    <div className="flex gap-4 py-2 border-b border-[var(--ui-border-hairline)] last:border-b-0">
      <div className="w-40 shrink-0 text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-tertiary)]">{label}</div>
      <div className="flex-1 text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)] break-words min-w-0">{value}</div>
    </div>
  );
}

function renderValue(key, value) {
  // Populated refs / nested sub-documents → render their inner fields.
  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(([k]) => !HIDDEN_KEYS.has(k));
    if (entries.length === 0) return <span className="text-[var(--ui-text-quaternary)]">—</span>;
    return (
      <div className="rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-page)] border border-[var(--ui-border-hairline)] px-3 py-1">
        {entries.map(([k, v]) => (
          <FieldRow key={k} label={labelFor(k)} value={renderValue(k, v)} />
        ))}
      </div>
    );
  }
  return <span>{formatScalar(key, value)}</span>;
}

const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

const SUB_LABEL = {
  created: 'Checkout opened, not authorized',
  authenticated: 'Trial / authorized, not yet charged',
  active: 'Active',
  pending: 'Renewal failing — Razorpay retrying',
  halted: 'Halted — locked',
  cancelled: 'Cancelled',
  completed: 'Completed',
  expired: 'Expired',
  paused: 'Paused',
};

/**
 * This account's subscription and charges, surfaced above the raw field dump
 * because "have they paid, and can they use the product right now?" is the
 * usual reason for opening a user record.
 *
 * Read-only, like every other payment view.
 */
function BillingHistory({ payments, subscriptions, loading }) {
  const latest = subscriptions[0] || null;
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-[length:var(--ui-t-label)] font-medium uppercase tracking-wider text-[var(--ui-text-secondary)]">
        Billing history
      </h3>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
          <Loader size={14} className="animate-spin" />
          Loading payments…
        </div>
      ) : (
        <>
          {latest && (
            <p className="mb-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
              Subscription: <span className="font-medium text-[var(--ui-text-primary)]">{SUB_LABEL[latest.status] || latest.status}</span>
              {' · '}
              {formatMoney(latest.amount, latest.currency)}/month
              {latest.cancelledAt ? ` · cancelled, access until ${shortDate(latest.accessUntil)}` : ''}
              {latest.status === 'authenticated' && latest.startAt ? ` · first charge ${shortDate(latest.startAt)}` : ''}
            </p>
          )}
          {!payments.length ? (
            <p className="rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)] px-3 py-2.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
              No charges yet. If this account has access, it's comped or still in its free trial.
            </p>
          ) : (
            <div className="divide-y divide-[var(--ui-border-hairline)] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)]">
              {payments.map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <span className="text-[length:var(--ui-t-body)] font-medium tabular-nums text-[var(--ui-text-primary)]">
                      {formatMoney(p.amount, p.currency)}
                    </span>
                    <div className="mt-0.5 truncate text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
                      {shortDate(p.paidAt || p.createdAt)}
                      {p.method ? ` · ${p.method}` : ''}
                      {p.failureReason ? ` · ${p.failureReason}` : ''}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {p.status === 'captured' ? (
                      <Badge size="sm" tone="success">Paid</Badge>
                    ) : (
                      <Badge size="sm" tone="danger">Failed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function UserDetailsModal({ user, onClose }) {
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  /* Kept inline as well: this modal has nothing else in it, so a dismissed
     toast would leave a blank dialog. */
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    eventEmitter.once(ADMIN_EVENTS.GET_USER_DETAILS_SUCCESS, (data) => {
      if (!active) return;
      if (data?.user) {
        setDetails(data.user);
      } else {
        setError('Failed to load user details');
        toast.error("Couldn't load this user");
      }
      setLoading(false);
    });
    eventEmitter.once(ADMIN_EVENTS.GET_USER_DETAILS_FAILURE, (err) => {
      if (!active) return;
      setError(getApiErrorMessage(err, 'Failed to load user details'));
      toast.error(getToastError(err, "Couldn't load this user"));
      setLoading(false);
    });

    adminController.getUserDetails(eventEmitter, user._id);

    return () => {
      active = false;
    };
  }, [user._id, eventEmitter, toast]);

  // Fetched separately from the user record: a payments hiccup shouldn't
  // blank out the whole modal, and vice versa.
  useEffect(() => {
    let active = true;
    setPaymentsLoading(true);

    const paymentsEmitter = new EventEmitter();
    paymentsEmitter.once(ADMIN_EVENTS.GET_USER_PAYMENTS_SUCCESS, (data) => {
      if (!active) return;
      setPayments(data?.payments || []);
      setSubscriptions(data?.subscriptions || []);
      setPaymentsLoading(false);
    });
    paymentsEmitter.once(ADMIN_EVENTS.GET_USER_PAYMENTS_FAILURE, (err) => {
      if (!active) return;
      // Non-fatal — the section renders its own empty state.
      console.error('[Admin] Could not load payments for user:', err?.message);
      setPaymentsLoading(false);
    });

    adminController.getUserPayments(paymentsEmitter, user._id);

    return () => {
      active = false;
    };
  }, [user._id]);

  const entries = details
    ? Object.entries(details).filter(([k]) => !HIDDEN_KEYS.has(k))
    : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '42rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-[var(--ui-pad-lg)] border-b border-[var(--ui-border-hairline)] shrink-0">
          <div>
            <h2 className="text-[length:var(--ui-t-section)] font-medium text-[var(--ui-text-primary)]">User Details</h2>
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-secondary)] transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-[var(--ui-pad-lg)] overflow-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-[var(--ui-text-tertiary)]">
              <Loader size={18} className="animate-spin" />
              Loading…
            </div>
          )}

          {!loading && error && (
            <div className="p-3 bg-[var(--ui-danger-tint)] border border-[var(--ui-danger-tint)] rounded-[var(--ui-radius-md)] text-[var(--ui-danger-fg)] text-[length:var(--ui-t-label)]">
              {error}
            </div>
          )}

          {!loading && !error && (
            <BillingHistory payments={payments} subscriptions={subscriptions} loading={paymentsLoading} />
          )}

          {!loading && !error && details && (
            <div className="space-y-1">
              {entries.map(([key, value]) => (
                <FieldRow key={key} label={labelFor(key)} value={renderValue(key, value)} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-[var(--ui-border-hairline)] shrink-0">
          <button type="button" onClick={onClose} className="btn btn-secondary py-2 px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
