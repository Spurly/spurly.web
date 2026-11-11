import { useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import { Dialog, Button, Checkbox, Dropdown, FilterPills } from 'src/core/primitives';
import { validatePool } from 'src/products/campaigns/senderPool/reducer.js';
import { campaignsStrings } from '../../campaigns/strings.js';
import { sequencesStrings } from '../strings.js';

/**
 * The "who sends" question, asked when a sequence is started. One account runs it as before; several accounts each run it
 * from their own account under their own limits. Which of them contacts WHICH person is worked out while it runs, from how
 * each account is linked to that person (the first step decides: connect = accounts not yet connected; message = connected).
 * The parent mounts this only while open, so a fresh mount is a fresh state.
 */
export function StartSequenceDialog({ onClose, onConfirm, confirming, accounts = [], ownAccountId = null, poolAccountIds = [], firstStep = 'connect', resume = false }) {
  const t = campaignsStrings.start;
  const s = sequencesStrings.start;
  const startsPool = poolAccountIds.length >= 2;
  const [who, setWho] = useState(startsPool ? 'several' : 'one');
  const [picked, setPicked] = useState(startsPool ? poolAccountIds : []);
  const [oneId, setOneId] = useState(null);
  const oneChosen = oneId || (ownAccountId ? String(ownAccountId) : accounts[0] ? String(accounts[0].id) : null);
  const several = who === 'several';
  const validation = validatePool(picked);
  const ownName = accounts.find((a) => String(a.id) === String(ownAccountId))?.name;
  const toggle = (id) => setPicked((cur) => (cur.includes(String(id)) ? cur.filter((x) => x !== String(id)) : [...cur, String(id)]));
  const hint = firstStep === 'message' ? t.severalHintMessage : t.severalHintConnect;

  return (
    <Dialog
      open
      onClose={() => { if (!confirming) onClose(); }}
      title={resume ? s.resumeTitle : s.title}
      description={s.description}
      size="md"
      closeOnBackdrop={!confirming}
      closeOnEscape={!confirming}
      footer={(
        <>
          <Button variant="ghost" size="sm" disabled={confirming} onClick={onClose}>{s.cancel}</Button>
          <Button
            size="sm"
            leadingIcon={confirming ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            disabled={confirming || (several && !validation.ok)}
            title={several && !validation.ok ? validation.reason : undefined}
            onClick={() => onConfirm(several ? picked : startsPool ? [oneChosen] : null)}
          >
            {confirming ? s.starting : resume ? s.resume : s.start}
          </Button>
        </>
      )}
    >
      <div>
        <span className="block text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)] mb-1.5">{t.whoLabel}</span>
        <FilterPills
          size="sm"
          ariaLabel={t.whoLabel}
          value={who}
          onChange={setWho}
          options={[{ id: 'one', label: ownName && !startsPool ? t.whoOneNamed(ownName) : t.whoOne }, { id: 'several', label: t.whoSeveral }]}
        />
        {!several && startsPool ? (
          <div className="mt-2">
            <Dropdown
              variant="dashboard"
              size="sm"
              value={oneChosen}
              onChange={(v) => setOneId(String(v))}
              ariaLabel={t.whoLabel}
              options={accounts.map((a) => [String(a.id), a.name || a.publicIdentifier || 'LinkedIn account'])}
            />
          </div>
        ) : null}
        {several ? (
          <fieldset className="mt-2">
            <legend className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] mb-1.5">{hint}</legend>
            <div className="grid gap-1.5">
              {accounts.map((a) => (
                <Checkbox key={a.id} checked={picked.includes(String(a.id))} onChange={() => toggle(a.id)} label={a.name || a.publicIdentifier || 'LinkedIn account'} />
              ))}
            </div>
            {!validation.ok && picked.length > 0 && <p className="mt-1.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{validation.reason}</p>}
          </fieldset>
        ) : null}
      </div>
    </Dialog>
  );
}
