import { ChevronRight } from 'lucide-react';
import { LinkedInIcon } from 'src/core/icons';
import { Avatar, Badge } from 'src/core/primitives';
import { TextCell, PersonCell, CompanyCell, LocationCell, LinkCell } from 'src/core/DataTable';

/**
 * Columns for the Find profiles table — one row per CSV row that had a name
 * + company but no LinkedIn URL. "Name / Company / Title / Location" are what
 * the user's FILE said; "LinkedIn match" is what Spurly found.
 */

export const LOOKUP_STATUS = {
  queued:       { label: 'Waiting',       tone: 'neutral', dot: true },
  searching:    { label: 'Searching…',    tone: 'info',    dot: true, pulse: true },
  needs_review: { label: 'Needs review',  tone: 'warning', dot: true },
  matched:      { label: 'Sent to Hub',   tone: 'success', dot: true },
  picked:       { label: 'You picked',    tone: 'success', dot: true },
  not_found:    { label: 'Not found',     tone: 'neutral', dot: false },
  failed:       { label: 'Search failed', tone: 'danger',  dot: true },
};

const slug = (url = '') => url.replace(/^https:\/\/www\.linkedin\.com/, '');

/** Overlapping faces of the candidates. The whole row opens the review drawer. */
function CandidateStack({ candidates = [] }) {
  const shown = candidates.slice(0, 4);
  return (
    <span className="flex items-center gap-2 min-w-0" title="Click to pick the right person">
      <span className="flex -space-x-2 shrink-0">
        {shown.map((c) => (
          <span key={c.profileUrl} className="rounded-full ring-2 ring-[var(--ui-surface-card)]">
            <Avatar src={c.profilePictureUrl || null} name={c.name} size={22} />
          </span>
        ))}
      </span>
      <span className="truncate text-[length:var(--ui-t-label)] font-medium text-[var(--ui-accent-fg)]">
        {candidates.length} possible — choose
      </span>
      <ChevronRight size={13} className="shrink-0 text-[var(--ui-accent-fg)]" />
    </span>
  );
}

/** The person Spurly found (or the user picked). */
function FoundProfile({ row }) {
  const p = row.matchedProfile || {};
  return (
    <a
      href={row.matchedProfileUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2 min-w-0 group"
      title={p.headline || row.matchedProfileUrl}
    >
      <Avatar src={p.profilePictureUrl || null} name={p.name || row.input?.name} size={22} />
      <span className="min-w-0 flex flex-col leading-tight">
        <span className="truncate text-[length:var(--ui-t-label)] text-[var(--ui-text-primary)] group-hover:underline">
          {p.name || slug(row.matchedProfileUrl)}
          {row.matchedCount > 1 && (
            <span className="text-[var(--ui-text-tertiary)]"> +{row.matchedCount - 1} more</span>
          )}
        </span>
        {p.headline && (
          <span className="truncate text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">{p.headline}</span>
        )}
      </span>
    </a>
  );
}

function MatchCell({ row }) {
  if (row.status === 'needs_review') return <CandidateStack candidates={row.candidates} />;
  if (row.matchedProfileUrl) return <FoundProfile row={row} />;
  if (row.status === 'failed') {
    return <TextCell value={row.error || 'The search kept failing.'} tone="tertiary" />;
  }
  if (row.status === 'not_found') {
    return <TextCell value="Nobody by this full name at this company" tone="tertiary" />;
  }
  return <span className="text-[var(--ui-text-tertiary)]">—</span>;
}

export function buildLookupColumns() {
  return [
    {
      key: 'matchedProfileUrl',
      label: <LinkedInIcon size={14} aria-label="LinkedIn" />,
      width: 44,
      align: 'center',
      render: (value) => <LinkCell href={value} icon={<LinkedInIcon size={14} />} label="Open LinkedIn profile" />,
    },
    {
      key: 'name',
      label: 'Name',
      width: 200,
      title: (row) => row.input?.name,
      render: (_v, row) => (
        <PersonCell name={row.input?.name} avatar={row.matchedProfile?.profilePictureUrl || null} />
      ),
    },
    {
      key: 'company',
      label: 'Company',
      width: 170,
      render: (_v, row) => <CompanyCell value={row.input?.company} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: 140,
      render: (value) => {
        const s = LOOKUP_STATUS[value] || LOOKUP_STATUS.queued;
        return (
          <Badge variant="minimal" tone={s.tone} dot={s.dot} pulse={s.pulse}>
            {s.label}
          </Badge>
        );
      },
    },
    {
      key: 'match',
      label: 'LinkedIn match',
      width: 300,
      render: (_v, row) => <MatchCell row={row} />,
    },
    { key: 'title', label: 'Title', width: 180, render: (_v, row) => <TextCell value={row.input?.title} tone="secondary" /> },
    { key: 'location', label: 'Location', width: 160, render: (_v, row) => <LocationCell value={row.input?.location} /> },
    { key: 'sourceFile', label: 'File', width: 150, render: (value) => <TextCell value={value} tone="tertiary" /> },
  ];
}
