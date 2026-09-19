import { EmptyState, SoonTag, StatTile } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { useAuth } from 'src/core/auth/hooks/useAuth.js';
import { Avatar } from 'src/core/primitives';
import { settingsStrings as t } from '../strings.js';

/**
 * Team (the handoff's Settings → Team). Spurly is single-seat today — there
 * is no team concept in the backend — so this shows the one real seat (you)
 * and the rest of the screen marked SOON.
 */
export function TeamTab() {
  const { user } = useAuth();
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Seats" value="1 / 1" fill={100} caption="Just you, for now" />
        <StatTile label="Pending invites" soon />
      </div>
      <SectionCard title={t.team.membersTitle} action={<SoonTag />} noPadding>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--ui-border-hairline)]">
          <Avatar src={user?.profilePicture || null} name={user?.name || user?.email} size={30} tone="accent" />
          <div className="min-w-0 flex-1">
            <p className="text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-primary)] truncate">{user?.name}</p>
            <p className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] truncate">{user?.email}</p>
          </div>
          <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] uppercase tracking-[var(--ui-track-meta)] text-[var(--ui-text-secondary)]">
            Owner
          </span>
        </div>
        <EmptyState compact title={t.team.soonTitle} hint={t.team.soonHint} />
      </SectionCard>
    </>
  );
}

export default TeamTab;
