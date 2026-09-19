import { Meter, SoonTag, SwitchRow } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { useSidebarSummary } from 'src/core/sidebarSummary/hooks/useSidebarSummary.js';
import { settingsStrings as t } from '../strings.js';

const CAP_OPTIONS = [10, 25, 40, 60];
const WINDOWS = ['Working hours', 'Mornings only', 'Around the clock'];

/**
 * Sending limits (the handoff's Settings → Sending limits).
 *
 * The daily cap and today's usage are REAL — the same account-wide pacing
 * gate every campaign already enforces (GET /hub/summary). Choosing a
 * different cap, a sending window, or the three safety rules has no
 * endpoint yet, so those controls are shown in place, marked SOON.
 */
export function SendingLimitsTab() {
  const { pacing } = useSidebarSummary();
  const cap = pacing?.dailyCap;
  const used = pacing?.dayUsed ?? 0;

  return (
    <>
      <SectionCard
        title={t.limits.capTitle}
        action={
          <span className="ui-num !font-normal text-[length:var(--ui-t-title)] text-[var(--ui-text-primary)]">
            {cap ? `${cap} / day` : '—'}
          </span>
        }
      >
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <Meter value={used} max={cap || 1} label="Sent today" className="flex-1" />
            <span className="ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-text-body)]">
              {used}/{cap ?? '—'} today
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {CAP_OPTIONS.map((n) => (
              <span
                key={n}
                className={`inline-flex items-center h-[30px] px-3 rounded-[var(--ui-radius-pill)] border font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-label)] ${
                  n === cap
                    ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]'
                    : 'border-[var(--ui-border)] text-[var(--ui-text-disabled)]'
                }`}
              >
                {n} / day
              </span>
            ))}
            <SoonTag />
          </div>
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.5]">{t.limits.capHint}</p>
        </div>
      </SectionCard>

      <SectionCard title={t.limits.windowTitle} action={<SoonTag />}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {WINDOWS.map((w, i) => (
              <span
                key={w}
                className={`inline-flex items-center h-[30px] px-3 rounded-[var(--ui-radius-pill)] border text-[length:var(--ui-t-control)] ${
                  i === 0
                    ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]'
                    : 'border-[var(--ui-border)] text-[var(--ui-text-disabled)]'
                }`}
              >
                {w}
              </span>
            ))}
          </div>
          {t.limits.rules.map((r) => (
            <SwitchRow key={r.title} title={r.title} hint={r.hint} checked={r.on} disabled />
          ))}
        </div>
      </SectionCard>
    </>
  );
}

export default SendingLimitsTab;
