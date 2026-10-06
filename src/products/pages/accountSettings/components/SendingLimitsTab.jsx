import { Dropdown, SwitchRow } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { useLimits } from 'src/core/limits/hooks/useLimits.js';
import { settingsStrings as t } from '../strings.js';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => [String(h), `${String(h).padStart(2, '0')}:00`]);

/** Connection requests and messages are the two actions shown: what went out, never what is "left". */
const ACTIVITY_ACTIONS = ['connect', 'message'];

function ActivityRow({ action }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-[var(--ui-border)] last:border-b-0">
      <span className="text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-primary)]">{action.label}</span>
      <span className="ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-text-body)]">
        {action.day.used} today · {action.week.used} this week
      </span>
    </div>
  );
}

/**
 * Sending hours: what went out, when Spurly slows down, and the safety rules.
 * Everything here is real — one snapshot from GET /api/limits. There are no
 * allowances to run out of: Spurly spaces sends at an uneven pace on its own,
 * and the only setting is when it should be quiet.
 */
export function SendingLimitsTab() {
  const { snapshot, loading, error, saving, saveError, savePreferences } = useLimits();

  if (loading && !snapshot) {
    return (
      <SectionCard title={t.limits.overviewTitle}>
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">Loading…</p>
      </SectionCard>
    );
  }
  if (!snapshot) {
    return (
      <SectionCard title={t.limits.overviewTitle}>
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{error || t.limits.loadError}</p>
      </SectionCard>
    );
  }

  const { quiet, actions } = snapshot;
  const activity = ACTIVITY_ACTIONS.map((key) => actions.find((a) => a.action === key)).filter(Boolean);

  return (
    <>
      <SectionCard title={t.limits.overviewTitle}>
        <div className="flex flex-col gap-3.5">
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.5]">{t.limits.overviewHint}</p>
          <div className="flex flex-col">
            {activity.map((a) => (
              <ActivityRow key={a.action} action={a} />
            ))}
          </div>
          {!snapshot.connected && (
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-warning-fg)] leading-[1.5]">{t.limits.notConnected}</p>
          )}
          {error && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{error}</p>}
        </div>
      </SectionCard>

      <SectionCard title={t.limits.quietTitle}>
        <div className="flex flex-col gap-3">
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.5]">{t.limits.quietHint}</p>
          <SwitchRow
            title={t.limits.quietSwitchTitle}
            hint={t.limits.quietSwitchHint}
            checked={quiet.enabled}
            disabled={saving}
            onChange={(on) => savePreferences({ quietEnabled: on })}
          />
          {quiet.enabled && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.limits.from}</span>
              <Dropdown
                variant="dashboard"
                size="sm"
                ariaLabel="Quiet hours start"
                value={String(quiet.startHour)}
                options={HOUR_OPTIONS}
                disabled={saving}
                onChange={(v) => savePreferences({ quietStartHour: Number(v) })}
              />
              <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.limits.to}</span>
              <Dropdown
                variant="dashboard"
                size="sm"
                ariaLabel="Quiet hours end"
                value={String(quiet.endHour)}
                options={HOUR_OPTIONS}
                disabled={saving}
                onChange={(v) => savePreferences({ quietEndHour: Number(v) })}
              />
              <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-quaternary)]">{snapshot.timezone.replace('_', ' ')}</span>
            </div>
          )}
          {quiet.activeNow && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-body)]">{t.limits.quietActiveNow}</p>}
          {saveError && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{saveError}</p>}
        </div>
      </SectionCard>

      <SectionCard title="Safety rules">
        <div className="flex flex-col gap-3">
          {t.limits.rules.map((r) => (
            <SwitchRow key={r.title} title={r.title} hint={r.hint} checked={r.on} disabled />
          ))}
        </div>
      </SectionCard>
    </>
  );
}

export default SendingLimitsTab;
