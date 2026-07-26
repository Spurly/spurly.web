import { Linkedin, Check, Mail } from 'lucide-react';
import {
  AvatarNameCell,
  CompanyCell,
  LinkedInCell,
} from 'src/common/components/DataTable/components';

/** Muted em-dash for empty cells — imported rows are sparse until enriched. */
function StagedText({ value }) {
  if (!value) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  return <span className="text-[13px] text-[var(--text-primary)]">{value}</span>;
}

/**
 * Plain email cell.
 *
 * Deliberately NOT the shared EmailCell: that one renders a "Locked — upgrade
 * your plan" state when empty, which would be actively misleading here. A
 * staged row has no email because nobody has enriched it yet, not because the
 * user's plan is withholding it.
 */
function StagedEmail({ value }) {
  if (!value) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  return (
    <a
      href={`mailto:${value}`}
      onClick={(e) => e.stopPropagation()}
      className="text-[13px] hover:underline transition inline-flex items-center gap-1"
      style={{ color: 'var(--brand-purple)' }}
    >
      {value}
      <Mail size={13} className="flex-shrink-0" />
    </a>
  );
}

/**
 * Visual treatment per enrichment state. Mirrors OutreachStatusCell's tone
 * vocabulary so the two tables read as the same design system.
 */
const ENRICH_STYLES = {
  pending: {
    label: 'Not enriched',
    background: 'var(--surface-sunken)',
    color: 'var(--text-tertiary)',
    dot: null,
  },
  queued: {
    label: 'Queued',
    background: 'var(--amber-tint)',
    color: 'var(--amber)',
    dot: 'var(--amber)',
  },
  enriching: {
    label: 'Enriching',
    background: 'var(--sky-tint)',
    color: 'var(--sky)',
    dot: 'var(--sky)',
  },
  enriched: {
    label: 'Enriched',
    background: 'var(--green-tint)',
    color: 'var(--green)',
    dot: 'var(--green)',
  },
  failed: {
    label: 'Failed',
    background: 'var(--red-tint)',
    color: 'var(--red)',
    dot: 'var(--red)',
  },
};

export function EnrichStatusCell({ value, row = {} }) {
  const style = ENRICH_STYLES[value] || ENRICH_STYLES.pending;
  // The failure reason is the single most useful thing to surface here, and a
  // tooltip keeps it out of the way until something has actually gone wrong.
  const title = value === 'failed' && row.enrichError ? row.enrichError : undefined;

  return (
    <div className="flex items-center gap-1.5">
      <span
        title={title}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[999px] text-[12px] font-semibold whitespace-nowrap tracking-[0.01em]"
        style={{ background: style.background, color: style.color }}
      >
        {style.dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${value === 'enriching' ? 'animate-pulse' : ''}`}
            style={{ background: style.dot }}
          />
        )}
        {style.label}
      </span>
      {row.alreadyInPeople && (
        <span
          title="This person is already in your People list. Moving them will update the existing record."
          className="inline-flex items-center gap-1 px-2 py-1 rounded-[999px] text-[11px] font-semibold whitespace-nowrap"
          style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}
        >
          <Check size={11} /> In People
        </span>
      )}
    </div>
  );
}

/**
 * Column set for the staging table (leads that have been imported but not yet
 * moved into People).
 *
 * Deliberately shows Email alongside the basics: it's the clearest signal that
 * enrichment actually produced something, so the user can see at a glance
 * whether a run was worth the credits.
 */
export const stagingColumns = [
  {
    key: 'profileUrl',
    label: <Linkedin size={18} className="text-spurly-purple" />,
    width: '44px',
    minWidth: '44px',
    align: 'center',
    headerClassName: 'text-center',
    cellClassName: 'text-center',
    render: (value) => <LinkedInCell value={value} />,
  },
  {
    key: 'name',
    label: 'Name',
    width: '190px',
    minWidth: '150px',
    render: (value, row) => <AvatarNameCell value={value} row={row} />,
  },
  {
    key: 'enrichStatus',
    label: 'Status',
    width: '190px',
    minWidth: '150px',
    render: (value, row) => <EnrichStatusCell value={value} row={row} />,
  },
  {
    key: 'title',
    label: 'Title',
    width: '170px',
    minWidth: '140px',
    render: (value) => <StagedText value={value} />,
  },
  {
    key: 'company',
    label: 'Company',
    width: '150px',
    minWidth: '120px',
    render: (value) => <CompanyCell value={value} />,
  },
  {
    key: 'email',
    label: 'Email',
    width: '190px',
    minWidth: '150px',
    render: (value) => <StagedEmail value={value} />,
  },
  {
    key: 'location',
    label: 'Location',
    width: '160px',
    minWidth: '130px',
    render: (value) => <StagedText value={value} />,
  },
  {
    key: 'sourceFile',
    label: 'Source',
    width: '160px',
    minWidth: '130px',
    render: (value) => <StagedText value={value} />,
  },
];
