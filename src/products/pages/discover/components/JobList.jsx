import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button } from 'src/core/primitives';
import { ExternalIcon } from 'src/core/icons';
import { relativeTime } from 'src/shared/utils/outreach.js';
import { companyPath, findPeopleState, groupJobsByCompany } from 'src/products/discover/format.js';
import { discoverStrings } from '../strings.js';

const t = discoverStrings.jobs;
const tc = discoverStrings.company;

const SHOWN_ROLES = 3;

function ago(value) {
  const rel = relativeTime(value);
  if (!rel) return '';
  return rel === 'just now' ? rel : `${rel} ago`;
}

function JobLine({ job }) {
  return (
    <li className="flex items-center gap-2 text-[length:var(--ui-t-label)]">
      <span className="text-[var(--ui-text-primary)] truncate">{job.title}</span>
      <span className="text-[var(--ui-text-tertiary)] truncate">{[job.location, ago(job.postedAt)].filter(Boolean).join(' · ')}</span>
      {job.promoted && <Badge tone="neutral">{t.promoted}</Badge>}
      {job.easyApply && <Badge tone="info">{t.easyApply}</Badge>}
      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`${t.openJob}: ${job.title}`}
          className="text-[var(--ui-text-tertiary)] hover:text-[var(--ui-accent-fg)] shrink-0"
        >
          <ExternalIcon size={13} />
        </a>
      )}
    </li>
  );
}

/** Job results grouped by hiring company: the company is the lead, the roles are the reason. */
export function JobList({ jobs }) {
  const navigate = useNavigate();
  const groups = useMemo(() => groupJobsByCompany(jobs), [jobs]);

  return (
    <ul>
      {groups.map((g) => (
        <li key={g.key} className="flex items-start gap-3 px-4 py-3.5 border-b border-[var(--ui-border)] last:border-b-0">
          <Avatar src={g.company?.logoUrl} name={g.company?.name || '?'} size={36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--ui-text-primary)]">{g.company?.name || t.noCompany}</span>
              <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">{t.roles(g.jobs.length)}</span>
            </div>
            <ul className="mt-1 flex flex-col gap-0.5">
              {g.jobs.slice(0, SHOWN_ROLES).map((job) => <JobLine key={job.jobId} job={job} />)}
            </ul>
            {g.jobs.length > SHOWN_ROLES && (
              <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)] mt-0.5">{t.moreRoles(g.jobs.length - SHOWN_ROLES)}</p>
            )}
          </div>
          {g.company && (
            <div className="flex items-center gap-2 shrink-0">
              {companyPath(g.company) && (
                <Button size="sm" onClick={() => navigate(companyPath(g.company))}>{tc.openCompany}</Button>
              )}
              <Button size="sm" variant="primary" onClick={() => navigate('/hub/leads', { state: findPeopleState(g.company) })}>
                {tc.findPeople}
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
