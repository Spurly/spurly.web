import { CheckCircle2 } from 'lucide-react';
import { LinkedInIcon } from 'src/core/icons';
import { ORG_COPY } from 'src/core/org/constants/constants.js';

/**
 * Success step of the connect dialog for an organization account. Says only
 * what is true today: the account is connected and counted. (The shared
 * success step also promises campaigns and inbox, which an org does not have yet.)
 */
export function OrgConnectSuccess({ account }) {
  const copy = ORG_COPY.connect;
  const name = account?.name || account?.publicIdentifier;
  return (
    <div role="status" className="flex flex-col items-center text-center gap-4 py-2">
      <span className="relative grid place-items-center w-16 h-16 rounded-full bg-[var(--ui-success-tint)]">
        <CheckCircle2 size={34} style={{ color: 'var(--ui-success)' }} />
        <span className="absolute -bottom-1 -right-1 grid place-items-center w-7 h-7 rounded-full bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)]">
          <LinkedInIcon size={18} />
        </span>
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-[length:var(--ui-t-title)] font-semibold text-[var(--ui-text-primary)]">{copy.successTitle}</p>
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
          {name ? <>{copy.successNamed} <span className="font-medium text-[var(--ui-text-primary)]">{name}</span></> : copy.successPlain}
        </p>
      </div>
    </div>
  );
}

export default OrgConnectSuccess;
