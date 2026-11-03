import { LinkedInIcon } from 'src/core/icons';
import { Check, Info } from 'lucide-react';
import { Badge, Tooltip } from 'src/core/primitives';
import { TextCell, PersonCell, CompanyCell, LocationCell, LinkCell } from 'src/core/DataTable';

/**
 * Plain email link.
 *
 * Deliberately NOT the shared EmailCell: that renders "Locked — upgrade your
 * plan" when empty, which would be actively misleading here. A staged row has
 * no email because nobody has enriched it yet, not because the plan is
 * withholding it.
 */
function StagedEmail({ value }) {
  if (!value) return <span className="text-[var(--ui-text-tertiary)]">—</span>;
  return (
    <a
      href={`mailto:${value}`}
      onClick={(e) => e.stopPropagation()}
      className="truncate text-[var(--ui-accent-fg)] hover:underline"
    >
      {value}
    </a>
  );
}

/**
 * 2026-09-18: 'queued' now means "sending — being resolved through LinkedIn
 * right now", not "waiting its turn for the old extension-driven enrichment"
 * (that path is retired, see importedLeads/routes.js on the backend). A row
 * in this status simply vanishes from the table once it lands in Hub Leads;
 * 'enriching'/'enriched' are not set by the current pipeline but are kept
 * for schema compatibility with older staged rows.
 */
const ENRICH_STATUS = {
  pending:   { label: 'Not sent',  tone: 'neutral', dot: false },
  queued:    { label: 'Sending…',  tone: 'info',    dot: true, pulse: true },
  enriching: { label: 'Sending…',  tone: 'info',    dot: true, pulse: true },
  enriched:  { label: 'Enriched',  tone: 'success', dot: true },
  failed:    { label: 'Failed',    tone: 'danger',  dot: true },
};

/**
 * Where the row's LinkedIn URL came from — the one provenance fact worth a
 * column. "CSV Import" on every row said nothing; "Found by Spurly" tells the
 * user which rows a machine matched and are worth a glance before sending.
 */
function SourceCell({ row }) {
  if (row.origin === 'extension') return <Badge variant="minimal" tone="accent" dot>Extension</Badge>;
  if (row.linkedinUrlSource === 'spurly') {
    return (
      <Badge
        variant="minimal"
        tone="info"
        dot
        title="Your file had no LinkedIn URL for this person — Spurly found it by name + company."
      >
        Found by Spurly
      </Badge>
    );
  }
  return <Badge variant="minimal" tone="neutral">Your file</Badge>;
}

export function EnrichStatusCell({ value, row = {} }) {
  const s = ENRICH_STATUS[value] || ENRICH_STATUS.pending;
  // The reason a row failed is the one thing the user needs next, so it gets a
  // visible (i) beside the badge — a bare `title` on the badge gives no hint
  // that anything is there to hover.
  const failReason = value === 'failed'
    ? row.enrichError || 'LinkedIn could not load this profile. Check the LinkedIn URL in your file.'
    : '';

  return (
    <span className="flex items-center gap-2 min-w-0">
      <Badge variant="minimal" tone={s.tone} dot={s.dot} pulse={s.pulse}>
        {s.label}
      </Badge>
      {failReason && (
        <Tooltip content={failReason} placement="top">
          <span
            tabIndex={0}
            role="img"
            aria-label="Why this failed"
            className="inline-flex items-center justify-center text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-secondary)] cursor-help"
          >
            <Info size={14} />
          </span>
        </Tooltip>
      )}
      {row.alreadyInHub && (
        <Badge
          size="sm"
          tone="accent"
          title="Already in your Hub leads. Moving them updates the existing record."
        >
          <Check size={10} /> In Hub
        </Badge>
      )}
    </span>
  );
}

/**
 * Staging table — rows imported but not yet sent to the Hub.
 *
 * Shows Email alongside the basics because it's the clearest signal that
 * enrichment actually produced something, so the user can see at a glance
 * whether a run was worth the credits.
 */
export const stagingColumns = [
  {
    key: 'profileUrl',
    label: <LinkedInIcon size={14} aria-label="LinkedIn" />,
    width: 44,
    align: 'center',
    render: (value) => <LinkCell href={value} icon={<LinkedInIcon size={14} />} label="Open LinkedIn profile" />,
  },
  {
    key: 'name',
    label: 'Name',
    width: 200,
    title: (row) => row.name,
    render: (value, row) => <PersonCell name={value} avatar={row.avatarUrl || row.avatar} profileUrl={row.profileUrl} />,
  },
  {
    key: 'enrichStatus',
    label: 'Status',
    width: 160,
    render: (value, row) => <EnrichStatusCell value={value} row={row} />,
  },
  {
    key: 'linkedinUrlSource',
    label: 'LinkedIn URL from',
    width: 160,
    render: (_v, row) => <SourceCell row={row} />,
  },
  { key: 'title', label: 'Title', width: 190, render: (value) => <TextCell value={value} tone="secondary" /> },
  { key: 'company', label: 'Company', width: 160, render: (value) => <CompanyCell value={value} /> },
  { key: 'email', label: 'Email', width: 200, render: (value) => <StagedEmail value={value} /> },
  { key: 'location', label: 'Location', width: 170, render: (value) => <LocationCell value={value} /> },

  { key: 'sourceFile', label: 'File', width: 150, render: (value) => <TextCell value={value} tone="tertiary" /> },
];
