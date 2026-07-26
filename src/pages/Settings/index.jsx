import { useState, useEffect } from 'react';
import { User as UserIcon, CreditCard, Puzzle, Check, RefreshCw, ExternalLink } from 'lucide-react';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { useAuth } from 'src/hooks/useAuth';
import { useExtension } from 'src/hooks/useExtension';
import { Tabs } from 'src/common/components/Tabs';
import { Input } from 'src/common/components/Input';
import { Button } from 'src/common/components/Button';
import { SectionCard } from 'src/common/components/SectionCard';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'billing', label: 'Billing & credits' },
  { id: 'extension', label: 'Extension' },
];

/**
 * Account settings.
 *
 * Deliberately narrow for now: the three things a user actually needs to see
 * about their own account. Sending limits, notifications and team management
 * are planned but are not stubbed out here — an empty tab reads as broken,
 * whereas a missing tab reads as "not built yet".
 */
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account, credits and extension.">
      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="p-7 max-w-[720px]">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'billing' && <BillingTab />}
        {activeTab === 'extension' && <ExtensionTab />}
      </div>
    </DashboardLayout>
  );
}

/* ------------------------------------------------------------------ */

function ProfileTab() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  // `user` arrives asynchronously (AuthContext refetches on mount), so seed the
  // fields once it lands rather than at first render.
  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setCompanyName(user.companyName || '');
  }, [user]);

  const dirty =
    !!user && (name !== (user.name || '') || companyName !== (user.companyName || ''));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!dirty || saving) return;

    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: name.trim(), companyName: companyName.trim() });
      setSavedAt(Date.now());
    } catch (err) {
      setError(err.message || 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Clear the "Saved" confirmation after a few seconds so it doesn't linger and
  // get mistaken for the state of a later, unsaved edit.
  useEffect(() => {
    if (!savedAt) return undefined;
    const id = setTimeout(() => setSavedAt(null), 3000);
    return () => clearTimeout(id);
  }, [savedAt]);

  return (
    <SectionCard title="Your details">
      <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-[420px]">
        <Input
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
          maxLength={120}
          leadingIcon={<UserIcon size={16} />}
        />

        <Input
          label="Company"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={saving}
          placeholder="Where you work"
          maxLength={120}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[var(--text-primary)] tracking-[-0.006em]">
            Email
          </label>
          <div
            className="h-11 px-4 flex items-center rounded-[12px] text-[14px] text-[var(--text-secondary)]"
            style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border-hairline)' }}
          >
            {user?.email || '—'}
          </div>
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Your email is used to sign in and can&apos;t be changed here. Contact support to update it.
          </p>
        </div>

        {error && (
          <p
            className="text-[13px] font-medium px-3 py-2.5 rounded-[10px]"
            style={{ background: 'var(--red-tint)', color: 'var(--red)' }}
          >
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          {savedAt && (
            <span
              className="flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: 'var(--green)' }}
            >
              <Check size={15} />
              Saved
            </span>
          )}
        </div>
      </form>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */

function BillingTab() {
  const { user } = useAuth();
  const balance = user?.creditBalance ?? 0;
  const tier = user?.tier || 'free';
  const low = balance < 25;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Credits">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-[40px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                style={{ color: low ? 'var(--amber)' : 'var(--text-primary)' }}
              >
                {balance.toLocaleString()}
              </span>
              <span className="text-[15px] text-[var(--text-secondary)]">credits left</span>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mt-2 max-w-[380px] leading-relaxed">
              One credit enriches one person with their email, phone and company details.
              Capturing profiles is free.
            </p>
            {low && (
              <p className="text-[13px] font-medium mt-2" style={{ color: 'var(--amber)' }}>
                You&apos;re running low — top up to keep enriching.
              </p>
            )}
          </div>

          <Button variant="primary" leadingIcon={<CreditCard size={17} />} disabled>
            Top up
          </Button>
        </div>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-4">
          Self-serve top-up is coming soon. In the meantime, contact us and we&apos;ll add credits
          to your account.
        </p>
      </SectionCard>

      <SectionCard title="Plan">
        <div className="text-[15px] font-semibold text-[var(--text-primary)] capitalize">
          {tier} plan
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">
          {tier === 'free'
            ? 'Everything you need to try Spurly, with a monthly credit allowance.'
            : 'Thanks for being a paying customer.'}
        </p>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ExtensionTab() {
  const { installed, loggedIn, version, checking, recheck } = useExtension();

  const status = checking
    ? { label: 'Checking…', color: 'var(--text-tertiary)', tint: 'var(--surface-sunken)' }
    : !installed
      ? { label: 'Not installed', color: 'var(--red)', tint: 'var(--red-tint)' }
      : !loggedIn
        ? { label: 'Installed — not signed in', color: 'var(--amber)', tint: 'var(--amber-tint)' }
        : { label: 'Connected', color: 'var(--green)', tint: 'var(--green-tint)' };

  return (
    <SectionCard title="Chrome extension">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-[12px] grid place-items-center shrink-0"
            style={{ background: status.tint, color: status.color }}
          >
            <Puzzle size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold" style={{ color: status.color }}>
              {status.label}
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              {version ? `Version ${version}` : 'Spurly captures profiles directly from LinkedIn.'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={recheck}
            disabled={checking}
            leadingIcon={<RefreshCw size={15} />}
          >
            Recheck
          </Button>
        </div>

        {!checking && !installed && (
          <div
            className="rounded-[12px] p-4"
            style={{ background: 'var(--red-tint)', border: '1px solid rgba(255,69,58,0.22)' }}
          >
            <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
              Spurly can&apos;t capture profiles or send outreach without the extension. Install it
              to get started.
            </p>
            <a
              href="https://chromewebstore.google.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-semibold"
              style={{ color: 'var(--text-accent)' }}
            >
              Install the extension
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {!checking && installed && !loggedIn && (
          <div
            className="rounded-[12px] p-4"
            style={{ background: 'var(--amber-tint)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
              The extension is installed but not signed in. Open it on LinkedIn and sign in with
              this account so captures and sends sync back here.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
