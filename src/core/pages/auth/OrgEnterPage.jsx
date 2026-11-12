import { Button } from 'src/core/primitives';
import { useOrgEnter, ORG_ENTER_PHASES } from 'src/core/org/hooks/useOrgEnter.js';
import { ORG_COPY } from 'src/core/org/constants/constants.js';
import { PartnerShell } from 'src/core/pages/partner/PartnerShell.jsx';

const MESSAGES = {
  [ORG_ENTER_PHASES.EXPIRED]: { title: ORG_COPY.enter.expiredTitle, body: ORG_COPY.enter.expiredBody },
  [ORG_ENTER_PHASES.BUSY]: { title: ORG_COPY.enter.busyTitle, body: ORG_COPY.enter.busyBody },
  [ORG_ENTER_PHASES.OFFLINE]: { title: ORG_COPY.enter.offlineTitle, body: ORG_COPY.enter.offlineBody },
};

/**
 * /login/org/enter#t=<ticket>: where a partner's "Open in Spurly" button lands for an organization.
 * Bare frame, Spurly branding only: no partner or provider name, no login form, never indexed or cached.
 */
export default function OrgEnterPage() {
  const { phase, email, onContinue, onStay } = useOrgEnter();
  const copy = ORG_COPY.enter;

  if (phase === ORG_ENTER_PHASES.CONFIRM) {
    return (
      <PartnerShell>
        <h1 className="text-[length:var(--ui-t-body)] font-semibold mb-2">{copy.confirmTitle}</h1>
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] mb-5">{copy.confirmBody(email)}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="primary" onClick={onContinue}>{copy.continue}</Button>
          <Button variant="secondary" onClick={onStay}>{copy.stay}</Button>
        </div>
      </PartnerShell>
    );
  }

  const message = MESSAGES[phase];
  if (message) {
    return (
      <PartnerShell>
        <h1 className="text-[length:var(--ui-t-body)] font-semibold mb-2">{message.title}</h1>
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{message.body}</p>
      </PartnerShell>
    );
  }

  return (
    <PartnerShell>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--ui-accent)] mx-auto mb-4" />
      <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{copy.opening}</p>
    </PartnerShell>
  );
}
