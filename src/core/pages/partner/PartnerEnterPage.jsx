import { Button } from 'src/core/primitives';
import { usePartnerEnter, ENTER_PHASES } from 'src/core/partner/hooks/usePartnerEnter.js';
import { PARTNER_COPY } from 'src/core/partner/constants/constants.js';
import { PartnerShell } from './PartnerShell.jsx';

/** /partner/enter#t=<ticket> — where "Open in Spurly" lands. */
export default function PartnerEnterPage() {
  const { phase, email, onContinue, onStay } = usePartnerEnter();

  if (phase === ENTER_PHASES.CONFIRM) {
    return (
      <PartnerShell>
        <h1 className="text-[length:var(--ui-t-body)] font-semibold mb-2">{PARTNER_COPY.confirm.title}</h1>
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] mb-5">
          {PARTNER_COPY.confirm.body(email)}
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="primary" onClick={onContinue}>{PARTNER_COPY.confirm.continue}</Button>
          <Button variant="secondary" onClick={onStay}>{PARTNER_COPY.confirm.stay}</Button>
        </div>
      </PartnerShell>
    );
  }

  if (phase === ENTER_PHASES.EXPIRED) {
    return (
      <PartnerShell>
        <h1 className="text-[length:var(--ui-t-body)] font-semibold mb-2">{PARTNER_COPY.expired.title}</h1>
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
          {PARTNER_COPY.expired.body}
        </p>
      </PartnerShell>
    );
  }

  return (
    <PartnerShell>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--ui-accent)] mx-auto mb-4" />
      <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{PARTNER_COPY.opening}</p>
    </PartnerShell>
  );
}
