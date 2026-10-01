import { Award, UserCheck } from 'lucide-react';
import { Button } from 'src/core/primitives';
import { useLeadNetworkActions } from 'src/products/invitations/hooks/useLeadNetworkActions.js';

/**
 * Follow and endorse for a lead, in the drawer. Every click is a visible action
 * on LinkedIn that counts toward a daily limit; a limit comes back as a toast
 * with a plain sentence, not a silent failure. Endorsing only works on 1st-degree
 * connections, so skills load on demand and non-endorsable ones are shown dim.
 */
export function NetworkActions({ lead }) {
  const { follow, following, followed, skills, openEndorse, endorse, endorsing, endorsed } = useLeadNetworkActions(lead._id);
  const endorsable = skills.list.filter((s) => s.endorsable);

  return (
    <section className="px-5 pt-[22px]" aria-label="Network actions">
      <h3 className="ui-micro !text-[var(--ui-text-secondary)] mb-2.5">Network</h3>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" leadingIcon={<UserCheck size={13} />} onClick={follow} loading={following} disabled={following || followed}>
          {followed ? 'Following' : 'Follow'}
        </Button>
        <Button size="sm" variant="ghost" leadingIcon={<Award size={13} />} onClick={openEndorse} loading={skills.loading} disabled={skills.loading}>
          Endorse a skill
        </Button>
      </div>

      {skills.open && (
        <div className="mt-3">
          {skills.list.length === 0 && (
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">No skills listed on this profile.</p>
          )}
          {skills.list.length > 0 && endorsable.length === 0 && (
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
              Skills can only be endorsed for your 1st-degree connections.
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {endorsable.map((s) => (
              <Button
                key={s.name}
                size="sm"
                variant="ghost"
                onClick={() => endorse(s.name)}
                loading={endorsing === s.name}
                disabled={Boolean(endorsing) || endorsed.has(s.name)}
              >
                {endorsed.has(s.name) ? `${s.name} ✓` : s.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
