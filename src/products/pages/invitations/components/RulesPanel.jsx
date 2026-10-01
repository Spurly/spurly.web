import { useState } from 'react';
import { Button, Field, SwitchRow } from 'src/core/primitives';
import { parseKeywords, rulesError } from 'src/products/invitations/rulesDraft.js';
import { WITHDRAW_DAYS } from 'src/products/invitations/constants/constants.js';
import { relativeTime } from 'src/shared/utils/outreach.js';
import { invitationsStrings } from '../strings.js';

const t = invitationsStrings.rules;
const card = 'rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-4 flex flex-col gap-3';

/**
 * The two W3 automations, both off by default. The draft is local until Save, so
 * nothing runs on a half-edited form. Render with a `key` that changes when the
 * saved rules arrive, so the draft starts from them.
 */
export function RulesPanel({ rules, saving, onSave }) {
  const [draft, setDraft] = useState(() => ({
    withdrawEnabled: rules.autoWithdraw.enabled,
    afterDays: String(rules.autoWithdraw.afterDays),
    acceptEnabled: rules.autoAccept.enabled,
    acceptAll: rules.autoAccept.acceptAll,
    keywordsText: (rules.autoAccept.headlineKeywords || []).join(', '),
  }));
  const set = (patch) => setDraft((prev) => ({ ...prev, ...patch }));
  const error = rulesError(draft);

  const save = () => onSave({
    autoWithdraw: { enabled: draft.withdrawEnabled, afterDays: Number(draft.afterDays) },
    autoAccept: { enabled: draft.acceptEnabled, acceptAll: draft.acceptAll, headlineKeywords: parseKeywords(draft.keywordsText) },
  });

  const lastRun = rules.lastRun;
  return (
    <div className="flex flex-col gap-4 max-w-[640px]">
      <div>
        <h2 className="font-semibold">{t.title}</h2>
        <p className="text-[var(--ui-text-secondary)]">{t.intro}</p>
      </div>

      <div className={card}>
        <SwitchRow title={t.withdrawTitle} hint={t.withdrawHint} checked={draft.withdrawEnabled} onChange={(v) => set({ withdrawEnabled: v })} />
        <Field label={t.afterDays} type="number" value={draft.afterDays} onChange={(e) => set({ afterDays: e.target.value })} disabled={!draft.withdrawEnabled} min={WITHDRAW_DAYS.min} max={WITHDRAW_DAYS.max} />
      </div>

      <div className={card}>
        <SwitchRow title={t.acceptTitle} hint={t.acceptHint} checked={draft.acceptEnabled} onChange={(v) => set({ acceptEnabled: v })} />
        <SwitchRow title={t.acceptAll} hint={t.acceptAllHint} checked={draft.acceptAll} onChange={(v) => set({ acceptAll: v })} disabled={!draft.acceptEnabled} />
        <Field label={t.keywords} placeholder={t.keywordsPlaceholder} value={draft.keywordsText} onChange={(e) => set({ keywordsText: e.target.value })} disabled={!draft.acceptEnabled || draft.acceptAll} />
        <p className="text-[var(--ui-text-secondary)]">{t.keywordsHint}</p>
      </div>

      {error && <p role="alert" className="text-[var(--ui-danger-fg)]">{error}</p>}
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={save} loading={saving} disabled={saving || Boolean(error)}>{t.save}</Button>
        <span className="text-[var(--ui-text-secondary)]">{t.runsNote}</span>
      </div>

      {rules.lastRunAt && lastRun && (
        <p className="text-[var(--ui-text-secondary)]">
          {lastRun.error ? t.lastRunError : t.lastRun(relativeTime(rules.lastRunAt), lastRun.withdrawn ?? 0, lastRun.accepted ?? 0)}
          {lastRun.stoppedBy ? ` ${t.lastRunStopped(invitationsStrings.capReasons[lastRun.stoppedBy] || lastRun.stoppedBy)}` : ''}
        </p>
      )}
    </div>
  );
}
