import { RefreshCw } from 'lucide-react';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Avatar, Badge, Button, Skeleton, Tag } from 'src/core/primitives';
import { relativeTime } from 'src/shared/utils/outreach.js';
import { linkedInSettingsStrings } from '../strings.js';

const t = linkedInSettingsStrings.accountHealth;

/**
 * true / false / null -> a Badge. null is "LinkedIn did not say" and must not
 * read as "no": the server stores null for a value a failed call could not
 * answer, and for a balance LinkedIn simply does not report.
 */
function FlagBadge({ value }) {
  if (value === true) return <Badge tone="success" dot>{t.states.yes}</Badge>;
  if (value === false) return <Badge tone="neutral">{t.states.no}</Badge>;
  return <Badge tone="neutral" variant="minimal">{t.states.unknown}</Badge>;
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-t border-[var(--ui-neutral-150)] first:border-t-0">
      <span className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] shrink-0">{label}</span>
      <div className="min-w-0 flex flex-wrap justify-end items-center gap-1.5">{children}</div>
    </div>
  );
}

/** Only pools LinkedIn gave a number for; null is omitted, never shown as 0. */
function InmailCredits({ credits }) {
  const known = Object.entries(credits ?? {}).filter(([, value]) => Number.isFinite(value));
  if (known.length === 0) {
    return <span className="text-[length:var(--ui-t-body)] text-[var(--ui-text-tertiary)]">{t.inmailNotReported}</span>;
  }
  return known.map(([pool, value]) => (
    <Tag key={pool}>{`${t.pools[pool] ?? pool}: ${value}`}</Tag>
  ));
}

function checkedLabel(checkedAt) {
  const when = relativeTime(checkedAt);
  if (!when) return '';
  return when === 'just now' ? t.checkedJust : t.checkedAgo(when);
}

/**
 * Who is connected and what their LinkedIn plan can do: the read-only half of
 * plan F4. Reads the server's stored copy, so it renders instantly; the first
 * look at a never-checked account arrives a few seconds later (`checking`).
 *
 * States: loading, checking (server is reading LinkedIn), gave-up, failed
 * (nothing stored and the last try errored), and the populated card. Every
 * flag is true / false / null and null renders as "Unknown".
 */
export function AccountHealthCard({ health, loading, refreshing, gaveUp, onRefresh }) {
  const caps = health?.capabilities ?? null;
  const profile = health?.profile ?? null;
  const action = (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      disabled={refreshing || loading}
      leadingIcon={<RefreshCw size={15} />}
    >
      {refreshing ? t.refreshing : t.refresh}
    </Button>
  );

  if (loading) {
    return (
      <SectionCard title={t.title}>
        <div className="flex flex-col gap-3" data-testid="account-health-loading">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </SectionCard>
    );
  }

  // Nothing to show and nothing on the way: no health at all, or an account
  // that is not connected. The connection card above already says why.
  if (!health || health.connected === false) return null;

  return (
    <SectionCard title={t.title} action={action}>
      <div className="flex flex-col gap-4">
        {profile && (
          <div className="flex items-center gap-3">
            <Avatar src={profile.pictureUrl || null} name={profile.name} size={40} />
            <div className="min-w-0 flex-1">
              <div className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] truncate">
                {profile.name}
              </div>
              {profile.headline && (
                <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] truncate">{profile.headline}</p>
              )}
            </div>
          </div>
        )}

        {caps ? (
          <div>
            <Row label={t.premium}><FlagBadge value={caps.premium} /></Row>
            <Row label={t.salesNavigator}><FlagBadge value={caps.salesNavigator} /></Row>
            <Row label={t.recruiter}><FlagBadge value={caps.recruiter} /></Row>
            <Row label={t.companyPages}>
              {caps.companyPages?.length
                ? caps.companyPages.map((page) => <Tag key={page.id}>{page.name}</Tag>)
                : <span className="text-[length:var(--ui-t-body)] text-[var(--ui-text-tertiary)]">{t.noCompanyPages}</span>}
            </Row>
            <Row label={t.inmail}><InmailCredits credits={caps.inmailCredits} /></Row>
          </div>
        ) : (
          <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]" role="status">
            {health.capabilitiesError
              ? t.failed
              : gaveUp
                ? t.gaveUp
                : t.checking}
          </p>
        )}

        {caps && (
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
            {checkedLabel(caps.checkedAt)}
            {health.capabilitiesError ? ` · ${t.partialError}` : ''}
          </p>
        )}
      </div>
    </SectionCard>
  );
}

export default AccountHealthCard;
