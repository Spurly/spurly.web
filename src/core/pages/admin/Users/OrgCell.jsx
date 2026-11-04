import { Badge } from 'src/core/primitives';

/**
 * An organization member. Shown as the org, not as a partner: the v1 Partner
 * column stays for managed accounts only. The member's role is the tooltip.
 */
export function OrgCell({ org }) {
  if (!org) return <span className="text-[var(--ui-text-quaternary)]">—</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone="info" title={`${org.role === 'owner' ? 'Owner' : 'Member'} of ${org.name}`}>
        Org: {org.name}
      </Badge>
      {org.status === 'suspended' && <Badge tone="danger" title="This organization is suspended">Suspended</Badge>}
    </span>
  );
}
