import { useContext, useState } from 'react';
import { Button, EmptyState, SoonTag, StatTile, useConfirm, useToast } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { useAuth } from 'src/core/auth/hooks/useAuth';
import { SubscriptionContext } from 'src/core/billing/hooks/SubscriptionContext.jsx';
import { useSidebarSummary } from 'src/core/sidebarSummary/hooks/useSidebarSummary.js';
import subscriptionsController from 'src/core/billing/controller/subscriptions.js';
import { SUBSCRIPTION_EVENTS } from 'src/core/billing/constants/constants.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import { formatMoney } from 'src/shared/utils/money.js';
import { getToastError } from 'src/shared/utils/apiError';
import { settingsStrings as t } from '../strings.js';

const longDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : null;

/** One line under the plan name: what happens next with this subscription. */
function planLine(sub, tier) {
  if (sub?.exempt) return 'Complimentary account — nothing to pay.';
  if (sub?.cancelled) return `Cancelled — you have access until ${longDate(sub.accessUntil)}. You won't be charged again.`;
  if (sub?.trialing) return `Free trial — first charge on ${longDate(sub.trialEndsAt)}. Cancel before then and you pay nothing.`;
  if (sub?.firstPaymentPending) return 'Your trial has ended — your first payment is being processed. UPI AutoPay and card mandates can take a few hours to debit; you keep full access meanwhile.';
  if (sub?.nextChargeAt) return `Renews automatically on ${longDate(sub.nextChargeAt)}.`;
  return tier === 'free' ? t.billing.planFreeDescription : t.billing.planPaidDescription;
}

/**
 * Billing (the handoff's Settings → Billing): the CURRENT PLAN card with its
 * three readings, then invoices.
 *
 * Plan, renewal date, price, trial and cancel come from GET /subscriptions/me
 * (Razorpay autopay); credits from the account; invites-today from the pacing
 * summary. Upgrading, self-serve top-up and the invoice list have no endpoint
 * yet — shown, marked SOON.
 *
 * Cancel stops autopay; access continues to the end of the paid period (or
 * trial end) — the confirm dialog says exactly until when.
 */
export function BillingTab() {
  const { user } = useAuth();
  const subscription = useContext(SubscriptionContext);
  const sub = subscription?.status ?? null;
  const { pacing } = useSidebarSummary();
  const confirm = useConfirm();
  const toast = useToast();
  const [cancelling, setCancelling] = useState(false);
  const balance = user?.creditBalance ?? 0;
  const tier = user?.tier || 'free';
  const price = sub?.amount != null ? formatMoney(sub.amount, sub.currency) : null;

  function onCancel() {
    const until = sub?.trialing ? sub.trialEndsAt : sub?.paymentIssue ? null : sub?.nextChargeAt;
    confirm({
      title: 'Cancel your subscription?',
      description: until
        ? `Autopay stops now. You keep full access until ${longDate(until)}, then your account is locked until you subscribe again.`
        : 'Autopay stops now and, since your last renewal did not go through, access ends immediately.',
      confirmLabel: 'Cancel subscription',
      cancelLabel: 'Keep subscription',
    }).then((ok) => {
      if (!ok) return;
      setCancelling(true);
      const emitter = new EventEmitter();
      emitter.once(SUBSCRIPTION_EVENTS.CANCEL_SUCCESS, (summary) => {
        setCancelling(false);
        toast.success(summary?.accessUntil ? `Cancelled — access until ${longDate(summary.accessUntil)}` : 'Subscription cancelled');
        subscription?.refetch?.();
      });
      emitter.once(SUBSCRIPTION_EVENTS.CANCEL_FAILURE, (err) => {
        setCancelling(false);
        toast.error(getToastError(err, "Couldn't cancel your subscription"));
      });
      subscriptionsController.cancelSubscription(emitter);
    });
  }

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
                {planLine(sub, tier)}
              </p>
            </div>
            {sub?.canCancel?.() && (
              <Button variant="ghost" onClick={onCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Cancel subscription'}
              </Button>
            )}
            <Button variant="primary" disabled title="Plan changes are handled by support for now">
              Upgrade <SoonTag className="ml-1 !bg-[var(--ui-surface-card)]" />
            </Button>
          </div>
          {sub?.paymentIssue && (
            <p className="rounded-[var(--ui-radius-sm)] bg-[var(--ui-warning-tint)] px-3 py-2 text-[length:var(--ui-t-label)] text-[var(--ui-warning-fg)]">
              Your last renewal didn't go through. Razorpay will retry automatically over the next few days and
              you keep access meanwhile — make sure your card or UPI mandate has funds. If the retries fail,
              your account will be locked until you subscribe again.
            </p>
          )}
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
