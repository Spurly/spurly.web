import { Badge } from 'src/common/components/Badge';
import { Linkedin, Mail } from 'lucide-react';

/**
 * Column configuration for the Captured Leads DataTable.
 * Kept out of the page component so the page stays declarative and the
 * config is independently testable/reusable.
 */
export const capturedLeadsColumns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-spurly object-cover" />
        <p className="text-label font-semibold text-spurly-navy-light">{row.name}</p>
      </div>
    ),
  },
  { key: 'title', label: 'Title', sortable: true },
  {
    key: 'company',
    label: 'Company',
    sortable: true,
    render: (company) => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-spurly bg-spurly-surface-bg flex items-center justify-center text-xs font-semibold text-spurly-navy-light">
          {company?.charAt(0)}
        </div>
        <span>{company}</span>
      </div>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    render: (email) => (
      <a
        href={`mailto:${email}`}
        onClick={(e) => e.stopPropagation()}
        className="text-label text-spurly-purple hover:text-spurly-blue transition flex items-center gap-1"
      >
        {email}
        <Mail size={14} />
      </a>
    ),
  },
  {
    key: 'enrichmentStatus',
    label: 'Enrichment',
    render: (status) => <Badge variant="success">{status}</Badge>,
  },
  {
    key: 'aiScore',
    label: 'AI Score',
    sortable: true,
    render: (score) => (
      <span className="text-label font-semibold text-spurly-navy-light">{score}</span>
    ),
  },
  {
    key: 'capturedOn',
    label: 'Captured On',
    sortable: true,
    render: (val) => <span className="text-spurly-text-secondary">{val}</span>,
  },
  {
    key: 'source',
    label: 'Source',
    render: () => <Linkedin size={16} className="text-spurly-purple" />,
  },
];

/** Tab definitions for the Captured Leads page. */
export const buildCapturedLeadsTabs = (total) => [
  { id: 'all', label: 'All Leads', count: total || '0' },
  { id: 'new', label: 'New', count: '248' },
  { id: 'enriching', label: 'Enriching', count: '156' },
  { id: 'enriched', label: 'Enriched', count: '892' },
  { id: 'failed', label: 'Failed', count: '12' },
];
