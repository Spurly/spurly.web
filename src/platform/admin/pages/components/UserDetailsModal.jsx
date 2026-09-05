import { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { getUserDetails, getUserPayments } from 'src/platform/admin/api';
import { Badge, useToast } from 'src/ui/primitives';
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
      <div className="w-40 shrink-0 text-[13px] font-medium text-[var(--ui-text-tertiary)]">{label}</div>
      <div className="flex-1 text-[13px] text-[var(--ui-text-primary)] break-words min-w-0">{value}</div>
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

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

/**
 * This account's payment history, surfaced above the raw field dump because
 * it's the usual reason for opening a user record — "have they paid, and can
 * they use the product right now?" is faster to answer here than by scanning
 * fields.
 *
 * Read-only, like every other payment view: money that moved is a record of
 * fact, not something an admin screen should be able to rewrite.
 */
function BillingHistory({ payments, loading }) {
  // Frozen for the life of the modal rather than read during every render:
  // `Date.now()` in the render body is impure, and a subscription flipping
  // from live to expired mid-modal is not worth an inconsistent render.
  const [now] = useState(() => Date.now());

  return (
    <div className="mb-5">
      <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wider text-[var(--ui-text-secondary)]">
        Billing history
      </h3>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-[12px] text-[var(--ui-text-tertiary)]">
          <Loader size={14} className="animate-spin" />
          Loading payments…
        </div>
      ) : !payments.length ? (
        <p className="rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)] px-3 py-2.5 text-[12px] text-[var(--ui-text-secondary)]">
          No payments. If this account has access, it's either comped or has never subscribed.
        </p>
      ) : (
        <div className="divide-y divide-[var(--ui-border-hairline)] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)]">
          {payments.map((p) => {
            const live = p.status === 'paid' && p.periodEnd && new Date(p.periodEnd).getTime() > now;
            return (
              <div key={p._id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium tabular-nums text-[var(--ui-text-primary)]">
                      {rupees(p.amount)}
                    </span>
                    {p.appliedPromoCode && (
                      <code className="rounded-[var(--ui-radius-xs)] bg-[var(--ui-surface-sunken)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ui-text-secondary)]">
                        {p.appliedPromoCode}
                      </code>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-[var(--ui-text-secondary)]">
                    {shortDate(p.createdAt)}
                    {p.status === 'paid' && p.periodEnd ? ` · access until ${shortDate(p.periodEnd)}` : ''}
                    {p.failureReason ? ` · ${p.failureReason}` : ''}
                  </div>
                </div>
                <div className="shrink-0">
                  {p.status === 'paid' ? (
                    live ? <Badge size="sm" tone="success">Active</Badge> : <Badge size="sm">Expired</Badge>
                  ) : p.status === 'failed' ? (
                    <Badge size="sm" tone="danger">Failed</Badge>
                  ) : (
                    <Badge size="sm" tone="info">Pending</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function UserDetailsModal({ user, onClose }) {
  const toast = useToast();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  /* Kept inline as well: this modal has nothing else in it, so a dismissed
     toast would leave a blank dialog. */
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getUserDetails(user._id);
        if (!active) return;
        if (result.success && result.data?.user) {
          setDetails(result.data.user);
        } else {
          setError(result.message || 'Failed to load user details');
          toast.error(getToastError(result, "Couldn't load this user"));
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, 'Failed to load user details'));
          toast.error(getToastError(err, "Couldn't load this user"));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user._id, toast]);

  // Fetched separately from the user record: a payments hiccup shouldn't
  // blank out the whole modal, and vice versa.
  useEffect(() => {
    let active = true;
    (async () => {
      setPaymentsLoading(true);
      try {
        const result = await getUserPayments(user._id);
        if (active && result.success) setPayments(result.data?.payments || []);
      } catch (err) {
        // Non-fatal — the section renders its own empty state.
        console.error('[Admin] Could not load payments for user:', err?.message);
      } finally {
        if (active) setPaymentsLoading(false);
      }
    })();
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
            <h2 className="text-[17px] font-medium text-[var(--ui-text-primary)]">User Details</h2>
            <p className="text-[12px] text-[var(--ui-text-tertiary)] mt-0.5">{user.email}</p>
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
            <div className="p-3 bg-[var(--ui-danger-tint)] border border-[var(--ui-danger-tint)] rounded-[var(--ui-radius-md)] text-[var(--ui-danger-fg)] text-[12px]">
              {error}
            </div>
          )}

          {!loading && !error && (
            <BillingHistory payments={payments} loading={paymentsLoading} />
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
