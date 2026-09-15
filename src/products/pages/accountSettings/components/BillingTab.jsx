import { CreditCard } from 'lucide-react';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Button } from 'src/core/primitives';
import { useAuth } from 'src/core/auth/hooks/useAuth';
import { settingsStrings as t } from '../strings.js';

export function BillingTab() {
  const { user } = useAuth();
  const balance = user?.creditBalance ?? 0;
  const tier = user?.tier || 'free';
  const low = balance < 25;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t.billing.creditsTitle}>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-[var(--ui-t-metric)] font-medium tabular-nums leading-none tracking-[-0.012em]"
                style={{ color: low ? 'var(--ui-warning)' : 'var(--ui-text-primary)' }}
              >
                {balance.toLocaleString()}
              </span>
              <span className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)]">{t.billing.creditsLabel}</span>
            </div>
            <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-2 max-w-[380px] leading-relaxed">
              {t.billing.creditsExplain}
            </p>
            {low && (
              <p className="text-[var(--ui-t-body)] font-medium mt-2" style={{ color: 'var(--ui-warning)' }}>
                {t.billing.lowBalance}
              </p>
            )}
          </div>

          <Button variant="primary" leadingIcon={<CreditCard size={17} />} disabled>
            {t.billing.topUp}
          </Button>
        </div>
        <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] mt-4">
          {t.billing.topUpComingSoon}
        </p>
      </SectionCard>

      <SectionCard title={t.billing.planTitle}>
        <div className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] capitalize">
          {tier} {t.billing.planSuffix}
        </div>
        <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-1">
          {tier === 'free' ? t.billing.planFreeDescription : t.billing.planPaidDescription}
        </p>
      </SectionCard>
    </div>
  );
}

export default BillingTab;
