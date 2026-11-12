import { useState } from 'react';
import { Button, Dropdown, Input, SwitchRow } from 'src/core/primitives';
import {
  RECENT_CONTACT_DAY_PICKS,
  RECENT_CONTACT_MIN_DAYS,
  RECENT_CONTACT_MAX_DAYS,
  RECENT_CONTACT_DEFAULT,
} from 'src/products/settings/constants/constants.js';
import { recentContactStrings as t } from './recentContactStrings.js';

const isValidDays = (n) => Number.isInteger(n) && n >= RECENT_CONTACT_MIN_DAYS && n <= RECENT_CONTACT_MAX_DAYS;

/**
 * The "Skip people I've already messaged" rule: a switch, a look-back window, and (organizations only) whose messages
 * count. Controlled: it shows `value` and reports each change through `onChange(nextRule)`; the page decides when and
 * how to save. It never saves on its own, and a bad custom number is held here until it is valid.
 *
 *   value      { enabled, days, scope }
 *   showScope  organizations only; a solo user has one account, so there is nothing to choose
 *   disabled   locked (a running campaign) or saving
 *   lockedNote shown under the switch while disabled for a reason the person can act on
 */
export function RecentContactRule({ value, onChange, showScope = false, disabled = false, lockedNote = '' }) {
  const rule = { ...RECENT_CONTACT_DEFAULT, ...(value || {}) };
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState(false);
  const isPick = RECENT_CONTACT_DAY_PICKS.includes(rule.days);

  const change = (patch) => onChange({ enabled: rule.enabled, days: rule.days, scope: rule.scope, ...patch });

  const commitCustom = () => {
    if (custom === '') { setCustomError(false); return; }
    const n = Number(custom);
    if (!isValidDays(n)) { setCustomError(true); return; }
    setCustomError(false);
    setCustom('');
    if (n !== rule.days) change({ days: n });
  };

  return (
    <div className="flex flex-col gap-3">
      <SwitchRow
        title={t.title}
        hint={rule.enabled ? t.hint(rule.days) : t.hintOff}
        checked={rule.enabled}
        onChange={(enabled) => change({ enabled })}
        disabled={disabled}
      />
      {disabled && lockedNote && (
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.45]">{lockedNote}</p>
      )}
      {rule.enabled && (
        <div className="flex flex-col gap-3 px-1">
          <div className="flex flex-col gap-1.5">
            <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.daysLabel}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {RECENT_CONTACT_DAY_PICKS.map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={rule.days === d ? 'primary' : 'secondary'}
                  disabled={disabled}
                  onClick={() => { setCustom(''); setCustomError(false); change({ days: d }); }}
                >
                  {d}
                </Button>
              ))}
              <Input
                size="sm"
                type="number"
                inputMode="numeric"
                min={RECENT_CONTACT_MIN_DAYS}
                max={RECENT_CONTACT_MAX_DAYS}
                aria-label={t.customLabel}
                placeholder={isPick ? t.customLabel : String(rule.days)}
                value={custom}
                invalid={customError}
                disabled={disabled}
                onChange={(e) => { setCustom(e.target.value); setCustomError(false); }}
                onBlur={commitCustom}
                onKeyDown={(e) => { if (e.key === 'Enter') commitCustom(); }}
                className="w-[130px]"
              />
              <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.daysUnit}</span>
            </div>
            {customError && (
              <p role="alert" className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">
                {t.customInvalid(RECENT_CONTACT_MIN_DAYS, RECENT_CONTACT_MAX_DAYS)}
              </p>
            )}
          </div>
          {showScope && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.scopeLabel}</span>
              <Dropdown
                variant="dashboard"
                size="sm"
                ariaLabel={t.scopeLabel}
                value={rule.scope}
                options={t.scopeOptions}
                disabled={disabled}
                onChange={(scope) => change({ scope })}
              />
              <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-[1.45]">{t.scopeHint[rule.scope]}</p>
            </div>
          )}
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-[1.45]">{t.footnote}</p>
        </div>
      )}
    </div>
  );
}
