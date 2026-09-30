import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { Avatar, Badge, Button, Skeleton, StatTile } from 'src/core/primitives';
import { useCompany } from 'src/products/company/hooks/useCompany.js';
import { absoluteTime } from 'src/shared/utils/outreach.js';
import { companyStrings } from './strings.js';

const t = companyStrings;

const number = (n) => (n == null ? '—' : n.toLocaleString());

/** "51-200", "10,001+" or the exact count. */
function employeesLabel(company) {
  const range = company?.employeeCountRange;
  if (range && range.from != null) {
    return range.to == null ? `${range.from.toLocaleString()}+` : `${range.from.toLocaleString()}-${range.to.toLocaleString()}`;
  }
  return company?.employeeCount != null ? company.employeeCount.toLocaleString() : '—';
}

function placeLine(loc) {
  return [loc.city, loc.area, loc.country].filter(Boolean).join(', ');
}

function Message({ title, body, action }) {
  return (
    <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-8 flex flex-col items-center gap-2 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-[var(--ui-text-secondary)]">{body}</p>
      {action}
    </div>
  );
}

/**
 * One LinkedIn company: who they are, how big, where, and what they say about
 * themselves. Reached from the health card's company pages; the same page is
 * what company search (M5) will open. Fields LinkedIn leaves out are not shown,
 * never drawn as empty.
 */
export function HubCompanyPage() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { loading, data, failure, refreshing, refresh } = useCompany(identifier);
  const company = data?.company;

  const layoutProps = { layout: 'page', backTo: '/dashboard/settings/linkedin', backLabel: t.back };

  if (loading) {
    return (
      <DashboardLayout title={t.loadingTitle} {...layoutProps}>
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      </DashboardLayout>
    );
  }

  if (failure) {
    const view = {
      notFound: { title: t.notFoundTitle, body: t.notFoundBody },
      noAccount: {
        title: t.noAccountTitle,
        body: t.noAccountBody,
        action: <Button variant="primary" onClick={() => navigate('/dashboard/settings/linkedin')}>{t.noAccountCta}</Button>,
      },
      throttled: { title: t.errorTitle, body: t.errorBody },
      other: {
        title: t.errorTitle,
        body: t.errorBody,
        action: <Button variant="primary" onClick={() => window.location.reload()}>{t.retry}</Button>,
      },
    }[failure];
    return (
      <DashboardLayout title={t.loadingTitle} {...layoutProps}>
        <Message {...view} />
      </DashboardLayout>
    );
  }

  const hq = company.locations?.find((l) => l.isHeadquarter);
  const others = (company.locations ?? []).filter((l) => l !== hq);

  return (
    <DashboardLayout
      title={company.name}
      subtitle={company.tagline || undefined}
      {...layoutProps}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refresh} disabled={refreshing}>{t.refresh}</Button>
          {company.profileUrl && (
            <Button variant="primary" onClick={() => window.open(company.profileUrl, '_blank', 'noopener,noreferrer')}>
              {t.openOnLinkedIn}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={company.name} src={company.logoUrl} size={44} />
          <div className="flex flex-wrap items-center gap-2">
            {company.viewerCanManage && <Badge tone="success" dot>{t.manage}</Badge>}
            {company.claimed && company.website && (
              <a className="text-[var(--ui-text-secondary)] underline" href={company.website} target="_blank" rel="noopener noreferrer">
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile label={t.tiles.followers} value={number(company.followersCount)} />
          <StatTile label={t.tiles.employees} value={employeesLabel(company)} />
          <StatTile label={t.tiles.founded} value={company.foundedYear ?? '—'} />
          <StatTile label={t.tiles.industry} value={company.industry?.[0] ?? '—'} caption={company.industry?.slice(1).join(', ') || undefined} />
        </div>

        <section className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-5 flex flex-col gap-2">
          <h2 className="font-medium">{t.about}</h2>
          <p className="whitespace-pre-line text-[var(--ui-text-secondary)]">{company.description || t.noAbout}</p>
        </section>

        {(hq || others.length > 0) && (
          <section className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-5 flex flex-col gap-2">
            <h2 className="font-medium">{t.locations}{company.locationCount > 1 ? ` (${company.locationCount})` : ''}</h2>
            <ul className="flex flex-col gap-1 text-[var(--ui-text-secondary)]">
              {hq && <li><span className="font-medium text-[var(--ui-text-primary)]">{t.headquarters}:</span> {placeLine(hq)}</li>}
              {others.slice(0, 8).map((l, i) => <li key={i}>{placeLine(l)}</li>)}
            </ul>
          </section>
        )}

        {data.fetchedAt && (
          <p className="text-[var(--ui-text-secondary)]">{t.fresh(absoluteTime(data.fetchedAt))}</p>
        )}
      </div>
    </DashboardLayout>
  );
}
