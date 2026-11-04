import { Badge } from 'src/core/primitives';

const roleOf = (org) => `${org.role === 'owner' ? 'Owner' : 'Member'} of ${org.name}`;

/**
 * An organization member. Shown as the org, not as a partner: the v1 Partner
 * column stays for managed accounts only. The member's role is the tooltip.
 * A user in several orgs shows the first, plus "+N" that lists the rest.
 */
export function OrgCell({ org, orgs }) {
  const all = orgs?.length ? orgs : org ? [org] : [];
  if (!all.length) return <span className="text-[var(--ui-text-quaternary)]">—</span>;
  const [first, ...rest] = all;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone="info" title={roleOf(first)}>
        Org: {first.name}
      </Badge>
      {first.status === 'suspended' && <Badge tone="danger" title="This organization is suspended">Suspended</Badge>}
      {rest.length > 0 && (
        <Badge tone="neutral" title={all.map((o) => `${o.name}${o.status === 'suspended' ? ' (suspended)' : ''}`).join(', ')}>
          +{rest.length}
        </Badge>
      )}
    </span>
  );
}
