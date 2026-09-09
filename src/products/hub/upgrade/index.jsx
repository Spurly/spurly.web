import { useNavigate } from 'react-router-dom';
import { Radar, Send, Inbox, Check } from 'lucide-react';
import { Button } from 'src/ui/primitives';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';

/**
 * What a subscriber without hub sees where the hub would be.
 *
 * The workspace stays in the switcher for exactly this page's sake. A lower
 * tier seeing the upper tier daily, in context, while they work is the whole
 * argument for one app rather than two - so the lock has to lead somewhere
 * that explains itself, not to a disabled control that teaches nothing.
 *
 * It says what the product does and how to get it. It does NOT quote a price:
 * there is one price in the billing code today and hub is not sold from this
 * page yet, so a number here would be a promise the checkout cannot keep.
 */

const CAPABILITIES = [
  {
    icon: Radar,
    title: 'Source from LinkedIn search',
    body: 'Paste a search URL and import the results as contacts, without opening a browser or clicking through pages.',
  },
  {
    icon: Send,
    title: 'Send on a schedule, from our servers',
    body: 'Connection requests go out paced through working hours, inside your weekly LinkedIn allowance, whether or not your laptop is on.',
  },
  {
    icon: Inbox,
    title: 'Read and reply in one place',
    body: 'Your LinkedIn conversations, synced and answerable here, next to the campaign that started them.',
  },
];

export default function HubUpgradePage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Outreach hub" subtitle="Not included in your current plan">
      <div className="max-w-[720px] mx-auto py-10 px-4">
        <h2 className="text-[17px] font-medium text-[var(--ui-text-primary)]">
          Send from our servers, not your browser
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--ui-text-secondary)]">
          The hub links your LinkedIn account to Spurly directly. Everything below runs
          without the extension, and without your machine being awake.
        </p>

        <ul className="mt-8 space-y-5">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span
                className="shrink-0 mt-0.5 w-7 h-7 rounded-[var(--ui-radius-sm)] flex items-center justify-center bg-[var(--ui-surface-rail-hover)] text-[var(--ui-text-secondary)]"
                aria-hidden="true"
              >
                <Icon size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[var(--ui-text-primary)]">{title}</span>
                <span className="block text-[13px] leading-relaxed text-[var(--ui-text-secondary)]">{body}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] p-4">
          <p className="text-[13px] text-[var(--ui-text-primary)] flex items-start gap-2">
            <Check size={14} className="shrink-0 mt-0.5 text-[var(--ui-accent-fg)]" aria-hidden="true" />
            <span>
              Everything you already have stays exactly as it is. The hub is added to your
              account - it does not replace capture, campaigns or your contacts.
            </span>
          </p>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {/* Mail, not a checkout: hub is not self-serve yet, and a button that
              opened a payment page which cannot sell it would be worse than a
              slower path that works. */}
          <Button
            onClick={() => {
              window.location.href =
                'mailto:support@getspurly.com?subject=Adding%20the%20outreach%20hub%20to%20my%20account';
            }}
          >
            Ask about adding it
          </Button>
          <Button variant="ghost" onClick={() => navigate('/dashboard/people')}>
            Back to Capture
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
