import { useEffect } from 'react';
import partnerController from 'src/core/partner/controller/partner.js';
import { ENDED_REASONS, PARTNER_COPY } from 'src/core/partner/constants/constants.js';
import { PartnerShell } from './PartnerShell.jsx';

/**
 * Where a managed session lands when it is over. There is no login form: the
 * way back is the app it was opened from, or, for someone who set up their own
 * sign-in (a direct login), the normal login page, which this links to.
 */
export default function PartnerEndedPage({ reason = ENDED_REASONS.SESSION }) {
  useEffect(() => {
    // Only a finished session forgets the marker; a closed account is still signed in.
    if (reason === ENDED_REASONS.SESSION) partnerController.acknowledgeEnded();
  }, [reason]);

  return (
    <PartnerShell>
      <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)]">
        {PARTNER_COPY.ended[reason] || PARTNER_COPY.ended[ENDED_REASONS.SESSION]}
      </p>
      {reason === ENDED_REASONS.SESSION && (
        <p className="mt-3 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
          {PARTNER_COPY.haveLogin}{' '}
          <a href="/login" className="font-medium text-[var(--ui-accent)] underline-offset-2 hover:underline">{PARTNER_COPY.logIn}</a>
        </p>
      )}
    </PartnerShell>
  );
}
