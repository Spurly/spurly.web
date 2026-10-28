import { Badge } from 'src/core/primitives';

/**
 * Whose account a row is. A partner-managed user's email is a placeholder that
 * does not name the partner, so this badge is the only place an operator can see it.
 * The partner's own id for the account (what support gets asked about) is the tooltip.
 */
export function PartnerCell({ partner }) {
  if (!partner) return <span className="text-[var(--ui-text-quaternary)]">—</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone="accent" title={partner.externalId ? `Partner's id: ${partner.externalId}` : undefined}>
        Partner: {partner.slug}
      </Badge>
      {partner.closed && <Badge tone="warning" title="The partner closed this account">Closed</Badge>}
      {partner.partnerStatus === 'suspended' && <Badge tone="danger" title="This partner is suspended">Suspended</Badge>}
    </span>
  );
}
