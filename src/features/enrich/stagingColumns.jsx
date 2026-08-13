import { Linkedin, Check } from 'lucide-react';
import { Badge } from 'src/ui/primitives';
import { TextCell, PersonCell, CompanyCell, LinkCell } from 'src/components/DataTable';

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

const ENRICH_STATUS = {
  pending:   { label: 'Not enriched', tone: 'neutral', dot: false },
  queued:    { label: 'Queued',       tone: 'warning', dot: true },
  enriching: { label: 'Enriching',    tone: 'info',    dot: true, pulse: true },
  enriched:  { label: 'Enriched',     tone: 'success', dot: true },
  failed:    { label: 'Failed',       tone: 'danger',  dot: true },
};

export function EnrichStatusCell({ value, row = {} }) {
  const s = ENRICH_STATUS[value] || ENRICH_STATUS.pending;
  // The failure reason is the most useful thing here, and a tooltip keeps it
  // out of the way until something has actually gone wrong.
  const title = value === 'failed' && row.enrichError ? row.enrichError : undefined;

  return (
    <span className="flex items-center gap-2 min-w-0">
      <Badge
        variant="minimal"
        tone={s.tone}
        dot={s.dot}
        pulse={s.pulse}
        title={title}
      >
        {s.label}
      </Badge>
      {row.alreadyInPeople && (
        <Badge
          size="sm"
          tone="accent"
          title="Already in your People list. Moving them updates the existing record."
        >
          <Check size={10} className="mr-0.5" /> In People
        </Badge>
      )}
    </span>
  );
}

/**
 * Staging table — rows imported but not yet moved into People.
 *
 * Shows Email alongside the basics because it's the clearest signal that
 * enrichment actually produced something, so the user can see at a glance
 * whether a run was worth the credits.
 */
export const stagingColumns = [
  {
    key: 'profileUrl',
    label: <Linkedin size={14} aria-label="LinkedIn" />,
    width: 44,
    align: 'center',
    render: (value) => <LinkCell href={value} icon={<Linkedin size={14} />} label="Open LinkedIn profile" />,
  },
  {
    key: 'name',
    label: 'Name',
    width: 200,
    title: (row) => row.name,
    render: (value, row) => <PersonCell name={value} avatar={row.avatar} />,
  },
  {
    key: 'enrichStatus',
    label: 'Status',
    width: 200,
    render: (value, row) => <EnrichStatusCell value={value} row={row} />,
  },
  { key: 'title', label: 'Title', width: 190, render: (value) => <TextCell value={value} tone="secondary" /> },
  { key: 'company', label: 'Company', width: 160, render: (value) => <CompanyCell value={value} /> },
  { key: 'email', label: 'Email', width: 200, render: (value) => <StagedEmail value={value} /> },
  { key: 'location', label: 'Location', width: 170, render: (value) => <TextCell value={value} tone="secondary" /> },
  { key: 'sourceFile', label: 'Source', width: 170, render: (value) => <TextCell value={value} tone="tertiary" /> },
];
