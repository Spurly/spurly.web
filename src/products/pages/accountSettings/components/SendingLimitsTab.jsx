import { Dropdown, Meter, SwitchRow } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { useLimits } from 'src/core/limits/hooks/useLimits.js';
import { LIMIT_GROUPS } from 'src/core/limits/constants/constants.js';
import { settingsStrings as t } from '../strings.js';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => [String(h), `${String(h).padStart(2, '0')}:00`]);

/** "in 12 min" / "in 3 h" / "tomorrow" for the moment a full window frees up. */
function untilLabel(iso, now = Date.now()) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return 'now';
  const min = Math.ceil(ms / 60000);
  if (min < 60) return `in ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `in ${h} h`;
  return `in ${Math.round(h / 24)} d`;
}

function WindowMeter({ label, win }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{label}</span>
        <span className="ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-text-body)]">
          {win.used}/{win.limit}
        </span>
      </div>
      <Meter value={win.used} max={win.limit || 1} label={label} tone={win.remaining === 0 ? 'warning' : 'accent'} />
      {win.nextSlotAt && (
        <span className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)]">
          Next slot {untilLabel(win.nextSlotAt)}
        </span>
      )}
    </div>
  );
}

function ActionRow({ action }) {
  const status = action.status;
  const limiting = !status.ok;
  return (
    <div className="flex flex-col gap-2.5 py-3 border-b border-[var(--ui-border)] last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-primary)]">{action.label}</span>
        <span className="ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-text-body)]">
          {action.day.remaining} left today · {action.week.remaining} left this week
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <WindowMeter label="This hour" win={{ ...action.hour, nextSlotAt: null }} />
        <WindowMeter label="Last 24 hours" win={action.day} />
        <WindowMeter label="Last 7 days" win={action.week} />
      </div>
      {limiting && status.message && (
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.5]">
          <span className="font-medium text-[var(--ui-text-primary)]">{t.limits.reasons[status.reason] || 'Paused'}.</span> {status.message}
        </p>
      )}
      {action.backoff && (
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-warning-fg)]">{t.limits.backoff}</p>
      )}
    </div>
  );
}

/**
 * Sending limits: the tracker. Everything here is real — one snapshot from
 * GET /api/limits, built by the same engine that gates every send, so the
 * numbers on this screen are the numbers automation obeys.
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

  const { quiet, ceiling, actions } = snapshot;

  return (
    <>
      <SectionCard
        title={t.limits.overviewTitle}
        action={
          <span className="ui-num !font-normal text-[length:var(--ui-t-title)] text-[var(--ui-text-primary)]">
            {ceiling.used} / {ceiling.limit}
          </span>
        }
      >
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.limits.ceilingLabel}</span>
            <Meter value={ceiling.used} max={ceiling.limit} label={t.limits.ceilingLabel} />
          </div>
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.5]">{t.limits.overviewHint}</p>
          {!snapshot.connected && (
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-warning-fg)] leading-[1.5]">{t.limits.notConnected}</p>
          )}
          {error && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{error}</p>}
        </div>
      </SectionCard>

      {LIMIT_GROUPS.map((group) => {
        const rows = actions.filter((a) => a.group === group.key);
        if (rows.length === 0) return null;
        return (
          <SectionCard key={group.key} title={group.label}>
            <div className="flex flex-col">
              {rows.map((a) => (
                <ActionRow key={a.action} action={a} />
              ))}
            </div>
          </SectionCard>
        );
      })}

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
