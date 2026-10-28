import { useEffect } from 'react';
import partnerController from 'src/core/partner/controller/partner.js';
import { ENDED_REASONS, PARTNER_COPY } from 'src/core/partner/constants/constants.js';
import { PartnerShell } from './PartnerShell.jsx';

/**
 * Where a managed session lands when it is over. There is no login form: a
 * managed account has no password, the way back is the app it was opened from.
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
    </PartnerShell>
  );
}
