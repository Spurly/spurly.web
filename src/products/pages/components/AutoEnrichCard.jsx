import { useState } from 'react';
import { Button, Input, Skeleton, SwitchRow } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { useAutoEnrich } from 'src/products/settings/hooks/useAutoEnrich.js';
import { AUTO_ENRICH_AMOUNT_PICKS } from 'src/products/settings/constants/constants.js';
import { autoEnrichStrings as t } from './autoEnrichStrings.js';

/**
 * Settings card for automatic profile enrichment. Everything shown is what the server answered: the allowed range,
 * the amount, and today's progress. `org` only changes the wording (the setting itself is the workspace's).
 */
export function AutoEnrichCard({ org = false }) {
  const { setting, loading, saving, change } = useAutoEnrich();
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState(false);

  if (loading) {
    return (
      <SectionCard title={t.title}>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </SectionCard>
    );
  }
  if (!setting) {
    return (
      <SectionCard title={t.title}>
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.loadError}</p>
      </SectionCard>
    );
  }

  const { min = 10, max = 100 } = setting.limits || {};
  const picks = AUTO_ENRICH_AMOUNT_PICKS.filter((n) => n >= min && n <= max);
  const progress = setting.progress;

  const commitCustom = () => {
    if (custom === '') { setCustomError(false); return; }
    const n = Number(custom);
    if (!Number.isInteger(n) || n < min || n > max) { setCustomError(true); return; }
    setCustomError(false);
    setCustom('');
    if (n !== setting.dailyTarget) change({ dailyTarget: n });
  };

  return (
    <SectionCard title={t.title}>
      <div className="flex flex-col gap-3">
        <SwitchRow
          title={t.switchTitle}
          hint={org ? t.hintOrg : t.hint}
          checked={setting.enabled}
          onChange={(enabled) => change({ enabled })}
          disabled={saving}
        />
        {setting.enabled && (
          <div className="flex flex-col gap-3 px-1">
            <div className="flex flex-col gap-1.5">
              <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.amountLabel}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {picks.map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant={setting.dailyTarget === n ? 'primary' : 'secondary'}
                    disabled={saving}
                    onClick={() => { setCustom(''); setCustomError(false); change({ dailyTarget: n }); }}
                  >
                    {n}
                  </Button>
                ))}
                <Input
                  size="sm"
                  type="number"
                  inputMode="numeric"
                  min={min}
                  max={max}
                  aria-label={t.customLabel}
                  placeholder={picks.includes(setting.dailyTarget) ? t.customLabel : String(setting.dailyTarget)}
                  value={custom}
                  invalid={customError}
                  disabled={saving}
                  onChange={(e) => { setCustom(e.target.value); setCustomError(false); }}
                  onBlur={commitCustom}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitCustom(); }}
                  className="w-[130px]"
                />
              </div>
              <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">{t.amountHelp(min, max)}</p>
              {customError && (
                <p role="alert" className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{t.customInvalid(min, max)}</p>
              )}
            </div>
            <SwitchRow
              title={t.includeFailedTitle}
              hint={t.includeFailedHint}
              checked={setting.includeFailed === true}
              onChange={(includeFailed) => change({ includeFailed })}
              disabled={saving}
            />
            {progress && (
              <p className="ui-num !font-normal text-[length:var(--ui-t-label)] text-[var(--ui-text-body)]">
                {t.progress(progress.usedToday ?? 0, progress.waiting ?? 0, progress.needing ?? 0)}
              </p>
            )}
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-[1.45]">{t.startsNote} {t.footnote}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
