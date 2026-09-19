import { useContext } from 'react';
import { Button, EmptyState, SoonTag, StatTile } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { useAuth } from 'src/core/auth/hooks/useAuth';
import { SubscriptionContext } from 'src/core/billing/hooks/SubscriptionContext.jsx';
import { useSidebarSummary } from 'src/core/sidebarSummary/hooks/useSidebarSummary.js';
import { settingsStrings as t } from '../strings.js';

function money(amount, currency) {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency || ''} ${amount}`;
  }
}

/**
 * Billing (the handoff's Settings → Billing): the CURRENT PLAN card with its
 * three readings, then invoices.
 *
 * Plan, renewal date and price come from GET /subscriptions/me; credits from
 * the account; invites-today from the pacing summary. Upgrading, self-serve
 * top-up and the invoice list have no endpoint yet — shown, marked SOON.
 */
export function BillingTab() {
  const { user } = useAuth();
  const sub = useContext(SubscriptionContext)?.status ?? null;
  const { pacing } = useSidebarSummary();
  const balance = user?.creditBalance ?? 0;
  const tier = user?.tier || 'free';
  const price = money(sub?.baseAmount, sub?.currency);
  const renews = sub?.currentCycleEnd ? new Date(sub.currentCycleEnd).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <>
      <SectionCard title={t.billing.planTitle} tone="accent" spine>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[length:var(--ui-t-heading)] font-semibold tracking-[var(--ui-track-tight)] text-[var(--ui-text-primary)] capitalize">
                {tier}
                {price ? ` · ${price} / month` : ''}
              </p>
              <p className="mt-1 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">
                {sub?.exempt
                  ? 'Complimentary account — nothing to pay.'
                  : renews
                    ? `Renews ${renews}.`
                    : tier === 'free'
                      ? t.billing.planFreeDescription
                      : t.billing.planPaidDescription}
              </p>
            </div>
            <Button variant="primary" disabled title="Plan changes are handled by support for now">
              Upgrade <SoonTag className="ml-1 !bg-[var(--ui-surface-card)]" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <StatTile size="sm" label={t.billing.creditsTitle} value={balance.toLocaleString()} caption={t.billing.creditsCaption} tone={balance < 25 ? 'warning' : 'accent'} />
            <StatTile size="sm" label="Seats" value="1 / 1" fill={100} caption="Single seat" />
            <StatTile
              size="sm"
              label="Invites today"
              value={pacing?.dailyCap ? `${pacing.dayUsed ?? 0} / ${pacing.dailyCap}` : '—'}
              fill={pacing?.dailyCap ? ((pacing.dayUsed ?? 0) / pacing.dailyCap) * 100 : null}
              tone="warning"
              caption="Cap resets at midnight"
            />
          </div>
          {balance < 25 && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-warning-fg)]">{t.billing.lowBalance}</p>}
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-quaternary)]">{t.billing.topUpComingSoon}</p>
        </div>
      </SectionCard>

      <SectionCard title={t.billing.invoicesTitle} action={<SoonTag />} noPadding>
        <EmptyState compact title={t.billing.invoicesSoonTitle} hint={t.billing.invoicesSoonHint} />
      </SectionCard>
    </>
  );
}

export default BillingTab;
