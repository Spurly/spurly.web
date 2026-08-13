import { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { getUserDetails } from 'src/core/gateway/adminApi';

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
  isAdmin: 'Admin',
  referralCode: 'Referral Code',
  referredBy: 'Referred By',
  role: 'Role',
  primaryGoal: 'Primary Goal',
  monthlyActivity: 'Monthly Activity',
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
    <div className="flex gap-4 py-2 border-b border-gray-100 last:border-b-0">
      <div className="w-40 shrink-0 text-[13px] font-medium text-gray-500">{label}</div>
      <div className="flex-1 text-[13px] text-gray-900 break-words min-w-0">{value}</div>
    </div>
  );
}

function renderValue(key, value) {
  // Populated refs / nested sub-documents → render their inner fields.
  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(([k]) => !HIDDEN_KEYS.has(k));
    if (entries.length === 0) return <span className="text-gray-400">—</span>;
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-1">
        {entries.map(([k, v]) => (
          <FieldRow key={k} label={labelFor(k)} value={renderValue(k, v)} />
        ))}
      </div>
    );
  }
  return <span>{formatScalar(key, value)}</span>;
}

export default function UserDetailsModal({ user, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
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
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message || 'An error occurred');
      } finally {
        if (active) setLoading(false);
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
              <Loader size={18} className="animate-spin" />
              Loading…
            </div>
          )}

          {!loading && error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
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
        <div className="flex justify-end p-4 border-t border-gray-200 shrink-0">
          <button type="button" onClick={onClose} className="btn btn-secondary py-2 px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
